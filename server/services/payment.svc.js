const { BCON_API_KEY } = require("../config/env");
const fs = require("fs");
const path = require("path");
const paymentsModel = require("../models/payment");
const socketServer = require("../index.js");

const createCheckout = async (userId) => {
  const url = "https://external-api.bcon.global/api/v1/address";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BCON_API_KEY}`,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Error fetching the receiving address: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  let checkUserPaymentAlreadyExists = await checkUserPayment(userId);
  if (checkUserPaymentAlreadyExists) {
    paymentsModel.updatePayment(checkUserPaymentAlreadyExists.id, {
      ...checkUserPaymentAlreadyExists,
      bconSmartAddresses:
        checkUserPaymentAlreadyExists.bconSmartAddresses +
        "," +
        data.data.address,
    });
  } else {
    paymentsModel.createPayment({
      userId,
      amount: 0,
      status: "unpaid",
      transactionIds: "",
      bconSmartAddresses: data.data.address,
    });
  }
  return data;
};

const webhook = async (data) => {
  //   if (data.secret !== BCON_API_KEY) {
  //     console.log("Fake data detected: ", data);
  //     throw new Error(`Fake data detected`);
  //   }
  data = {
    ...data,
    value: parseFloat(data.value),
    status: parseFloat(data.status),
  };
  let checkUserPaymentAlreadyExists = await checkUserPayment(null, data.addr);

  if (!checkUserPaymentAlreadyExists) {
    console.log("Fake data detected: ", data);
    throw new Error(`Fake data detected`);
  }
  if (data.status === 2) {
    checkUserPaymentAlreadyExists = {
      ...checkUserPaymentAlreadyExists,
      transactionIds:
        checkUserPaymentAlreadyExists.transactionIds === ""
          ? data.txid
          : checkUserPaymentAlreadyExists.transactionIds + "," + data.txid,
      amount: checkUserPaymentAlreadyExists.amount + data.value,
      status: "paid",
    };
    paymentsModel.updatePayment(
      checkUserPaymentAlreadyExists.id,
      checkUserPaymentAlreadyExists
    ).then(async()=>{
        await socketServer.sendPaymentMadeMessage(checkUserPaymentAlreadyExists.userId)
    });
  }
};

async function checkUserPayment(userId, address) {
  const filePath = path.join(__dirname, "../cachedData/payments.json");
  const data = fs.readFileSync(filePath, "utf8");
  const payments = JSON.parse(data);
  return payments.find(
    (p) => p.userId === userId || p.bconSmartAddresses.includes(address)
  );
}

const getUserPayment = async (userId) => {
  let userPayment = await checkUserPayment(userId);
  if (!userPayment) {
    return {
      hasPaid: false,
    };
  } else {
    if (userPayment.status === "paid" || userPayment.status === "partial") {
      return { hasPaid: true, ...userPayment };
    } else {
      return {
        hasPaid: false,
        ...userPayment,
      };
    }
  }
};

module.exports = {
  createCheckout,
  webhook,
  getUserPayment,
};
