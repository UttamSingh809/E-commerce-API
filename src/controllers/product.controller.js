const Product=require('../models/Product')
const Category=require('../models/Category')

async function createProduct(req,res){
    try{
        const { name, description, shortDiscription, price, comparePrice, category, stock, tags, isFeatured} = req.body

        const categoryExists=await Category.findById(category)
        if(!categoryExists){
            return res.status(404).json({
                success:false,
                message:'Category not found'
            })
        }

        const product=await Product.create({
            name,
            description,
            shortDiscription,
            price,
            comparePrice,
            category,
            stock,
            tags:tags|| [],
            isFeatured:isFeatured || false
        })
        
        res.status(201).json({
            success:true,
            product
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

async function getAllProducts(req,res){
    try{
        //Build filter
        const filter={isActive:true}

        //Category filter
        if(req.query.category){
            filter.category=req.query.category
        }

        //Price range filter
        if(req.query.minPrice || req.query.minPrice){
            filter.price={}
            if(req.query.minPrice){
                filter.price.$gte=Number(req.query.minPrice)
            }
            if(req.query.maxPrice){
                filter.price.$lte=Number(req.query.maxPrice)
            }
        }

        //Featured Filter
        if(req.query.featured==='true'){
            filter.isFeatured=true
        }
        
        //Search
        let searchFilter={}
        if(req.query.search){
            searchFilter={
                $or:[
                    {name:{$regex: req.query.search, $options:'i'}},
                    {description:{$regex:req.query.search,$options:'i'}},
                    {tags:{$in:[req.query.search]}}
                ]
            }
        }

        //Pagination
        const page=parseInt(req.query.page)||1
        const limit=parseInt(req.query.limit)||10
        const skip=(page-1)*limit

        //Sorting
        let sort='-createdAt'
        if(req.query.sort==='price_asc') sort='price'
        if(req.query.sort==='price_desc') sort='-price'
        if(req.query.sort==='name') sort='name'
        if(req.query.sort==='featured') sort='-isFeatured'
        if(req.query.sort==='popular') sort='-ratings.count'

        const product=await Product.find({...filter, ...searchFilter})
            .populate('category','name slug')
            .sort(sort)
            .limit(limit)
            .skip(skip)
            
        const total=await Product.countDocuments({...filter, ...searchFilter})

        res.json({
            success:true,
            count:product.length,
            total,
            page,
            totalPages:Math.ceil(total/limit),
            product
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

async function getProduct(req,res){
    try{
        const product=await Product.findById(req.params.id)
            .populate('category','name slug description')

        if(!product){
            return res.status(404).json({
                success:false,
                message:'Product not found'
            })
        }

        product.viewCount=(product.viewCount || 0) + 1
        await product.save()

        res.json({
            success:true,
            product
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

async function updateProduct(req,res){
    try{
        if(req.body.category){
            const categoryExists=await Category.findById(req.body.category)
            if(!categoryExists){
                return res.status(404).json({
                    success:false,
                    message:'Category not found'
                })
            }
        }

        const product=await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new:true, runValidators:true}
        )

        if(!product){
            return res.status(404).json({
                success:false,
                message:'Product not found'
            })
        }

        res.json({
            success:true,
            product
        })
    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

async function deleteProduct(req,res){
    try{
        const product=await Product.findByIdAndUpdate(
            req.params.id,
            {isActive:false},   //Soft deletion
            {new:true}
        )

        if(!product){
            return res.status(404).json({
                success:false,
                message:'Product not found'
            })
        }

        res.json({
            success:true,
            message:'Product deleted successfully'
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

module.exports={
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct
}