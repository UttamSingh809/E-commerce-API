const paypal = require('@paypal/checkout-server-sdk')  

function getPayPalEnvironment() {
    const clientId = process.env.PAYPAL_CLIENT_ID  
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET  
    const mode = process.env.PAYPAL_MODE || 'sandbox'  

    if (mode === 'sandbox') {
        return new paypal.core.SandboxEnvironment(clientId, clientSecret)  
    } else {
        return new paypal.core.LiveEnvironment(clientId, clientSecret)  
    }
}

function getPayPalClient() {
    const environment = getPayPalEnvironment()  
    return new paypal.core.PayPalHttpClient(environment)  
}

module.exports = {
    getPayPalClient,
    getPayPalEnvironment
}  