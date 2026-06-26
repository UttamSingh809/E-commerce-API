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
                coupons: [],
                subtotal: 0,
                totalDiscount: 0,
                total: 0
            })
        }

        res.json({
            success: true,
            cart: {
                id: cart._id,
                items: cart.items,
                subtotal: cart.subtotal,
                totalDiscount: cart.totalDiscount,
                total: cart.total,
                itemCount: cart.itemCount,
                uniqueItems: cart.uniqueItems,
                isEmpty: cart.isEmpty,
                coupons: cart.coupons
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
                coupons: [],
                subtotal: 0,
                totalDiscount: 0,
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
                subtotal: cart.subtotal,
                totalDiscount: cart.totalDiscount,
                total: cart.total,
                itemCount: cart.itemCount,
                uniqueItems: cart.uniqueItems,
                isEmpty: cart.isEmpty,
                coupons: cart.coupons
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
            message: 'Item removed from cart',
            cart: {
                subtotal: cart.subtotal,
                totalDiscount: cart.totalDiscount,
                total: cart.total,
                itemCount: cart.itemCount,
                uniqueItems: cart.uniqueItems,
                isEmpty: cart.isEmpty,
                coupons: cart.coupons
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
                subtotal: 0,
                totalDiscount: 0,
                total: 0,
                itemCount: 0,
                uniqueItems: 0,
                isEmpty: true,
                coupons: []
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

async function applyCoupon(req, res) {
    try {
        const { couponCode } = req.body

        if (!couponCode) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code is required'
            })
        }

        const cart = await Cart.findOne({ user: req.user.id })
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            })
        }

        if (cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty. Add items before applying coupon'
            })
        }

        const existingCoupon = cart.coupons.find(c => c.code === couponCode)
        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: 'Coupon already applied'
            })
        }

        //Using dummy coupons
        const validCoupons = {
            'SAVE10': { type: 'percentage', value: 10, maxDiscount: 50 },
            'SAVE20': { type: 'percentage', value: 20, maxDiscount: 100 },
            'FLAT50': { type: 'fixed', value: 50 }
        }

        const coupon = validCoupons[couponCode.toUpperCase()]
        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coupon code'
            })
        }

        cart.applyCoupon({
            code: couponCode.toUpperCase(),
            type: coupon.type,
            value: coupon.value,
            maxDiscount: coupon.maxDiscount
        })

        await cart.save()

        res.json({
            success: true,
            message: 'Coupon applied successfully',
            cart: {
                id: cart._id,
                items: cart.items,
                subtotal: cart.subtotal,
                totalDiscount: cart.totalDiscount,
                total: cart.total,
                itemCount: cart.itemCount,
                uniqueItems: cart.uniqueItems,
                isEmpty: cart.isEmpty,
                coupons: cart.coupons
            }
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

async function removeCoupon(req,res) {
    try {
        const { couponCode } = req.params

        const cart = await Cart.findOne({ user: req.user.id })
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            })
        }

        cart.removeCoupon(couponCode)
        await cart.save()

        res.json({
            success: true,
            message: 'Coupon removed successfully',
            cart: {
                id: cart._id,
                items: cart.items,
                subtotal: cart.subtotal,
                totalDiscount: cart.totalDiscount,
                total: cart.total,
                itemCount: cart.itemCount,
                uniqueItems: cart.uniqueItems,
                isEmpty: cart.isEmpty,
                coupons: cart.coupons
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

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon
}