const mongoose = require('mongoose') 

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        total: {
            type: Number,
            required: true,
            min: 0
        },
        productSnapshot: {
            name: String,
            price: Number,
            image: String,
            sku: String
        }
    }],
    shippingAddress: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true,
            default: 'USA'
        },
        phone: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    billingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        phone: String,
        name: String
    },
    payment: {
        method: {
            type: String,
            enum: ['card', 'paypal', 'cod', 'bank_transfer'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        transactionId: String,
        paymentId: String,
        paidAt: Date,
        refundId: String,
        refundedAt: Date
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    appliedCoupons: [{
        code: String,
        discount: Number,
        type: String
    }],
    status: {
        type: String,
        enum: [
            'pending',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'refunded'
        ],
        default: 'pending',
        index: true
    },
    timeline: [{
        status: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    tracking: {
        number: String,
        carrier: String,
        url: String,
        shippedAt: Date,
        deliveredAt: Date
    },
    notes: String,

    specialInstructions: String,

    ipAddress: String,

    userAgent: String,

    isRated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
}) 

orderSchema.index({ user: 1, createdAt: -1 }) 
orderSchema.index({ status: 1, createdAt: -1 }) 
orderSchema.index({ 'payment.transactionId': 1 }) 

orderSchema.pre('validate', function () {
    if (!this.orderNumber) {
        const date = new Date() 
        const year = date.getFullYear() 
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0') 
        this.orderNumber = `ORD-${year}-${random}` 
    }
}) 

orderSchema.pre('save', function () {
    if (this.isModified('status')) {
        this.timeline.push({
            status: this.status,
            timestamp: new Date(),
            note: `Order ${this.status}`
        }) 
    } 
}) 

orderSchema.methods.canCancel = function () {
    return ['pending', 'processing'].includes(this.status) 
} 

orderSchema.methods.canRefund = function () {
    return ['processing', 'shipped', 'delivered'].includes(this.status) &&
        this.payment.status === 'paid' 
} 

orderSchema.methods.updateStatus = function (status, note = '', userId = null) {
    this.status = status 
    this.timeline.push({
        status,
        timestamp: new Date(),
        note,
        updatedBy: userId
    }) 
    return this 
} 

orderSchema.methods.markAsPaid = function (transactionId, paymentId) {
    this.payment.status = 'paid' 
    this.payment.transactionId = transactionId 
    this.payment.paymentId = paymentId 
    this.payment.paidAt = new Date() 
    this.status = 'processing' 
    this.timeline.push({
        status: 'processing',
        timestamp: new Date(),
        note: 'Payment confirmed'
    }) 
    return this 
} 

orderSchema.virtual('isPaid').get(function () {
    return this.payment.status === 'paid' 
}) 

orderSchema.virtual('isCompleted').get(function () {
    return ['delivered', 'cancelled', 'refunded'].includes(this.status) 
}) 

orderSchema.virtual('itemCount').get(function () {
    if (!this.items || !Array.isArray(this.items) || this.items.length === 0) {
        return 0
    }
    return this.items.reduce((sum, item) => sum + item.quantity, 0) 
}) 

orderSchema.statics.getUserOrders = async function (userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit 
    const orders = await this.find({ user: userId })
        .sort('-createdAt')
        .limit(limit)
        .skip(skip) 
    const total = await this.countDocuments({ user: userId }) 
    return {
        orders,
        total,
        page,
        pages: Math.ceil(total / limit)
    } 
} 

orderSchema.statics.getUserStats = async function (userId) {
    const stats = await this.aggregate([
        { $match: { user: userId } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$total' },
                averageOrderValue: { $avg: '$total' },
                completedOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                }
            }
        }
    ]) 
    return stats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        completedOrders: 0
    } 
} 

orderSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.__v 
        return ret 
    }
}) 

module.exports = mongoose.model('Order', orderSchema) 