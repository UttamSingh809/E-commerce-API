const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cart.controller')
const { protect } = require('../middleware/auth.middleware')

router.use(protect)

router.get('/', cartController.getCart)
router.post('/items', cartController.addToCart)
router.put('/items/:productId',cartController.updateCartItem)
router.delete('/items/:productId',cartController.removeFromCart)
router.delete('/',cartController.clearCart)

module.exports = router