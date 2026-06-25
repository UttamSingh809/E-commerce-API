const express = require('express')
const router = express.Router()
const categoryController=require('../controllers/category.controller')
const {protect,adminOnly}=require('../middleware/auth.middleware')

router.get('/',categoryController.getAllCategories)
router.get('/:id',categoryController.getCategory)
//router.get('/:id/products',categoryController.getCategoryProducts)

router.post('/',protect,adminOnly,categoryController.createCategory)
router.put('/:id',protect,adminOnly,categoryController.updateCategory)
router.delete('/:id',protect,adminOnly,categoryController.deleteCategory)

module.exports=router