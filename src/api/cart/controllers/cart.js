'use strict';

/**
 * cart controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::cart.cart', ({ strapi }) => ({
    async addToCart(ctx) {
        try {

            // Authenticate the user using JWT
            // Validate JWT
            // if(not validated)
            //     Throw error
            let tokendata;

            try {
                tokendata = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx);
            } catch (err) {
                return handleErrors(ctx, err, 'unauthorized');
            }
            

            if (!tokendata) {
                ctx.throw(401, 'No token provided');
            }

            // Get product ID from the request body.
            const { productId } = ctx.request.body;
            
            // If (!product ID) 
            //     throw error
            if (!productId) {
                return ctx.throw(400, 'Product ID is required');
            }
            // Check if the product ID exists in the system
            // If (product does not exist)
            //     return error
            const product = await strapi.query('api::product.product').findOne({ id: productId });
            if (!product) {
                return ctx.throw(400, 'Product not found');
            }
            
            // Check if the product ID exist in the cart
            const existingCartItem = await strapi.query('api::cart.cart').findOne({
                where: {
                    products: { id: productId },
                    user_infos: { id: tokendata.userId, },
                },
                populate: ['user_infos', 'products'],
            });
            
            // If (product exists)
            // Return message ‘product already in cart’ with status code 200
            if (existingCartItem) {
                return ctx.send('Product already in cart', 200);
            }

            // Add a new item to the cart
            const newCartItem = await strapi.query('api::cart.cart').create({
                data: {
                    products: { id: productId },
                    quantity: 1,
                    user_infos: { id: tokendata.userId, },
                }
            });
            

            
            ctx.send('Product added to the cart', 200);

        } catch (error) {
            ctx.throw(500, 'Internal Server Error', error);

        }
    },
    async getCart(ctx) {
        try {
            //     Authenticate the user using JWT.
            //     Validate the JWT.
            //    if(not validated)
            //        Throw error
            let tokendata;

            try {
                tokendata = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx);
            } catch (err) {
                return handleErrors(ctx, err, 'unauthorized');
            }
            

            if (!tokendata) {
                ctx.throw(401, 'No token provided');
            }
            //     Retrieve the user's cart information
            const userCart = await strapi.query('api::cart.cart').findMany({
                where: {
                    user_infos: { id: tokendata.userId, },
                },
                populate: ['products'],
            });
            
            //    If (cart is empty)
            //           Return a message 'Cart is empty'
            if (!userCart || userCart.length === 0) {
                return ctx.send({ message: 'Cart is empty' });
            }
            //           Update the total sum
       

            let totalSum = 0;

            userCart.forEach(item => {
                item.products.forEach(product => {
                    totalSum += item.quantity * product.price;
                    

                });
            });

           
            //                       Return the cart data with status code 200.
            ctx.send({ totalSum, userCart });

        } catch (error) {
            ctx.throw(500, 'Internal Server Error', error);
        }
    },
    async deleteFromCart(ctx) {
        try {
            // Authenticate the user using JWT
            // Validate JWT
            // if(not validated)
            //     Throw error
            let tokendata;

            try {
                tokendata = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx);
            } catch (err) {
                return handleErrors(ctx, err, 'unauthorized');
            }
            
            // Get product ID from the request body.
            if (!tokendata) {
                ctx.throw(401, 'No token provided');
            }
            const { productId } = ctx.request.body;
            
            // If (!product ID) 
            //     throw error
            if (!productId) {
                return ctx.throw(400, 'Product ID is required');
            }
            // Check if the product ID exists in the system
            // If (product does not exist)
            //     return error
            const product = await strapi.query('api::product.product').findOne({ id: productId });
            if (!product) {
                return ctx.throw(400, 'Product not found');
            }
           

            //  Retrieve the user's cart
            const userCart = await strapi.query('api::cart.cart').findMany({
                where: {
                    user_infos: { id: tokendata.userId, },
                },
                populate: ['products'],
            });
            
            //  If (cart is empty || the item does not exist in the cart)
            //        Return an error with status code 404.
            if (!userCart || userCart.length === 0) {
                return ctx.send({ message: 'Cart is empty' });
            }

            let isProductInCart = false
            userCart.forEach(item => {
                item.products.forEach(product => {
                    if (productId === product.id) {
                        isProductInCart = true
                    }

                });
            });
            
            if (!isProductInCart) {
                ctx.throw(404, 'Product not found in the cart');
            }
            // else
            //        Delete the item from the cart.
            await strapi.db.query('api::cart.cart').delete({
                where: {
                    $and: [
                        { user_infos: { id: tokendata.userId, } },
                        { products: { id: productId } }
                    ]
                },
            });
            

            //Return success message 'Item deleted from cart' with status code 200.
            ctx.send({ message: 'Item deleted from cart' });

        } catch (error) {
            ctx.throw(500, 'Internal Server Error', error);
        }
    },
    async updateQuantity(ctx) {
        try {
            // Authenticate the user using JWT
            // Validate JWT
            // if(not validated)
            //     Throw error
            let tokendata;

            try {
                tokendata = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx);
            } catch (err) {
                return handleErrors(ctx, err, 'unauthorized');
            }
            if (!tokendata) {
                ctx.throw(401, 'No token provided');
            }
            
            // Get product ID from the request body.
            const { productId, quantity } = ctx.request.body;
            
            // If (!product ID) 
            //     throw error
            if (!productId) {
                return ctx.throw(400, 'Product ID is required');
            }
            // Check if the product ID exists in the system
            // If (product does not exist)
            //     return error
            const product = await strapi.query('api::product.product').findOne({ id: productId });
            if (!product) {
                return ctx.throw(400, 'Product not found');
            }
            

            //  Retrieve the user's cart
            const userCart = await strapi.query('api::cart.cart').findMany({
                where: {
                    user_infos: { id: tokendata.userId, },
                },
                populate: ['products'],
            });
            
            //  If (cart is empty || the item does not exist in the cart)
            //        Return an error with status code 404.
            if (!userCart || userCart.length === 0) {
                return ctx.send({ message: 'Cart is empty' });
            }

            let isProductInCart = false
            userCart.forEach(item => {
                item.products.forEach(product => {
                    if (productId === product.id) {
                        isProductInCart = true
                    }

                });
            });
            
            if (!isProductInCart) {
                ctx.throw(404, 'Product not found in the cart');
            }
            //If (quantity==0),
            //remove the item from the cart.
            // const{ quantity }= ctx.req.body;
            if (quantity === 0) {
                const deleteEntry = await strapi.db.query('api::cart.cart').delete({
                    where: {
                        $and: [
                            { user_infos: { id: tokendata.userId, } },
                            { products: { id: productId } }
                        ]
                    },
                });
                
            } else {
                //Update the quantity of the item in the cart.
                const updatedEntry = await strapi.db.query('api::cart.cart').update({
                    where: {
                        $and: [
                            { user_infos: { id: tokendata.userId, } },
                            { products: { id: productId } }
                        ]
                    },
                    data: {
                        quantity: quantity,
                    },
                });
                

            }

            ctx.send({ message: 'Cart item updated successfully' });
            // Return success message 'Cart item updated successfully' with status code 200.


        } catch (error) {
            ctx.throw(500, 'Internal Server Error', error);
        }
    }
}));
