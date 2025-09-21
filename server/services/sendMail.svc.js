const nodemailer = require('nodemailer');
const SendMailMessage = async (payload) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: "freedombot.online@gmail.com",
            pass: "riwb qyxr jfif naxm",
        },
    });


    const mailOptions = {
        to: "freedombot.online@gmail.com",
        from: "freedombot.online@gmail.com",
        replyTo: payload.email,
        subject: `${payload.subject}`,
        text: `${payload.body}`,
    };
    try {
        await transporter.sendMail(mailOptions);
        
    }
    catch (error) {
        throw new Error(error.message)
    }

}

module.exports = SendMailMessage;