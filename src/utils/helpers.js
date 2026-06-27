const countryCodes = {
    'india': 'IN',
    'united states': 'US',
    'usa': 'US',
    'united kingdom': 'GB',
    'uk': 'GB',
    'australia': 'AU',
    'canada': 'CA',
    'germany': 'DE',
    'france': 'FR',
    'italy': 'IT',
    'spain': 'ES',
    'brazil': 'BR',
    'mexico': 'MX',
    'japan': 'JP',
    'china': 'CN',
    'russia': 'RU',
    'south africa': 'ZA',
    'uae': 'AE',
    'singapore': 'SG',
    'malaysia': 'MY',
    'indonesia': 'ID',
    'thailand': 'TH',
    'vietnam': 'VN',
    'philippines': 'PH',
    'pakistan': 'PK',
    'bangladesh': 'BD',
    'sri lanka': 'LK',
    'nepal': 'NP'
} 

function getCountryCode(country) {
    if (!country) return 'IN' 

    const trimmed = country.trim().toLowerCase() 

    if (trimmed.length === 2 && countryCodes[trimmed]) {
        return trimmed.toUpperCase() 
    }

    if (countryCodes[trimmed]) {
        return countryCodes[trimmed] 
    }
    
    for (const [key, code] of Object.entries(countryCodes)) {
        if (trimmed.includes(key) || key.includes(trimmed)) {
            return code 
        }
    }

    console.warn(`Unknown country: ${country}, defaulting to IN`) 
    return 'IN' 
}

function generateRandomString(length = 10) {
    return Math.random().toString(36).substring(2, 2 + length) 
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount) 
}

module.exports = {
    getCountryCode,
    generateRandomString,
    formatCurrency,
    countryCodes
} 