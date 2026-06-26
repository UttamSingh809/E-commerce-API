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
    this.total = this.items.reduce((sum, item) => sum + item.total, 0);
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
    );

    this.calculateTotals();
    return this;
};

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
}

cartSchema.methods.clearCart = function () {
    this.items = [],
        this.total = 0
    return this
}

cartSchema.virtual('isEmpty').get(function () {
    return this.items.length === 0
});

cartSchema.virtual('itemCount').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0)
})

cartSchema.virtual('uniqueItems').get(function () {
    return this.items.length
})

cartSchema.statics.getOrCreateCart = async function (userId) {
    let cart = await this.findOne({user: userId })

    if (!cart) {
        cart = await this.create({
            user: userId,
            items: [],
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