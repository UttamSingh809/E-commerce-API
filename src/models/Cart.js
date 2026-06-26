const mongoose = require('mongoose')
const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
            default: 1
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative']
        },
        total: {
            type: Number,
            required: true,
            min: [0, 'Total cannot be negative']
        }
    }],
    subtotal: {
        type: Number,
        default: 0,
        min: [0, 'Subtotal cannot be negative']
    },
    coupons: [{
        code: {
            type: String,
            trim: true
        },
        discount: {
            type: Number,
            default: 0
        },
        type: {
            type: String,
            enum: ['percentage', 'fixed']
        }
    }],
    totalDiscount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    total: {
        type: Number,
        default: 0,
        min: [0, 'Total cannot be negative']
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) //7 days
    }
}, {
    timestamps: true
})

cartSchema.index({ user: 1 }, { unique: true })

cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

cartSchema.methods.calculateTotals = function () {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0) 
    this.totalDiscount = this.coupons.reduce((sum, coupon) => sum + coupon.discount, 0) 
    this.total = this.subtotal - this.totalDiscount 
    if (this.total < 0) this.total = 0
    return this
}

cartSchema.methods.addItem = function (productId, quantity = 1, price) {
    const existingItem = this.items.find(item =>
        item.product.toString() === productId.toString()
    )

    if (existingItem) {
        existingItem.quantity += quantity
        existingItem.total = existingItem.quantity * existingItem.price
    }
    else {
        this.items.push({
            product: productId,
            quantity,
            price,
            total: quantity * price
        })
    }

    this.calculateTotals()

    return this
}

cartSchema.methods.removeItem = function (productId) {
    this.items = this.items.filter(item =>
        item.product.toString() !== productId.toString()
    ) 

    this.calculateTotals() 
    return this 
} 

cartSchema.methods.updateItemQuantity = function (productId, quantity) {
    const item = this.items.find(item =>
        item.product.toString() === productId.toString()
    )

    if (!item) {
        throw new Error('Item not found in cart')
    }

    if (quantity <= 0) {
        return this.removeItem(productId)
    }

    item.quantity = quantity
    item.total = item.quantity * item.price

    this.calculateTotals()
    return this
}

cartSchema.methods.clearCart = function () {
    this.items = []
    this.coupons = []
    this.subtotal = 0
    this.totalDiscount = 0 
    this.total = 0
    return this
}

cartSchema.methods.applyCoupon = function (coupon) {
    const existingCoupon = this.coupons.find(c => c.code === coupon.code) 
    if (existingCoupon) {
        throw new Error('Coupon already applied') 
    }

    let discount = 0 
    if (coupon.type === 'percentage') {
        discount = (this.subtotal * coupon.value) / 100 
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount 
        }
    } else if (coupon.type === 'fixed') {
        discount = coupon.value 
        if (discount > this.subtotal) {
            discount = this.subtotal 
        }
    }
    this.coupons.push({
        code: coupon.code,
        discount: discount,
        type: coupon.type
    }) 
    this.calculateTotals() 
    return this 
} 

cartSchema.methods.removeCoupon = function (couponCode) {
    this.coupons = this.coupons.filter(c => c.code !== couponCode) 
    this.calculateTotals() 
    return this 
} 

cartSchema.virtual('isEmpty').get(function () {
    return this.items.length === 0
}) 

cartSchema.virtual('itemCount').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0)
})

cartSchema.virtual('uniqueItems').get(function () {
    return this.items.length
})

cartSchema.statics.getOrCreateCart = async function (userId) {
    let cart = await this.findOne({ user: userId })
    if (!cart) {
        cart = await this.create({
            user: userId,
            items: [],
            coupons: [],
            subtotal: 0,
            totalDiscount: 0,
            total: 0
        })
    }
    return cart
}

cartSchema.set('toJSON', {
    virtuals: false,
    transform: function (doc, ret) {
        delete ret.__v
        delete ret.expiresAt
        delete ret._id
        delete ret.id
        return ret
    }
})

module.exports = mongoose.model('Cart', cartSchema)