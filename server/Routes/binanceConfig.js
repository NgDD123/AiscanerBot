require('dotenv').config();

module.exports = {
    getBinanceBaseUrl: (exchangeType) => {
        if (exchangeType === 'binancefuturestestnet') {
            return 'https://testnet.binancefuture.com';
        } else if (exchangeType === 'binancefutures') {
            return 'https://fapi.binance.com';
        } else {
            return 'https://api.binance.com'; // spot account (optional if you add later)
        }
    }
};
