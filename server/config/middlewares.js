const admin = require("firebase-admin");
const verifyToken = async (req, res, next) => {
  const idToken =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!idToken) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Attach the decoded token to the request object
    next();
  } catch (error) {
    return res.status(401).send("Unauthorized");
  }
};

const checkIfAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    if ((user?.email==="ngiriyezadavid2@gmail.com")) {
      next();
    } else {
      return res.status(401).send("Unauthorized");
    }
  } catch (error) {
    return res.status(401).send("Unauthorized");
  }
};

module.exports = {
  verifyToken,
  checkIfAdmin,
};
