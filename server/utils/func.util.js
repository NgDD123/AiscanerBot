const generateReferralCode = () => {
  // Generate a unique 6-character referral code
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};
module.exports = generateReferralCode;