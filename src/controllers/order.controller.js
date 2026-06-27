const OrderService = require('../services/order.service')
const Cart = require('../models/Cart')
const Order = require('../models/Order')

exports.createOrder = async (req, res) => {
    try {
        const {
            cartId,
            shippingAddress,
            billingAddress,
            paymentMethod,
            notes,
            specialInstructions
        } = req.body

        if (!cartId) {
            return res.status(400).json({
                success: false,
                message: 'Cart ID is required'
            })
        }

        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address is required'
            })
        }

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Payment method is required'
            })
        }

        const cart = await Cart.findOne({ _id: cartId, user: req.user.id })
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            })
        }

        const order = await OrderService.createOrderFromCart(
            req.user.id,
            cartId,
            {
                shippingAddress,
                billingAddress,
                paymentMethod,
                notes,
                specialInstructions,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        )

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order
        })
    } catch (error) {
        console.log(error)
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

exports.getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const status = req.query.status

        const filter = { user: req.user.id }
        if (status) {
            filter.status = status
        }

        const skip = (page - 1) * limit

        const orders = await Order.find(filter)
            .sort('-createdAt')
            .limit(limit)
            .skip(skip)

        const total = await Order.countDocuments(filter)

        const stats = await OrderService.getOrderStats(req.user.id)

        res.json({
            success: true,
            orders,
            stats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getOrder = async (req, res) => {
    try {
        const order = await OrderService.getOrderById(req.params.id, req.user.id)

        res.json({
            success: true,
            order
        })
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        })
    }
}

exports.cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body
        const order = await OrderService.cancelOrder(
            req.params.id,
            req.user.id,
            reason || 'Cancelled by user'
        )

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            })
        }

        const order = await OrderService.updateOrderStatus(
            req.params.id,
            status,
            note || `Status updated to ${status}`,
            req.user.id
        )

        res.json({
            success: true,
            message: 'Order status updated successfully',
            order
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

exports.addTracking = async (req, res) => {
    try {
        const { trackingNumber, carrier, trackingUrl } = req.body

        if (!trackingNumber) {
            return res.status(400).json({
                success: false,
                message: 'Tracking number is required'
            })
        }

        const order = await Order.findById(req.params.id)
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            })
        }

        order.tracking.number = trackingNumber
        order.tracking.carrier = carrier || 'Unknown'
        order.tracking.url = trackingUrl || ''
        order.tracking.shippedAt = new Date()

        await order.save()

        res.json({
            success: true,
            message: 'Tracking added successfully',
            order
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.processPayment = async (req, res) => {
    try {
        const { orderId, transactionId, paymentId } = req.body

        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            })
        }

        if (order.payment.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Order already paid'
            })
        }

        order.markAsPaid(transactionId, paymentId)
        await order.save()

        res.json({
            success: true,
            message: 'Payment processed successfully',
            order
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
} 