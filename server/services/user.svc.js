const userModel = require("../models/user");

const addUser = async (data) => {
  const { email, password } = data;
  return await userModel.createUser({ email, password });
};
const registerNewUser = async (data) => {
  const { email, password, referrer, walletAddress } = data;
  return await userModel.registerNewUser({ email, password, referrer, walletAddress });
}
const getUserProfileService = async (uid) => {
  try {
    const userInfo = await userModel.getUserProfile(uid);
    return userInfo;
  }
  catch (error) {
    console.log(error)
    throw new Error("Error getting user profile")
  }
}
const getUserReferrals = async(referralCode)=>{
  try{

    const users = await userModel.fetchUsersByReferralCode(referralCode);
    return users;
  }
  catch(error){
    console.log(error)
    throw new Error("Error getting user referrals")  
  }
}
const getUsers = async () => {
  let users = await userModel.getUsers();
  return users;
};
const deleteUser = async (userId) => {
  await userModel.deleteUser(userId);
};
const giveUserAccess = async (userId) => {
  await userModel.giveUserAccess(userId);
}
const removeUserAccess = async (userId) => {
  await userModel.removeUserAccess(userId);
}
module.exports = {
  addUser,
  getUsers,
  deleteUser,
  giveUserAccess,
  removeUserAccess,
  registerNewUser,
  getUserProfileService,
  getUserReferrals
};
