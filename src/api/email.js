// email.js
const nodemailer = require('nodemailer');

async function sendConfirmationEmail(email, subject, text) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: "navyaganait15@gmail.com",
            pass: "hqdgcvgctkhaicjv",
        },
    });

    const message = {
        from: 'navyaganait15@gmail.com',
        to: email,
        subject: subject,
        text: text,
    };

    // Send the email
    await transporter.sendMail(message);
}

module.exports = sendConfirmationEmail;
