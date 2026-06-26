const Order = require('../models/Order')
const Cart = require('../models/Cart')
const InventoryService = require('./inventory.service')

class OrderService {

    static async createOrderFromCart(userId, cartId, orderData) {
        const cart = await Cart.findOne({
            _id: cartId,
            user: userId
        }).populate('items.product')

        if (!cart) {
            throw new Error('Cart not found')
        }

        if (cart.items.length === 0) {
            throw new Error('Cart is empty')
        }

        const availability = await InventoryService.checkAvailability(cart.items)
        if (!availability.available) {
            throw new Error(availability.error)
        }

        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            name: item.product.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
            productSnapshot: {
                name: item.product.name,
                price: item.product.price,
                image: item.product.images && item.product.images.length > 0
                    ? item.product.images[0].url
                    : null,
                sku: item.product.inventory?.sku || null
            }
        }))

        const subtotal = cart.subtotal
        const totalDiscount = cart.totalDiscount || 0
        const shippingCost = orderData.shippingCost || 0
        const tax = orderData.tax || 0
        const total = subtotal - totalDiscount + shippingCost + tax

        const order = new Order({
            user: userId,
            items: orderItems,
            shippingAddress: orderData.shippingAddress,
            billingAddress: orderData.billingAddress || orderData.shippingAddress,
            payment: {
                method: orderData.paymentMethod,
                status: 'pending'
            },
            subtotal,
            shippingCost,
            tax,
            discount: totalDiscount,
            total,
            appliedCoupons: cart.coupons || [],
            notes: orderData.notes,
            specialInstructions: orderData.specialInstructions,
            ipAddress: orderData.ipAddress,
            userAgent: orderData.userAgent
        })

        await InventoryService.reserveInventory(cart.items)

        await order.save()

        cart.clearCart()
        await cart.save()

        return order
    }

    static async getOrderById(orderId, userId) {
        const order = await Order.findOne({
            _id: orderId,
            user: userId
        })

        if (!order) {
            throw new Error('Order not found')
        }

        return order
    }

    static async cancelOrder(orderId, userId, reason = 'Cancelled by user') {
        const order = await Order.findOne({
            _id: orderId,
            user: userId
        })

        if (!order) {
            throw new Error('Order not found')
        }

        if (!order.canCancel()) {
            throw new Error('Order cannot be cancelled in its current state')
        }

        await InventoryService.restoreInventory(order.items)

        order.updateStatus('cancelled', reason, userId)

        if (order.payment.status === 'paid') {
            order.payment.status = 'refunded'
        }

        await order.save()

        return order
    }

    static async updateOrderStatus(orderId, status, note, adminId) {
        const order = await Order.findById(orderId)

        if (!order) {
            throw new Error('Order not found')
        }

        const validTransitions = {
            'pending': ['processing', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'cancelled'],
            'delivered': ['refunded'],
            'cancelled': [],
            'refunded': []
        }

        if (!validTransitions[order.status].includes(status)) {
            throw new Error(`Cannot transition from ${order.status} to ${status}`)
        }

        if (status === 'shipped' && !order.tracking.number) {
            throw new Error('Tracking number required for shipping')
        }

        if (status === 'delivered') {
            order.tracking.deliveredAt = new Date()
        }

        order.updateStatus(status, note, adminId)
        await order.save()

        return order
    }

    static async getOrderStats(userId) {
        return await Order.getUserStats(userId)
    }
}

module.exports = OrderService 