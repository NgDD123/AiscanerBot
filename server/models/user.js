const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const filePath = path.join(__dirname, "../cachedData/users.json");
let directory = "cachedData";
const filename = path.join(directory, `users.json`);
const admin = require("firebase-admin");
const paymentsModel = require("./payment");
const { createUserWithEmailAndPassword, sendEmailVerification } = require("firebase/auth");
const { auth, db, collection, addDoc, updateDoc, getDocs, initFirebase, doc } = require("../firebase");
const generateReferralCode = require("../utils/func.util");
const { setDoc, serverTimestamp, query, where, arrayUnion, getDoc } = require("firebase/firestore");
const createUser = async (user) => {
  let newUser = await admin.auth().createUser(user);
  console.log("here is the new user", newUser)
  await updateUsersInCache();
  return { ...newUser, needsToPay: true };
};


const registerNewUser = async (userPayload) => {
  try {
    // Create user with email and password
    const newUser = await createUserWithEmailAndPassword(auth, userPayload.email, userPayload.password);
    const referallCode = generateReferralCode();
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "freedombot.online@gmail.com",
        pass: "riwb qyxr jfif naxm",
      }
    })

    const mailOptions = {
      to: userPayload.email,
      from: "freedombot.online@gmail.com",
      subject: "Welcome to Freedombot",
      html: `
        <h1>Welcome to Freedombot!</h1>
        <p>Your referral code is:<strong>${referallCode}</strong></p>
        <p>Please visit <a href="https://freedombot.online/login">freedombot.online</a> to create your account and start trading and you can starting sharing your referral code for some commisions.</p>
      `
    }
    const userData = {
      email: userPayload.email,
      referralCode: referallCode,
      referrer: userPayload.referrer || null,
      referrals: [],
      walletAddress: userPayload.walletAddress ?? null,
      createdAt: serverTimestamp()
    }
    const userDocRef = doc(collection(db, "users"), newUser.user.uid)

    await setDoc(userDocRef, userData)

    if (userPayload.referrer) {

      try {
        // Reference the "users" collection
        const usersCollectionRef = collection(db, "users");

        // Query for the referrer using their referral code
        const referrerQuery = query(usersCollectionRef, where("referralCode", "==", userPayload.referrer));
        const referrerSnapshot = await getDocs(referrerQuery);

        if (!referrerSnapshot.empty) {
          // Get the first matching document
          const referrerDoc = referrerSnapshot.docs[0];
          const referrerDocRef = referrerDoc.ref;

          // Update the "referrals" field using arrayUnion
          await updateDoc(referrerDocRef, {
            referrals: arrayUnion(newUser.user.uid),
          });

          console.log("Referrer updated with new referral.");
        } else {
          console.log("Invalid referral code.");
        }
      } catch (error) {
        console.error("Error handling referral code:", error);
      }
    }

    // Send email verification to the new user
    await sendEmailVerification(auth.currentUser, {
      url: process.env.NODE_ENV == 'production' ? `https://freedombot.online/login` : 'http://localhost:3000/login', // Redirect after email verification
    });
    try {
      await transporter.sendMail(mailOptions)
    }
    catch (error) {
      console.log("Error sending email", error)
    }

    // Optionally update user in your cache or database
    await updateUsersInCache();

    return newUser;
  } catch (error) {
    console.error("Error during registration or email verification:", error);
    throw error;
  }
};

async function getUserProfile(id) {
  try {
    const userDocRef = doc(collection(db, "users"), id);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      // Document exists, you can retrieve the user data
      const userData = userDocSnap.data();
      return userData;
    } else {
      console.log('No such user!');
      return null;
    }




  }
  catch (error) {

  }
}
let fetchUsers = async () => {
  const listUsersResult = await admin.auth().listUsers();
  let users = listUsersResult.users;
  users = users.filter((user) => user?.email !== "ngiriyezadavid2@gmail.com");
  return users;
};

let updateUsersInCache = async () => {
  fetchUsers().then((users) => {
    const jsonData = JSON.stringify(users);
    let directory = "cachedData";
    fs.mkdirSync(directory, { recursive: true });
    const filename = path.join(directory, `users.json`);
    fs.writeFile(filename, jsonData, "utf8", (err) => {
      if (err) {
        console.error("Error saving file:", err);
      }
    });
  });
};


async function updateUserInCache(userId, updatedUser) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const users = JSON.parse(data);

    const index = users.findIndex((user) => user.uid === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };

      const jsonData = JSON.stringify(users);
      fs.writeFile(filename, jsonData, "utf8", (err) => {
        if (err) {
          console.error("Error saving file:", err);
        }
      });
      console.log("user updated successfully");
    } else {
      console.error("user not found");
    }
  } catch (error) {
    console.error("Error updating user:", error);
  }
}


let getUsers = async () => {
  const data = fs.readFileSync(filePath, "utf8");
  const users = JSON.parse(data);
  let payments = await paymentsModel.getPayments();
  users.forEach(user => {
    let userPayment = payments.find(payment => payment.email === user.email);
    // console.log(userPayment, "here is the payment")
    if (userPayment) {
      user.payment = userPayment;
      // Determine if the user needs to pay again
      const { packageType, paidOn } = userPayment;
      const paidDate = new Date(paidOn.seconds * 1000);
      const currentDate = new Date();

      let timeLimit;
      switch (packageType) {
        case 'weekly':
          timeLimit = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          break;
        case 'monthly':
          timeLimit = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds (approximation)
          break;
        case 'yearly':
          timeLimit = 365 * 24 * 60 * 60 * 1000; // 365 days in milliseconds (approximation)
          break;
        default:
          timeLimit = 0;
          break;
      }

      const elapsedTime = currentDate - paidDate;
      user.needsToPay = elapsedTime > timeLimit;
    }
    else {
      user.needsToPay = true;
    }
  })
  return users;
};

let deleteUser = async (userId) => {
  const data = fs.readFileSync(filePath, "utf8");
  let users = JSON.parse(data);
  await admin.auth().deleteUser(userId)
  users = users.filter(user => user.uid !== userId);
  const jsonData = JSON.stringify(users);
  let directory = "cachedData";
  fs.mkdirSync(directory, { recursive: true });
  const filename = path.join(directory, `users.json`);
  fs.writeFile(filename, jsonData, "utf8", (err) => {
    if (err) {
      console.error("Error saving file:", err);
    }
  });
};

let giveUserAccess = async (userId) => {
  await admin.auth().setCustomUserClaims(userId, { hasAccess: true });
  await updateUserInCache(userId, { customClaims: { hasAccess: true } })
}
let removeUserAccess = async (userId) => {
  await admin.auth().setCustomUserClaims(userId, { hasAccess: false });
  await updateUserInCache(userId, { customClaims: { hasAccess: false } })

}

const fetchUsersByReferralCode = async (referralCode) => {
  try {
    // Create a reference to the 'users' collection
    const usersRef = collection(db, "users");

    // Create a query to find users who have the 'referrer' field equal to the referral code
    const referralQuery = query(usersRef, where("referrer", "==", referralCode));

    // Execute the query
    const querySnapshot = await getDocs(referralQuery);

    // Map the results into an array of user data
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });

    if (users.length > 0) {
      console.log("Users who used the referral code:", users);
      return users;
    } else {
      console.log("No users found with this referral code.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching users by referral code:", error);
    return [];
  }
};

module.exports = {
  createUser,
  updateUsersInCache,
  getUsers,
  deleteUser,
  giveUserAccess,
  removeUserAccess,
  registerNewUser,
  getUserProfile,
  fetchUsersByReferralCode,
};
