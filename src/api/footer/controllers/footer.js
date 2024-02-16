'use strict';

/**
 * footer controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const nodemailer = require('nodemailer');

module.exports = createCoreController('api::footer.footer', ({ strapi }) => ({
    async subscribe(ctx) {
        try {
            const { email } = ctx.request.body;

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return ctx.badRequest('Invalid email format');
            }
            console.log(email);
            // Check if the email is already subscribed
            const existingSubscription = await strapi.query('api::user-info.user-info').findOne({ where:{email: email }});
            if (existingSubscription && existingSubscription.isSubscribed) {
                return ctx.badRequest('Email is already subscribed');
            }
            console.log("existingSubscription", existingSubscription);
            console.log("existingSubscription", existingSubscription.isSubscribed);

            // Create new subscription
            await strapi.query('api::user-info.user-info').update({
                data: {
                    isSubscribed: true
                },
                where: {
                    email: email
                }
            });

            console.log("test", existingSubscription.isSubscribed);
            // Send confirmation email
            await sendConfirmationEmail(email);

            // Subscription successful
            return ctx.send({ message: 'Subscription successful', email });
        } catch (error) {
            strapi.log.error('Error handling subscription:', error);
            return ctx.internalServerError('Internal Server Error');
        }
    }
}));

// Function to send confirmation email
async function sendConfirmationEmail(email) {
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
        subject: 'Subscription Confirmation', 
        text: 'Thank you for subscribing!', 
        };

    // Send the email
    await transporter.sendMail(message);
}
