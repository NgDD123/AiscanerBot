const { COINPAYMENTS_API_SECRET } = require("../config/env");
const paymentService = require("../services/payment2.svc");
const crypto = require("crypto");
const logger = require("../utils/util.logger");
const paymentLogger = logger("/payments")


const verifyIPN = (req) => {
  const hmac = crypto.createHmac("sha512", COINPAYMENTS_API_SECRET);
  hmac.update(req.rawBody);
  const calculatedHmac = hmac.digest("hex");
  return calculatedHmac === req.headers["hmac"];
};

const createPayment = async (req, res) => {
  try {
    let response = await paymentService.createPayment(req.user, req.body);
    paymentLogger.info("Payment created", { user: req.user, payment: response });
    return res.status(200).send(response);
  } catch (error) {
    console.error("Error creating checkout url:", error);
    paymentLogger.error("Error creating checkout url");
    return res.status(500).json({ error: "creating checkout url:" + error });
  }
};

const webhook = async (req, res) => {
  try {
    await paymentService.webhook(req.body);
    // if (verifyIPN(req)) {
    //     console.log("successfully");
    //   res.status(200).send("IPN received");
    // } else {
    //   res.status(400).send("IPN Verification Failed");
    // }
    paymentLogger.info("webhook successful initiated");
    res.status(200).send("Received");
  } catch (error) {
    console.error("Error processing webhook event:", error);
    paymentLogger.error("Error processing webhook event");
    res.status(500).json({ error: "processing webhook event:" + error });
  }
};

const getUserPayment = async (req, res) => {
  try {
    let response = await paymentService.getUserPayment(req.user.email);
    paymentLogger.info("Payment fetched", { user: req.user, payment: response });
    res.status(200).send(response);
  } catch (error) {
    console.error("Error getting user payment:", error);
    paymentLogger.error("Error getting user payment");
    res.status(500).json({ error: "getting user payment:" + error });
  }
};

module.exports = {
  createPayment,
  webhook,
  getUserPayment
};
