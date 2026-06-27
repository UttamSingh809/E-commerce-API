const PaymentService = require('../services/payment.service') 
const Order = require('../models/Order') 

exports.createPayPalOrder = async (req, res) => {
    try {
        const { orderId, returnUrl, cancelUrl } = req.body 

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            }) 
        }

        const order = await Order.findOne({
            _id: orderId,
            user: req.user.id
        }) 

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            }) 
        }

        const result = await PaymentService.createPayPalOrder(
            orderId,
            returnUrl,
            cancelUrl
        ) 

        res.json({
            success: true,
            data: {
                paypalOrderId: result.paypalOrderId,
                approvalUrl: result.approvalUrl,
                orderId: result.orderId,
                orderNumber: result.orderNumber,
                status: result.status
            }
        }) 
    } catch (error) {
        console.error('Create PayPal order error:', error) 
        res.status(500).json({
            success: false,
            message: error.message
        }) 
    }
} 

exports.capturePayment = async (req, res) => {
    try {
        const { orderId, paypalOrderId } = req.body 

        if (!orderId || !paypalOrderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and PayPal Order ID are required'
            }) 
        }

        const order = await Order.findOne({
            _id: orderId,
            user: req.user.id
        }) 

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            }) 
        }

        const result = await PaymentService.capturePayPalPayment(orderId, paypalOrderId) 

        res.json({
            success: result.success,
            message: result.message,
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: result.order?.status,
                paymentStatus: result.order?.payment?.status,
                capture: result.capture || null
            }
        }) 
    } catch (error) {
        console.error('Capture payment error:', error) 
        res.status(500).json({
            success: false,
            message: error.message
        }) 
    }
} 
exports.paymentSuccess = async (req, res) => {
    try {
        const { orderId, token, PayerID } = req.query

        console.log('✅ Payment Success!')
        console.log('Order ID:', orderId)
        console.log('Token:', token)
        console.log('Payer ID:', PayerID)

        if (req.headers.accept?.includes('application/json')) {
            return res.json({
                success: true,
                message: 'Payment completed successfully!',
                data: {
                    orderId,
                    token,
                    PayerID,
                    status: 'pending_capture',
                    nextSteps: 'Capture the payment using the capture endpoint'
                }
            })
        }

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Successful</title>
                <style>
                    body { font-family: Arial; text-align: center; padding: 50px; }
                    .success { color: green; font-size: 24px; }
                    .details { margin: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="success">✅ Payment Successful!</div>
                <div class="details">
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Order Number:</strong> ${PayerID}</p>
                    <p><strong>Status:</strong> Pending Capture</p>
                    <p><small>Please capture the payment via the API</small></p>
                </div>
            </body>
            </html>
        `)
    } catch (error) {
        console.error('Payment success error:', error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.paymentCancel = (req, res) => {
    try {
        const { orderId } = req.query

        console.log('❌ Payment Cancelled for order:', orderId)

        if (req.headers.accept?.includes('application/json')) {
            return res.json({
                success: false,
                message: 'Payment was cancelled',
                data: { orderId }
            })
        }

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Cancelled</title>
                <style>
                    body { font-family: Arial; text-align: center; padding: 50px; }
                    .cancel { color: orange; font-size: 24px; }
                </style>
            </head>
            <body>
                <div class="cancel">⚠️ Payment Cancelled</div>
                <p>You cancelled the payment. No charges were made.</p>
                <p><small>Order ID: ${orderId || 'N/A'}</small></p>
                <a href="/">Return to Home</a>
            </body>
            </html>
        `)
    } catch (error) {
        console.error('Payment cancel error:', error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params 

        const order = await Order.findOne({
            _id: orderId,
            user: req.user.id
        }).select('orderNumber status payment') 

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            }) 
        }

        res.json({
            success: true,
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                paymentStatus: order.payment.status,
                paidAt: order.payment.paidAt
            }
        }) 
    } catch (error) {
        console.error('Get payment status error:', error) 
        res.status(500).json({
            success: false,
            message: error.message
        }) 
    }
} 

exports.getPaymentMethods = async (req, res) => {
    try {
        const methods = await PaymentService.getPaymentMethods() 

        res.json({
            success: true,
            data: methods
        }) 
    } catch (error) {
        console.error('Get payment methods error:', error) 
        res.status(500).json({
            success: false,
            message: error.message
        }) 
    }
} 

exports.getPaymentHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1 
        const limit = parseInt(req.query.limit) || 10 

        const result = await PaymentService.getPaymentHistory(
            req.user.id,
            page,
            limit
        ) 

        res.json({
            success: true,
            data: result
        }) 
    } catch (error) {
        console.error('Payment history error:', error) 
        res.status(500).json({
            success: false,
            message: error.message
        }) 
    }
} 

exports.processRefund = async (req, res) => {
    try {
        const { orderId } = req.params 
        const { amount, reason } = req.body 

        const result = await PaymentService.processRefund(
            orderId,
            amount,
            reason || 'Refund requested'
        ) 

        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: result
        }) 
    } catch (error) {
        console.error('Refund error:', error) 
        res.status(500).json({
            success: false,
            message: error.message
        }) 
    }
} 