const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Name cannot exceed 200 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    shortDescription: {
        type: String,
        maxlength: [300, 'Short description cannot exceed 300 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    comparePrice: {
        type: Number,
        min: [0, 'Compare price cannot be negative']
        // This is the original price for showing discounts
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    images: [{
        url: String,
        alt: String,
        isPrimary: { type: Boolean, default: false }
    }],
    tags: [String],
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

productSchema.pre('save',async function () {
    if (!this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
});

productSchema.virtual('isOnSale').get(function () {
    return this.comparePrice && this.comparePrice > this.price;
});

productSchema.virtual('discountPercentage').get(function () {
    if (!this.comparePrice || this.comparePrice <= this.price) return 0;
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
});

module.exports = mongoose.model('Product', productSchema);