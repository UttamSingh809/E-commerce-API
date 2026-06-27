const express=require('express')
const config = require('./src/config/env.js')
const app=require('./src/app.js')
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers([
    '1.1.1.1', 
    '8.8.8.8',  
]);

mongoose.connect(config.mongoUri)
    .then(() => console.log('Database connected'))
    .catch(err => console.log('Database connection error:', err))

app.listen(config.port,()=>{
    console.log(`Server is running on port: ${config.port}`)
    console.log(`📚 Environment: ${config.nodeEnv}`)
    console.log(`💳 PayPal Mode: ${config.paypal.mode}`)
})