const express = require('express')
const router = express.Router()
const orderController = require('../controllers/order.controller')
const { protect, adminOnly } = require('../middleware/auth.middleware')

router.get('/', protect, orderController.getOrders)
router.get('/:id', protect, orderController.getOrder)
router.post('/', protect, orderController.createOrder)
router.put('/:id/cancel', protect, orderController.cancelOrder)
router.put('/:id/status', protect, adminOnly, orderController.updateOrderStatus)
router.put('/:id/tracking', protect, adminOnly, orderController.addTracking)
router.put('/:id/payment', protect, adminOnly, orderController.processPayment)

module.exports = router 