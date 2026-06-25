const Category = require('../models/Category')

async function createCategory(req, res) {
    try {
        const { name, description, image, parentId } = req.body
        const existingCategory = await Category.findOne({ name })
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists'
            })
        }
        if (parentId) {
            const parentCategory = await Category.findById(parentId)
            if (!parentCategory) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent category not found'
                })
            }
        }
        
        const category = await Category.create({
            name,
            description,
            image,
            parentId: parentId || null,
            level: parentId ? 2 : 1
        })

        res.status(201).json({
            success:true,
            category
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function getAllCategories(req, res) {
    try {
        const categories = await Category.find({ isActive: true })
            .populate('parentId', 'name slug')
            .sort('name')

        const categoryTree = buildCategoryTree(categories)

        res.json({
            success: true,
            count: categories.length,
            categories: categoryTree
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

function buildCategoryTree(categories, parentId = null) {
    return categories
        .filter(cat => {
            if (!cat.parentId && !parentId) return true;
            if (cat.parentId && parentId) {
                return cat.parentId._id.toString() === parentId.toString();
            }
            return false;
        })
        .map(cat => ({
            ...cat.toObject(),
            children: buildCategoryTree(categories, cat._id)
        }));
}

async function getCategory(req, res) {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parentId', 'name slug')

        if (!category) {
            res.status(404).json({
                status: false,
                message: 'Category not found'
            })
        }

        const subCategories = await Category.find({
            parentId: category._id,
            isActive: true
        })

        res.json({
            success: true,
            category,
            subCategories
        })
    }
    catch (err) {
        res.status(500).json({

        })
    }
}

async function updateCategory(req, res) {
    try {
        const { name, description, image, parentId } = req.body

        if (parentId) {
            const parentCategory = await Category.findById(parentId)
            if (!parentCategory) {
                return res.status(404).json({
                    sucess: false,
                    message: 'Parent category not found'
                })
            }

            if (parentId === req.params.id) {
                res.status(400).json({
                    success: false,
                    message: 'Category cannot be its own parent'
                })
            }
        }
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, image, parentId: parentId || null },
            { new: true, runValidators: true }
        )

        if (!category) {
            res.status(404).json({
                success: false,
                message: err.message
            })
        }

        res.json({
            success: true,
            category
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function deleteCategory(req, res) {
    try {
        //Soft Delete 
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        )

        if (!category) {
            return res.status(404).json({
                sucess: false,
                message: err.message
            })
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        })
    }
    catch (err) {
        res.status(500).json({
            sucess: false,
            message: err.message
        })
    }
}

module.exports = {
    createCategory,
    getAllCategories,
    getCategory,
    updateCategory,
    deleteCategory
};