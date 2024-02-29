'use strict';

/**
 * otp controller
 */
 
const sendConfirmationEmail = require('../../email');
const userInfo = require('../../user-info/controllers/user-info');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::otp.otp', ({ strapi }) => ({
    async generateOTP(ctx) {
        try {

           
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
                    email:ctx.request.body.email
                }
            });

            // Send the OTP to the user's email
            const subject= 'Your OTP'; 
            const text= `Your reset OTP is: ${newOTP}`;
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

    
    
}));


