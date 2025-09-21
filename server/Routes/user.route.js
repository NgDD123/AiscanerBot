const { checkIfAdmin, verifyToken } = require("../config/middlewares");
const userCtrl = require("../controllers/user.ctrl");
const express = require("express");

const router = express.Router();
router.post("/create-user", verifyToken, checkIfAdmin, userCtrl.createUser);
router.post("/create-new-user", userCtrl.registerNewUser);
router.get("/", verifyToken, checkIfAdmin, userCtrl.getUsers);
router.delete("/:userId", verifyToken, checkIfAdmin, userCtrl.deleteUser);
router.get("/:userId", userCtrl.getProfile);
router.get("/referrals/:referralCode", userCtrl.getUserReferrals);
router.put("/give-user-access/:userId", verifyToken, checkIfAdmin, userCtrl.giveUserAccess);
router.put("/remove-user-access/:userId", verifyToken, checkIfAdmin, userCtrl.removeUserAccess);



module.exports=router