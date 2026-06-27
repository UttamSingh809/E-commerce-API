const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const authRoutes = require('./routes/auth.routes')
const categoryRoutes=require('./routes/category.routes')
const productRoutes=require('./routes/product.routes')
const cartRoutes=require('./routes/cart.routes')
const orderRoutes = require('./routes/order.routes')
const paymentRoutes = require('./routes/payment.routes')

app.use('/auth',authRoutes)
app.use('/categories',categoryRoutes)
app.use('/products',productRoutes)
app.use('/cart',cartRoutes)
app.use('/orders', orderRoutes)
app.use('/payments', paymentRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

app.use((err, req, res, next) => {
    res.status(500).json({ success: false, message: err.message });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;