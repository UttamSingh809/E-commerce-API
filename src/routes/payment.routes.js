const express = require('express')  
const router = express.Router()  
const paymentController = require('../controllers/payment.controller')  
const { protect, adminOnly } = require('../middleware/auth.middleware')  

router.get('/success', paymentController.paymentSuccess);

router.get('/cancel', paymentController.paymentCancel);

router.post('/create-order', protect, paymentController.createPayPalOrder)  

router.post('/capture', protect, paymentController.capturePayment)  

router.get('/status/:orderId', protect, paymentController.getPaymentStatus)  

router.get('/methods', protect, paymentController.getPaymentMethods)  

router.get('/history', protect, paymentController.getPaymentHistory)  

router.post('/refund/:orderId', protect, adminOnly, paymentController.processRefund)  

module.exports = router  