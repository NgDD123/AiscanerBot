  const {
  addDoc,
  collection,
  db,
  updateDoc,
  doc,
  getDocs,
} = require("../firebase");
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "../cachedData/payments.json");
let directory = "cachedData";
const filename = path.join(directory, `payments.json`);
const getRef = async (type, docId) => {
  let collectionInstance;
  switch (type) {
    case "create":
      collectionInstance = collection(db, "payments");
      break;
    case "update":
      collectionInstance = doc(db, "payments", docId);
      break;
    case "delete":
      collectionInstance = doc(db, "payments", docId);
      break;
    case "byId":
      collectionInstance = doc(db, "payments", docId);
      break;
    default:
      collectionInstance = collection(db, "payments");
  }
  return collectionInstance;
};

let getPayments = async () => {
  var paymentsModel = await getRef();
  const paymentsSnapshot = await getDocs(paymentsModel);
  const paymentsList = paymentsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return paymentsList;
};

let updatePaymentsInCache = async () => {
  getPayments().then((payments) => {
    const jsonData = JSON.stringify(payments);
    let directory = "cachedData";
    fs.mkdirSync(directory, { recursive: true });
    const filename = path.join(directory, `payments.json`);
    fs.writeFile(filename, jsonData, "utf8", (err) => {
      if (err) {
        console.error("Error saving file:", err);
      }
    });
  });
};
async function updatePaymentInCache(paymentId, updatedPayment) {
    try {
      const data = fs.readFileSync(filePath, "utf8");
      const payments = JSON.parse(data);
  
      const index = payments.findIndex((p) => p.id === paymentId);
      if (index !== -1) {
        payments[index] = { ...payments[index], ...updatedPayment };
  
        const jsonData = JSON.stringify(payments);
        fs.writeFile(filename, jsonData, "utf8", (err) => {
          if (err) {
            console.error("Error saving file:", err);
          }
        });
        console.log("Payment updated successfully");
      } else {
        console.error("Payment not found");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  }
  

let createPayment = async (data) => {
  var paymentsModel = await getRef("create");
  await addDoc(paymentsModel, data);
  await updatePaymentsInCache();
};

let updatePayment = async (paymentId, data) => {
  var paymentsModel = await getRef("update", paymentId);
  await updateDoc(paymentsModel, data);
  await updatePaymentInCache(paymentId,data);
};

let getAllPayments = async () => {
    const data = fs.readFileSync(filePath, "utf8");
    const payment = JSON.parse(data);
    return payment;
}

module.exports = {
  createPayment,
  updatePayment,
  getPayments,
  updatePaymentsInCache,
  getAllPayments
};
