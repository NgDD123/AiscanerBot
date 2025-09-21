const SendMailMessage = require("../services/sendMail.svc");

const sendMailController = async (req, res) => {
    if (!req.body.email || !req.body.subject || !req.body.body) {
        return res.status(400).send({ error: "Missing email, subject, or body" });
    }
    try {
        await SendMailMessage(req.body);
        res.status(200).send({ success: true, msg: "Email sent successfully" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "sending email:" + error });
    }
}
module.exports = sendMailController; 