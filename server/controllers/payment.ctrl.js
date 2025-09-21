const paymentService = require("../services/payment.svc");
const createCheckout = async (req, res) => {
  try {
    let response = await paymentService.createCheckout(req.user.user_id);
    res.status(200).send(response);
  } catch (error) {
    console.error("Error creating receving address:", error);
    res.status(500).json({ error: "creating receving address:" + error });
  }
};

const webhook = async (req, res) => {
  try {
    await paymentService.webhook(req.query);
    res.status(200).send("Received");
  } catch (error) {
    console.error("Error processing webhook event:", error);
    res.status(500).json({ error: "processing webhook event:" + error });
  }
};

const getUserPayment = async (req, res) => {
  try {
    let response = await paymentService.getUserPayment(req.user.user_id);
    res.status(200).send(response);
  } catch (error) {
    console.error("Error getting user payment:", error);
    res.status(500).json({ error: "getting user payment:" + error });
  }
};

module.exports = {
  createCheckout,
  webhook,
  getUserPayment
};
