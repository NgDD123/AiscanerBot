const express = require('express');
const paymentController= require("../controllers/payment.ctrl");
const { verifyToken } = require('../config/middlewares');
const router = express.Router();


router.get('/create-checkout',verifyToken,paymentController.createCheckout);
router.get('/webhook',paymentController.webhook);
router.get('/payment-status',verifyToken,paymentController.getUserPayment);


module.exports = router;