'use strict';

/**
 * otp controller
 */

// const nodemailer = require('nodemailer'); 
const sendConfirmationEmail = require('../../email');
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::otp.otp', ({ strapi }) => ({
    async generateOTP(ctx) {
        try {

            // const { email, resend } = ctx.request.body;

            // Check if email is provided
            if (!ctx.request.body.email) {
                return ctx.response.badRequest('Enter valid credentials');
            }

            // Check if the user with the provided email exists
            const user = await strapi.query('api::user-info.user-info').findOne({
                where: {
                    email: ctx.request.body.email,
                },
            });

            if (!user) {
                return ctx.response.notFound('User not found');
            }

            // Generate a new OTP
            const newOTP = Math.floor(100000 + Math.random() * 900000); 

            // Save the new OTP in the otp table
            const createdOTP = await strapi.query('api::otp.otp').create({
                data: {
                    OTP: newOTP,
                    user_info: user.id,
                }
            });

            // Send the OTP to the user's email
            const subject= 'Your OTP'; 
            const text= `Your OTP is: ${newOTP}`;
            await sendConfirmationEmail(ctx.request.body.email, subject, text);
             

        
            return {
                message: 'OTP generated successfully',
                otp: createdOTP,
            };
        } catch (error) {
            console.error(error);
            return ctx.response.internalServerError('Internal Server Error');
        }
    },

    async resetPassword(ctx) {
        try {
            

            // Check if OTP is provided
            if (!ctx.request.body.otp) {
                return ctx.response.badRequest('Invalid OTP');
            }

            // Find the OTP in the database
            const otpEntry = await strapi.query('api::otp.otp').findOne({
                where: {
                    OTP: ctx.request.body.otp
                },
                populate: ['user_info'],
            });

            
            // Check if OTP is not found or  expired
            if (!otpEntry || otpEntry.expiryDate < new Date()) {
                return ctx.response.badRequest('Invalid or expired OTP');
            }

            // Update the user's password with the new password
            const user = await strapi.query('api::user-info.user-info').update({
                where:
                    { id: otpEntry.user_info.id },
                data:
                    { password: ctx.request.body.newPassword }
            }
            );

            let otpsToDelete = await strapi.query('api::otp.otp').findMany({
                where: { user_info: user.id }
            });

            const otpIdsToDelete = otpsToDelete.map(otp => otp.id);

            // Invalidate the OTP
            let deleteUser = await strapi.query('api::otp.otp').deleteMany({
                where:
                    { id: otpIdsToDelete }

            }
            );
            
            // Send the response
            return {
                message: 'Password reset successfully',
            };
        } catch (error) {
            console.error(error);
            return ctx.response.internalServerError('Internal Server Error');
        }
    },
}));

// Function to send OTP via email
async function sendOTPByEmail(email, otp) {
    let transporter = nodemailer.createTransport({
        // Transporter configuration, such as SMTP settings or service account details
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {

            user: "navyaganait15@gmail.com",
            pass: "hqdgcvgctkhaicjv",
        },
    });

    // Email message configuration
    let message = {
        from: 'navyaganait15@gmail.com', 
        to: email, 
        subject: 'Your OTP', 
        text: `Your OTP is: ${otp}`, 
    };

    // Send the email
    await transporter.sendMail(message);
}
