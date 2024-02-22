'use strict';

/**
 * coupon controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::coupon.coupon', ({ strapi }) => ({
    async applyCoupon(ctx) {
        try {
            // Authenticate the user using JWT
            // Validate JWT
            let tokendata;

            try {
                tokendata = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx);
            } catch (err) {
                return handleErrors(ctx, err, 'unauthorized');
            }
            if (!tokendata) {
                ctx.throw(401, 'No token provided');
            }
            

            // Get coupon code from the req.body.
            const { couponCode, cartTotal } = ctx.request.body;

            if (!couponCode) {
                ctx.throw(400, 'Coupon code or total not provided');
            }
            

            // Retrieve the coupon details from the Coupon table using the coupon code
            const coupon = await strapi.query('api::coupon.coupon').findOne({
                where: { couponCode: couponCode },
                populate: ['products_categories'],
            });
            
            if (!coupon || !coupon.active) {
                ctx.throw(400, 'Coupon not found or inactive');
            }

            // Check if the coupon has expired
            if (coupon.expiryDate != null && coupon.expiryDate < new Date()) {
                ctx.throw(400, 'Coupon has expired');
            }

            // Check if the coupon has reached its maximum usage limit
            if (coupon.maxUsage !=null && coupon.usageCount >= coupon.maxUsage) {
                ctx.throw(400, 'Coupon has reached its maximum usage limit');
            }

            // Retrieve the user's cart
            const userCart = await strapi.query('api::cart.cart').findMany({
                where: {
                    user_infos: { id: tokendata.userId, },
                },
                populate: ['products', 'products.products_categories',],
            });
            

            let a = 0;
            userCart.forEach(item => {
                item.products.forEach(product => {
                    a = product.products_categories;  

                });
            });


            if (!userCart || userCart.length === 0) {
                return ctx.send({ message: 'Cart is empty' });
            }

            // calculate cart total
            let totalSum ;

            userCart.forEach(item => {
                item.products.forEach(product => {
                    totalSum += item.quantity * product.price;
                    

                });
            });


            // Check if the cart total matches the total from the request body
            if (totalSum !== cartTotal) {
                ctx.throw(400, 'Cart total does not match the provided total');
            }


            userCart.forEach(item => {
                item.products.forEach(product => {
                    
                    if (product.products_categories[0].title === coupon.products_categories) {
                        let discount = this.calculateDiscount(product.price, coupon.discountType, coupon.discountValue, coupon.maximumDiscountLimit);
                        
                        if (totalSum >= coupon.minimumPurchaseAmount) {


                            let newPrice = product.price
                            newPrice -= discount;
                            totalSum += item.quantity * newPrice;
                                                    }
                    }
                    
                });
            })

            if(!coupon.products_categories){
                let discount = this.calculateDiscount(totalSum, coupon.discountType, coupon.discountValue, coupon.maximumDiscountLimit);
                
                if (totalSum >= coupon.minimumPurchaseAmount) {
                    totalSum -= discount;
                    
                }
            


            
            // Update the coupon's usage count
            await strapi.query('api::coupon.coupon').update({
                where: { couponCode: couponCode },
                data: { usageCount: coupon.usageCount+1 }
            });

            

            return ctx.send({ message: 'Coupon applied successfully', total: totalSum });

        } }catch (error) {
            ctx.throw(500, 'Internal Server Error', error);
        }
    },
    calculateDiscount(itemPrice, discountType, discountValue, maximumDiscountLimit) {
        
        let discount;

        if (discountType === 'Percentage') {
            discount = (itemPrice * discountValue) / 100;
        } else if (discountType === 'Fixed') {
            discount = discountValue;
        }

        if (maximumDiscountLimit != null && discount > maximumDiscountLimit) {
            discount = maximumDiscountLimit;
        }


        return discount;
    }
}));
