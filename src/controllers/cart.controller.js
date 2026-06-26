const Cart = require('../models/Cart')
const Product = require('../models/Product')

async function getCart(req, res) {
    try {
        let cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product', 'name price images slug')

        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: [],
                total: 0
            })
        }

        res.json({
            success: true,
            cart: {
                id: cart._id,
                items: cart.items,
                total: cart.total,
                itemCount: cart.itemCount,
                uniqueItems: cart.uniqueItems,
                isEmpty: cart.isEmpty
            }
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function addToCart(req, res) {
    try {
        const { productId, quantity = 1 } = req.body

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Minumum quatity should be 1'
            })
        }

        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            })
        }

        if (!product.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Product is not available'
            })
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Only ${product.stock} available`
            })
        }

        let cart = await Cart.findOne({ user: req.user.id })
        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: [],
                total: 0
            })
        }

        const existingItem = cart.items.find(item =>
            item.product.toString() === productId
        )

        const currentQuantity = existingItem ? existingItem.quantity : 0
        const totalQuantity = currentQuantity + quantity

        if (product.stock < totalQuantity) {
            return res.status(400).json({
                success: false,
                message: `Cannot add ${quantity} more. Only ${product.stock - currentQuantity} available`
            })
        }

        cart.addItem(productId, quantity, product.price)
        await cart.save()

        await cart.populate('items.product', 'name price images slug')

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            cart: {
                id: cart._id,
                items: cart.items,
                itemCount: cart.itemCount,
                total: cart.total,
                uniqueItems: cart.uniqueItems,
                isEmpty: cart.isEmpty
            }
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function updateCartItem(req,res) {
    try {
        const { productId } = req.params
        const { quantity } = req.body

        if (!quantity || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid quantity is required'
            })
        }

        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            })
        }

        const cart = await Cart.findOne({ user: req.user.id })
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            })
        }

        const item = cart.items.find(item =>
            item.product.toString() === productId
        )
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            })
        }

        if (quantity > item.quantity && product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Only ${product.stock} available`
            })
        }

        cart.updateItemQuantity(productId, quantity)
        await cart.save()

        await cart.populate('items.product', 'name price images slug')

        res.json({
            success: true,
            message: 'Cart updated successfully',
            cart: {
                id: cart._id,
                items: cart.items,
                total: cart.total,
                itemCount: cart.itemCount,
                uniqueItems: cart.uniqueItems,
                isEmpty: cart.isEmpty,
            }
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function removeFromCart(req, res) {
    try {
        const { productId } = req.params

        const cart = await Cart.findOne({ user: req.user.id })
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            })
        }

        cart.removeItem(productId)
        await cart.save()

        await cart.populate('items.product', 'name price images slug')

        res.json({
            success: true,
            message: 'Items removed from cart',
            cart: {
                id: cart._id,
                items: cart.items,
                total: cart.total,
                itemCount: cart.uniqueItems,
                isEmpty: cart.isEmpty
            }
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function clearCart(req,res) {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            })
        }

        cart.clearCart()
        await cart.save()
        res.json({
            success: true,
            message: 'Cart cleared successfully',
            cart: {
                id: cart._id,
                items: [],
                total: 0,
                itemCount: 0,
                isEmpty: true
            }
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function applyCoupon(req,res) {
    try {

    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function removeCoupon(req,res) {
    try {

    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
}