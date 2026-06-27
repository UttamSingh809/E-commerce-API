const { getPayPalClient } = require('../config/paypal.config')  
const paypal = require('@paypal/checkout-server-sdk')  
const Order = require('../models/Order')  
const Cart = require('../models/Cart')  
const InventoryService = require('./inventory.service')  
const { getCountryCode } = require('../utils/helpers')  

class PaymentService {
    
    static async createPayPalOrder(orderId, returnUrl, cancelUrl) {
        try {
            const order = await Order.findById(orderId)  
            if (!order) throw new Error('Order not found')  
            if (order.payment.status === 'paid') throw new Error('Order already paid')  
            if (order.status !== 'pending') throw new Error('Order cannot be paid in current status')  

            const countryCode = getCountryCode(order.shippingAddress?.country || 'India')  

            const shippingAddress = {
                address_line_1: order.shippingAddress?.street || '123 Main St',
                address_line_2: order.shippingAddress?.apartment || '',
                admin_area_2: order.shippingAddress?.city || 'Mumbai',
                admin_area_1: order.shippingAddress?.state || 'Maharashtra',
                postal_code: order.shippingAddress?.zipCode || '400001',
                country_code: countryCode
            }  

            const request = new paypal.orders.OrdersCreateRequest()  
            request.prefer('return=representation')  
            request.requestBody({
                intent: 'CAPTURE',
                purchase_units: [{
                    reference_id: order.orderNumber,
                    description: `Order ${order.orderNumber}`,
                    amount: {
                        currency_code: process.env.PAYPAL_CURRENCY || 'USD',
                        value: order.total.toFixed(2),
                        breakdown: {
                            item_total: {
                                currency_code: process.env.PAYPAL_CURRENCY || 'USD',
                                value: order.subtotal.toFixed(2)
                            },
                            shipping: {
                                currency_code: process.env.PAYPAL_CURRENCY || 'USD',
                                value: order.shippingCost.toFixed(2)
                            },
                            tax_total: {
                                currency_code: process.env.PAYPAL_CURRENCY || 'USD',
                                value: order.tax.toFixed(2)
                            },
                            discount: {
                                currency_code: process.env.PAYPAL_CURRENCY || 'USD',
                                value: order.discount.toFixed(2)
                            }
                        }
                    },
                    items: order.items.map(item => ({
                        name: item.name.substring(0, 127),
                        description: item.name.substring(0, 127),
                        unit_amount: {
                            currency_code: process.env.PAYPAL_CURRENCY || 'USD',
                            value: item.price.toFixed(2)
                        },
                        quantity: item.quantity.toString(),
                        category: 'PHYSICAL_GOODS'
                    })),
                    shipping: {
                        name: {
                            full_name: order.shippingAddress?.name || 'Customer'
                        },
                        address: shippingAddress
                    }
                }],
                application_context: {
                    return_url: returnUrl || `${process.env.PAYPAL_SUCCESS_URL}?orderId=${orderId}`,
                    cancel_url: cancelUrl || `${process.env.PAYPAL_CANCEL_URL}?orderId=${orderId}`,
                    shipping_preference: 'SET_PROVIDED_ADDRESS',
                    user_action: 'PAY_NOW'
                }
            })  

            const client = getPayPalClient()  
            const response = await client.execute(request)  

            const paypalOrderId = response.result.id  
            order.payment.paymentId = paypalOrderId  
            order.payment.transactionId = paypalOrderId  
            await order.save()  

            const approvalUrl = response.result.links.find(link => link.rel === 'approve')  

            return {
                success: true,
                paypalOrderId: paypalOrderId,
                approvalUrl: approvalUrl.href,
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: response.result.status
            }  
        } catch (error) {
            console.error('PayPal order creation error:', error)  
            throw error  
        }
    }

    static async capturePayPalPayment(orderId, paypalOrderId) {
        try {
            
            const order = await Order.findById(orderId)  
            if (!order) {
                throw new Error('Order not found')  
            }
         
            if (order.payment.status === 'paid') {
                return {
                    success: true,
                    message: 'Order already paid',
                    order: order,
                    alreadyPaid: true
                }  
            }

            const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId)  
            request.requestBody({})  

            const client = getPayPalClient()  
            const response = await client.execute(request)  

            const capture = response.result  

            
            if (capture.status === 'COMPLETED') {
                
                const updatedOrder = await this.markOrderAsPaid(order, {
                    id: capture.id,
                    paypalOrderId: paypalOrderId,
                    status: 'captured',
                    paymentSource: capture.payment_source
                })  

                return {
                    success: true,
                    message: 'Payment captured successfully',
                    order: updatedOrder,
                    capture: capture
                }  
            } else {
                return {
                    success: false,
                    message: `Payment capture failed: ${capture.status}`,
                    capture: capture
                }  
            }
        } catch (error) {
            console.error('PayPal payment capture error:', error)  
            throw error  
        }
    }
 
    static async markOrderAsPaid(order, paymentData) {
        try {
            
            order.payment.status = 'paid'  
            order.payment.transactionId = paymentData.id || paymentData.paypalOrderId  
            order.payment.paymentId = paymentData.paypalOrderId  
            order.payment.paidAt = new Date()  
            order.status = 'processing'  

            
            order.timeline.push({
                status: 'processing',
                timestamp: new Date(),
                note: `Payment confirmed (PayPal: ${paymentData.id || paymentData.paypalOrderId})`,
                updatedBy: order.user
            })  

            await order.save()  
            
            await Cart.findOneAndUpdate(
                { user: order.user },
                {
                    $set: {
                        items: [],
                        subtotal: 0,
                        totalDiscount: 0,
                        total: 0,
                        coupons: []
                    }
                }
            )  

            return order  
        } catch (error) {
            console.error('Mark order as paid error:', error)  
            throw error  
        }
    }
    
    static async getOrderByPayPalOrderId(paypalOrderId) {
        try {
            const order = await Order.findOne({
                'payment.paymentId': paypalOrderId
            })  
            return order  
        } catch (error) {
            console.error('Get order by PayPal ID error:', error)  
            throw error  
        }
    }
    
    static async processRefund(orderId, amount = null, reason = 'Customer requested refund') {
        try {
            const order = await Order.findById(orderId)  
            if (!order) throw new Error('Order not found')  
            if (!['processing', 'shipped', 'delivered'].includes(order.status)) {
                throw new Error('Order cannot be refunded in current status')  
            }
            if (order.payment.status !== 'paid') throw new Error('Order is not paid')  
            if (!order.payment.transactionId) throw new Error('No payment ID found')  

            const client = getPayPalClient()  
            const captureId = order.payment.transactionId  

            const request = new paypal.payments.CapturesRefundRequest(captureId)  
            request.requestBody({
                amount: {
                    currency_code: process.env.PAYPAL_CURRENCY || 'USD',
                    value: amount ? amount.toFixed(2) : order.total.toFixed(2)
                },
                note: reason,
                invoice_id: order.orderNumber
            })  

            const response = await client.execute(request)  

            order.payment.status = 'refunded'  
            order.payment.refundId = response.result.id  
            order.payment.refundedAt = new Date()  
            order.status = 'refunded'  

            order.timeline.push({
                status: 'refunded',
                timestamp: new Date(),
                note: `Refund processed: ${response.result.id}. Reason: ${reason}`,
                updatedBy: order.user
            })  

            await order.save()  

            await InventoryService.restoreInventory(order.items)  

            return {
                success: true,
                refund: response.result,
                order
            }  
        } catch (error) {
            console.error('Refund processing error:', error)  
            throw error  
        }
    }
    
    static async getPaymentMethods() {
        return {
            methods: [
                { id: 'paypal', name: 'PayPal Balance' },
                { id: 'card', name: 'Credit/Debit Card' },
                { id: 'bank', name: 'Bank Transfer' },
                { id: 'paypal_credit', name: 'PayPal Credit' }
            ]
        }  
    }

    static async getPaymentHistory(userId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit  

            const orders = await Order.find({
                user: userId,
                'payment.status': { $in: ['paid', 'refunded'] }
            })
                .select('orderNumber payment status total createdAt')
                .sort('-createdAt')
                .limit(limit)
                .skip(skip)  

            const total = await Order.countDocuments({
                user: userId,
                'payment.status': { $in: ['paid', 'refunded'] }
            })  

            return {
                payments: orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }  
        } catch (error) {
            console.error('Payment history error:', error)  
            throw error  
        }
    }
}

module.exports = PaymentService  