const client = require("../config/coinpayments");
const paymentsModel = require("../models/payment");
const socketServer = require("../index.js");
const fs = require("fs");
const path = require("path");
const { db, doc } = require("../firebase.js");
const { getDoc, getDocs, query, collection, where } = require("firebase/firestore");
const logger = require("../utils/util.logger.js");
const commissionLogger = logger("/commission");

// Packages structure with base amounts
let packages = {
  weekly: { baseAmount: 25 },
  monthly: { baseAmount: 50 },
  yearly: { baseAmount: 450 },
};

const isCoinPaymentsAddress = async(address)=> {
  try {
    // 1. Check if it's a valid CoinPayments merchant ID format (starts with capital letter)
    if (/^[A-Z][a-zA-Z0-9]+$/.test(address)) {
      return true;
    }

    // 2. Check if it's a deposit address from your CoinPayments account
    const depositAddresses = await client.getDepositAddress(
      {
        currency: "USDT.BEP20", // or pass this in
      }
    );
 
    if (depositAddresses.address === address) {
      return true;
    }
    // 3. If neither of the above, assume it's an external address
    return false;
  } catch (error) {
    console.error('Error checking address type:', error);
    // If there's any error, assume it's external to be safe
    return false;
  }
}

// Helper function to calculate amount
const calculateAmount = (baseAmount, duration) => {
  return baseAmount * duration;
};

const getPackageType = async (amount, duration = null) => {
  // If we have the duration, we can do exact matching
  if (duration) {
    // Calculate expected amounts for each package type with the given duration
    const expectedAmounts = {
      weekly: packages.weekly.baseAmount * duration,
      monthly: packages.monthly.baseAmount * duration,
      yearly: packages.yearly.baseAmount * duration
    };

    // Find exact matching package type
    const tolerance = 0.01; // 1 cent tolerance for floating point comparison
    for (const [packageType, expectedAmount] of Object.entries(expectedAmounts)) {
      if (Math.abs(expectedAmount - amount) <= tolerance) {
        return packageType;
      }
    }
  }

  // If no duration provided or no exact match found,
  // check if the amount matches any base amount
  const baseAmounts = {
    weekly: packages.weekly.baseAmount,
    monthly: packages.monthly.baseAmount,
    yearly: packages.yearly.baseAmount
  };

  // Try to find a package type by dividing the amount by common durations
  const commonDurations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  for (const [packageType, baseAmount] of Object.entries(baseAmounts)) {
    for (const dur of commonDurations) {
      if (Math.abs(amount / dur - baseAmount) <= tolerance) {
        return packageType;
      }
    }
  }

  // If no match found, find the closest base package type
  const closestPackage = Object.entries(packages).reduce((closest, [type, details]) => {
    const currentDiff = Math.abs(details.baseAmount - (amount / (duration || 1)));
    const closestDiff = Math.abs(closest.amount - (amount / (duration || 1)));
    return currentDiff < closestDiff ? { type, amount: details.baseAmount } : closest;
  }, { type: 'weekly', amount: packages.weekly.baseAmount });

  return closestPackage.type;
};

const sendReferralCommision = async (walletAddress, amount, currency,isInternal = false) => {
  try {
    console.log("Sending referral commission:", { walletAddress, amount, currency });
    commissionLogger.info("Sending referral commission", { walletAddress, amount, currency });
    let result;
    if(isInternal){
       result = await client.createTransfer({
        amount,
        currency, 
        merchant: walletAddress,
        auto_confirm: 1,
      });

    }
    else{
      result = await client.createWithdrawal({
        amount,
        currency,
        address: walletAddress,
        auto_confirm: 1,
        add_tx_fee: 1
      });
    }

    return result;

  }
  catch (error) {
    console.error('Error sending referral commission:', error);
    return { error: 'Failed to send commission' };
  }

}

const createPayment = async (user, data) => {
  const { packageType, coinType, duration } = data;

  if (!packages[packageType]) {
    return { error: "Invalid package type" };
  }

  // Validate duration
  if (!duration || duration < 1 || duration > 12) {
    return { error: "Invalid duration. Must be between 1 and 12" };
  }

  // Calculate total amount based on package type and duration
  let { baseAmount } = packages[packageType];
  let amount = calculateAmount(baseAmount, duration);

  // Set default coin type
  let currency = "USDT.BEP20";

  if (process.env.TESTING === "true") {
    currency = "LTCT";
  } else if (coinType) {
    switch (coinType) {
      case "BTC.BEP20":
        currency = "BTC.BEP20";
        break;
      case "USDT.BEP20":
        currency = "USDT.BEP20";
        break;
      default:
        return { error: "Invalid coin type" };
    }
  }

  try {

    const userRef = doc(db, "users", user.user_id);
    const userSnapshot = await getDoc(userRef);


    if (!userSnapshot.exists()) {
      return { error: "User not found" };
    }
    const userData = userSnapshot.data();
    const referralCode = userData.referrer;
    // Calculate net amount after commissions
    const commissionRate1 = 0.10;
    const commissionRate2 = 0.05;
    const netAmount = amount * (1 - commissionRate1 - commissionRate2);


    const transaction = await client.createTransaction({
      currency1: "USD",
      currency2: currency,
      amount: netAmount,
      buyer_email: user.email,
      custom: JSON.stringify({
         uid: user.uid, 
         duration,
         referrer: amount,
         originalAmount: amount, // Store original amount
         cR1:commissionRate1,
         cR2:commissionRate2
        }), 
    });

    return transaction;
  } catch (error) {
    console.error("Transaction creation failed:", error);
    return { error: "Transaction creation failed" };
  }
};

const webhook = async (data) => {
  if (data.status === "100") {
    console.log("Webhook triggered with data:", data);

    let custom = {};
    try {
      custom = JSON.parse(data.custom);
      console.log("Parsed custom field:", custom);

      let referralCode = custom.referrer;
      let first_gen_address = null;
      let second_gen_address = null;
      let first_gen_amount = custom.originalAmount * custom.cR1;
      let second_gen_amount = custom.originalAmount * custom.cR2;

      if (referralCode) {
        console.log("Referral code found:", referralCode);

        const referrerQuery = query(
          collection(db, "users"),
          where("referralCode", "==", referralCode)
        );
        const referrerSnapshot = await getDocs(referrerQuery);

        if (!referrerSnapshot.empty) {
          const referrerDoc = referrerSnapshot.docs[0];
          const referrerData = referrerDoc.data();
          console.log("First generation referrer found:", referrerData);

          first_gen_address = referrerData.walletAddress;
          const isFirstGenExternal = await isCoinPaymentsAddress(first_gen_address);
          console.log("First gen address:", first_gen_address, "External:", isFirstGenExternal);

          const secondReferralCode = referrerData.referrer;
          if (secondReferralCode) {
            console.log("Second generation referral code found:", secondReferralCode);

            const secondReferrerQuery = query(
              collection(db, "users"),
              where("referralCode", "==", secondReferralCode)
            );
            const secondReferrerSnapshot = await getDocs(secondReferrerQuery);

            if (!secondReferrerSnapshot.empty) {
              const secondReferrerDoc = secondReferrerSnapshot.docs[0];
              const secondReferrerData = secondReferrerDoc.data();
              console.log("Second generation referrer found:", secondReferrerData);

              second_gen_address = secondReferrerData.walletAddress;
              const isSecondGenExternal = await isCoinPaymentsAddress(second_gen_address);
              console.log("Second gen address:", second_gen_address, "External:", isSecondGenExternal);

              const firstPaymentRes = await sendReferralCommision(first_gen_address, first_gen_amount, data.currency2, isFirstGenExternal);
              const secondPaymentRes = await sendReferralCommision(second_gen_address, second_gen_amount, data.currency2, isSecondGenExternal);

              console.log("First payment response:", firstPaymentRes);
              console.log("Second payment response:", secondPaymentRes);

              if (firstPaymentRes.error || secondPaymentRes.error) {
                console.error("Error sending referral commissions:", {
                  first: firstPaymentRes.error,
                  second: secondPaymentRes.error
                });
              } else {
                console.log("Referral commissions sent successfully.");
              }
            }
          } else {
            // Only first generation exists
            const firstPaymentRes = await sendReferralCommision(first_gen_address, first_gen_amount, data.currency2, isFirstGenExternal);
            console.log("First payment response:", firstPaymentRes);

            if (firstPaymentRes.error) {
              console.error("Error sending first-gen referral commission:", firstPaymentRes.error);
            } else {
              console.log("First-gen referral commission sent successfully.");
            }
          }
        } else {
          console.warn("No user found with referral code:", referralCode);
        }
      } else {
        console.log("No referral code provided.");
      }

    } catch (error) {
      console.error("Error parsing custom field or processing referrals:", error);
    }

    try {
      let packageType = await getPackageType(
        parseFloat(data.amount1),
        custom.duration
      );
      console.log("Determined package type:", packageType);

      let newPayment = {
        email: data.email,
        amount: `${data.amount1} ${data.currency1} (in ${data.currency2})`,
        txn_id: data.txn_id,
        paidOn: new Date(),
        packageType,
        duration: custom.duration || 1,
      };

      console.log("Saving new payment:", newPayment);
      await paymentsModel.createPayment(newPayment);

      console.log("Sending socket payment notification to:", data.email);
      await socketServer.sendPaymentMadeMessage(data.email);

    } catch (error) {
      console.error("Error processing final payment and socket message:", error);
    }
  } else {
    console.warn("Webhook ignored due to unmatched status:", data.status);
  }
};


const getUserPayment = async (email) => {
  const filePath = path.join(__dirname, "../cachedData/payments.json");
  const data = fs.readFileSync(filePath, "utf8");
  const payments = JSON.parse(data);

  const userPayments = payments.filter((payment) => payment.email === email);

  if (userPayments.length === 0) {
    return { status: "no payments found", needsToPay: true };
  }

  const latestPayment = userPayments.sort(
    (a, b) => b.paidOn.seconds - a.paidOn.seconds
  )[0];

  const { paidOn, packageType, duration = 1 } = latestPayment;
  const paidDate = new Date(paidOn.seconds * 1000);
  const currentDate = new Date();

  let timeLimit;
  switch (packageType) {
    case "weekly":
      timeLimit = 7 * 24 * 60 * 60 * 1000 * duration;
      break;
    case "monthly":
      timeLimit = 30 * 24 * 60 * 60 * 1000 * duration;
      break;
    case "yearly":
      timeLimit = 365 * 24 * 60 * 60 * 1000 * duration;
      break;
    default:
      return { status: "unknown package type", needsToPay: true };
  }

  const elapsedTime = currentDate - paidDate;
  const needsToPay = elapsedTime > timeLimit;

  return {
    status: needsToPay ? "payment required" : "payment still valid",
    packageType,
    paidOn: paidDate,
    elapsedTime,
    needsToPay,
    duration,
    validUntil: new Date(paidDate.getTime() + timeLimit),
  };
};

module.exports = {
  createPayment,
  webhook,
  getUserPayment,
};