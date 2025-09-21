const express = require('express');
const sendMailController = require('../controllers/mail.ctrl');
const mailRoute = express.Router();

mailRoute.post("/sendMail",sendMailController);
module.exports = mailRoute;