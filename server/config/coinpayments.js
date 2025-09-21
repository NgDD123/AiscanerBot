const Coinpayments = require("coinpayments");
const crypto = require("crypto");
const { COINPAYMENTS_API_KEY, COINPAYMENTS_API_SECRET } = require("./env");

const client = new Coinpayments({
  key:COINPAYMENTS_API_KEY,
  secret:COINPAYMENTS_API_SECRET,
});

module.exports = client;
