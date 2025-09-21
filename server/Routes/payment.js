const express = require('express');
const axios = require('axios');
const Binance = require('node-binance-api');

const router = express.Router();

// Binance API setup
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_API_SECRET,
  useServerTime: true,
});

// Payment processing route
router.post('/process-payment', async (req, res) => {
  const { amount, userId, currency } = req.body;

  try {
    // Validate amount and currency
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID not provided' });
    }

    // Process payment logic based on currency
    let paymentId, transactionHash;

    if (currency === 'BTC') {
      // Example: BTC payment processing
      const btcAddress = process.env.BTC_RECEIVING_ADDRESS; // Your BTC receiving address

      // Create CoinPay payment request
      const response = await axios.post('https://api.coinpay.com/v1/payments', {
        amount: parsedAmount,
        currency: 'BTC',
        address: btcAddress,
        userId: userId,
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.COINPAY_API_KEY}`,
        }
      });

      const paymentRequest = response.data;
      paymentId = paymentRequest.id;
      transactionHash = paymentRequest.txHash;

      // For demo, simulate transaction sending
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate transaction time

    } else if (currency === 'USDT') {
      // Example: USDT (BEP20) payment processing
      const usdtAddress = process.env.USDT_RECEIVING_ADDRESS; // Your USDT receiving address for Binance Smart Chain (BEP20)

      // Create CoinPay payment request
      const response = await axios.post('https://api.coinpay.com/v1/payments', {
        amount: parsedAmount,
        currency: 'USDT',
        address: usdtAddress,
        userId: userId,
        network: 'BSC', // Specify Binance Smart Chain network
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.COINPAY_API_KEY}`,
        }
      });

      const paymentRequest = response.data;
      paymentId = paymentRequest.id;
      transactionHash = paymentRequest.txHash;

      // For demo, simulate transaction sending
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate transaction time

    } else {
      return res.status(400).json({ error: 'Unsupported currency' });
    }

    res.json({ message: 'Payment processed successfully', paymentId, transactionHash });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Error processing payment' });
  }
});

// Payment status route
router.get('/payment-status/:paymentId', async (req, res) => {
  const { paymentId } = req.params;

  try {
    // Check payment status from CoinPay
    const response = await axios.get(`https://api.coinpay.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.COINPAY_API_KEY}`,
      }
    });

    const paymentStatus = response.data;

    res.json({ status: paymentStatus.status });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Error checking payment status' });
  }
});

module.exports = router;
