const Product = require('../models/Product') 

class InventoryService {

    static async checkAvailability(items) {
        const results = [] 

        for (const item of items) {
            const product = await Product.findById(item.product) 

            if (!product) {
                return {
                    available: false,
                    error: `Product ${item.product} not found`
                } 
            }

            if (!product.isActive) {
                return {
                    available: false,
                    error: `Product ${product.name} is not available`
                } 
            }

            if (product.stock < item.quantity) {
                return {
                    available: false,
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                } 
            }

            results.push({
                product,
                quantity: item.quantity,
                stock: product.stock
            }) 
        }

        return {
            available: true,
            results
        } 
    }

    static async reserveInventory(items) {
        const updates = [] 

        for (const item of items) {
            const product = await Product.findById(item.product) 

            if (!product) {
                throw new Error(`Product ${item.product} not found`) 
            }

            product.stock -= item.quantity 

            updates.push({
                productId: product._id,
                name: product.name,
                previousStock: product.stock + item.quantity,
                newStock: product.stock,
                reducedBy: item.quantity
            }) 

            await product.save() 
        }

        return updates 
    }

    static async restoreInventory(items) {
        const updates = [] 

        for (const item of items) {
            const product = await Product.findById(item.product) 

            if (!product) {
                throw new Error(`Product ${item.product} not found`) 
            }

            product.stock += item.quantity 

            updates.push({
                productId: product._id,
                name: product.name,
                previousStock: product.stock - item.quantity,
                newStock: product.stock,
                increasedBy: item.quantity
            }) 

            await product.save() 
        }

        return updates 
    }
}

module.exports = InventoryService 