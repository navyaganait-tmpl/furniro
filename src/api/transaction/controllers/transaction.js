'use strict';

/**
 * transaction controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const Razorpay = require('razorpay');
// const crypto=require("crypto-js");
const crypto = require("crypto");
const { log } = require('console');
const sendConfirmationEmail = require('../../email');


module.exports = createCoreController('api::transaction.transaction', ({ strapi }) => ({
    async createOrder(ctx) {
        try {
            //Authenticate the user using JWT
            // Validate JWT
            // let tokendata;

            //             try {
            //                 tokendata = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx);
            //             } catch (err) {
            //                 return handleErrors(ctx, err, 'unauthorized');
            //             }
            //             if (!tokendata) {
            //                 ctx.throw(401, 'No token provided');
            //             }
            //             console.log("tokendata", tokendata);
            //             console.log("userId", tokendata.userId);

            // Fetch order details from request.body
            const { amount, currency, receipt } = ctx.request.body;
            if (!amount || !currency || !receipt) {
                return ctx.response.badRequest('Amount, currency, or receipt is missing');
            }


            if (!process.env.KEY_ID || !process.env.KEY_SECRET) {
                ctx.throw('Razorpay key_id or key_secret not provided in environment variables.');
            }

            //Create an instance of Razorpay to initiate order creation 
            const razorpay = new Razorpay({
                key_id: process.env.KEY_ID,
                key_secret: process.env.KEY_SECRET,
            });

            //       Pass the amount, currency and receipt id to the razorpay instance and create order
            const order = await razorpay.orders.create({
                amount,
                currency,
                receipt,
            });

            //Handle the response from Razorpay
            if (!order) {
                ctx.throw('Failed to create order');
            }
            await strapi.query('api::transaction.transaction').create({
                data:
                {
                    // user: tokendata.userId,
                    amount: order.amount,
                    currency: order.currency,
                    receipt: order.receipt,
                    orderId: order.id,
                    status: order.status,
                    // timestamp:order.created_at,
                }
            });

            // Return the order data
            return ctx.send(order);


        } catch (error) {
            ctx.throw(500, 'Internal server error', error);
        }
    },
    async verifyOrder(ctx) {
        try {

            // Get the payment id and order id from req.body
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = ctx.request.body;
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return ctx.throw(400, 'Missing required parameters');
            }
            

            // Find one order id in transaction table where order id=req.body.orderid
            const order = await strapi.query("api::transaction.transaction").findOne({
                where: {
                    orderId: razorpay_order_id

                }
            });

            if (!order) {
                return ctx.throw(400, 'Order not found');
            }
            
            // Take the key id and encrypt it using Hmac
            let hmac = crypto.createHmac('sha256', process.env.KEY_SECRET);

            //update Hmac with current order id and payment id 
            hmac.update(razorpay_order_id + "|" + razorpay_payment_id);

            //Generate a signature of this 
            const generated_signature = hmac.digest('hex');

            // If (generated signature==razorpay signature){
            if (razorpay_signature === generated_signature) {

                if (!process.env.KEY_ID || !process.env.KEY_SECRET) {
                    throw new Error('Razorpay key_id or key_secret not provided in environment variables.');
                }
                const razorpay = new Razorpay({
                    key_id: process.env.KEY_ID,
                    key_secret: process.env.KEY_SECRET,
                });
               

                const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
                
                if (!paymentDetails) {
                    ctx.throw('No payment details available', 400);
                }

                // if (razerpay object payment.id == payment ID){
                if (razorpay_payment_id == paymentDetails.id) {

                    //Save the api response in transaction table
                    await strapi.query("api::transaction.transaction").update({
                        where: {
                            orderId: razorpay_order_id
                        },
                        data: {
                            paymentId: paymentDetails.id,
                            timestamp: new Date(),
                            paymentMethod: paymentDetails.method,
                            amountRefunded: paymentDetails.amount_refunded,
                            refundStatus: paymentDetails.refund_status,
                            status: paymentDetails.status,
                        }
                    })

                    // Retrieve the user's cart
                    const userCart = await strapi.query("api::cart.cart").findOne({
                        where: {
                            user_infos: order.user,
                        },
                        populate: ['user_infos']
                    })
                    


                    //If (user's cart is not found){
                    if(userCart === null) {

                        // RefundPayment(paymentId){
                        
                        try {

                            // Get the order details from the transaction table
                            const userTransaction = await strapi.query("api::transaction.transaction").findOne({
                                where: {
                                    orderId: razorpay_order_id
                                }
                            })

                           

                            // Initiate a refund request to Razorpay API using the refund amount and the original payment ID
                            const refund = await razorpay.payments.refund(razorpay_payment_id, {
                                amount: userTransaction.amount,
                            });


                            
                            // If (refund is successful) 
                            if(refund) {

                                //Update the transaction table with the refund status
                                await strapi.query("api::transaction.transaction").update({
                                    where: {
                                        orderId: razorpay_order_id
                                    },
                                    data: {
                                        refundId: refund.id,
                                        amountRefunded: refund.amount,
                                        refundStatus: refund.status,
                                        status: "refunded",
                                    }
                                })

                                //Return a success response with status code 200 (Refund initiated successfully)
                                ctx.send({ message: "Refund initiated successfully" })
                            }
                        } catch (err) {
                            console.error(err);
                            ctx.throw(500, 'Error initiating refund');
                        }

                    }
                    else {
                        
                        // Empty the user's cart
                        await strapi.query("api::cart.cart").delete({
                            where: {
                                user_infos: order.user,
                            }
                        })
                    }
                }
                else (
                    ctx.send({ success: false, message: "Payment verification failed" })
                )
                const user = await strapi.query("api::user-info.user-info").findOne({
                    where: {
                        id: order.user,
                    }
                })

                // Send mail to the user
                const subject = 'Order Placed';
                const text = 'Thank you for placing your order!';
                await sendConfirmationEmail(user.email, subject, text);

                if (order.status === 'success') {
                    ctx.response.redirect('/success-page-url');
                    ctx.response.status = 302;
                }
                else if (order.status === 'failure') {
                    ctx.response.redirect('/failure-page-url');
                    ctx.response.status = 302;
                }

                ctx.send({ success: true, message: "Payment has been verified" })
            }
            else {
                ctx.send({ success: false, message: "Payment verification failed" })
            }

        } catch (error) {
            ctx.throw(500, "Internal Server Error", error);
        }
    }
}));


