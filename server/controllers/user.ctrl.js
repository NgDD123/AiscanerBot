const userService = require("../services/user.svc");
const logger = require("../utils/util.logger")
const userLogger = logger("/auth");


const createUser = async (req, res) => {
  try {
    let user = await userService.addUser(req.body);
    userLogger.info(`User creation with details: ${JSON.stringify(user)} initiated`);
    return res.status(200).send({ succcess: true, msg: "User created successfully", user });
  } catch (error) {
    console.error("Error creating users:", error);
    userLogger.error(`Error creating user ${JSON.stringify(error)}`)
    return res.status(500).json({ error: "creating users:" + error });
  }
};

const registerNewUser = async (req, res) => {
  try {
    let user = await userService.registerNewUser(req.body);
    userLogger.info(`User creation with details: ${JSON.stringify(user)} initiated`);
    return res.status(200).send({ succcess: true, msg: "User created successfully", user });
  } catch (error) {
    console.error("Error creating users:", error);
    userLogger.error(`Error creating user ${JSON.stringify(error)}`)
    res.status(500).json({ error: "creating users:" + error });
  }
}


const getUsers = async (req, res) => {
  try {
    let response = await userService.getUsers();
    userLogger.info(`Fetching all users from cache initiated`);
    return res.status(200).send(response);
  } catch (error) {
    console.error("Error getting users:", error);
    userLogger.error(`Error fetching all users from cache ${JSON.stringify(error)}`)
    return res.status(500).json({ error: "getting users:" + error });
  }
}

const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    let response = await userService.getUserProfileService(userId);
    userLogger.info(`User profile retrieved successfully with details:${JSON.stringify(response)}`);
    return res.status(200).json({
      success: true,
      user: response,
      message: "User fetched successfully"
    })
  }
  catch (error) {
    userLogger.error(`Error fetching  user profile`)
    return res.status(500).json({ error: "Error fetching profile" + error });
  }
}

const getUserReferrals = async (req, res) => {
  try {
    const { referralCode } = req.params;
    let response = await userService.getUserReferrals(referralCode);
    userLogger.info(`Fetching user referrals with referral code:${referralCode}`);
    return res.status(200).json({
      success: true,
      referrals: response,
      message: "User referrals fetched successfully"
    })

  }
  catch (error) {
    userLogger.error(`Fetching user referral failed: ${error.message}`);
    return res.status(500).json({ error: "Error fetching user referrals" + error });

  }
}

const deleteUser = async (req, res) => {
  try {
    let userId = req.params.userId;
    userLogger.info(`Deleting user ${userId}`);
    await userService.deleteUser(userId);
    return res.status(200).send({ succcess: true, msg: "User deleted successfully" });
  } catch (error) {
    console.error("Error delete user:", error);
    userLogger.error(`Error deleting user ${userId} ${error.message}`);
    return res.status(500).json({ error: "delete user:" + error });
  }
}
const giveUserAccess = async (req, res) => {
  try {
    let userId = req.params.userId;
    await userService.giveUserAccess(userId);
    userLogger.info(`User ${userId} has been granted access `);
    res.status(200).send({ succcess: true, msg: "User access grandted successfully" });
  } catch (error) {
    console.error("Error giving user access:", error);
    userLogger.error(`Error giving user ${userId} access ${error.message}`);
    res.status(500).json({ error: "giving user access:" + error });
  }
}
const removeUserAccess = async (req, res) => {
  try {
    let userId = req.params.userId;
    await userService.removeUserAccess(userId);
    userLogger.info(`User ${userId} has been removed access `);
    res.status(200).send({ succcess: true, msg: "User access removed successfully" });
  } catch (error) {
    console.error("Error removeing user access:", error);
    userLogger.error(`Error removing user ${userId} access ${error.message}`);
    res.status(500).json({ error: "removeing user access:" + error });
  }
}
module.exports = {
  createUser,
  getUsers,
  deleteUser,
  giveUserAccess,
  removeUserAccess,
  registerNewUser,
  getProfile,
  getUserReferrals
}