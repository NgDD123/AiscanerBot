const express = require('express');
const paymentController= require("../controllers/payment2.ctrl");
const { verifyToken } = require('../config/middlewares');
const router = express.Router();


router.post('/create-checkout',verifyToken,paymentController.createPayment);
router.post('/webhook',paymentController.webhook);
router.get('/payment-status',verifyToken,paymentController.getUserPayment);


module.exports = router;