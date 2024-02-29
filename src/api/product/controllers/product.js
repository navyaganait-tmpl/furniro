'use strict';

/**
 * Product controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::product.product', ({ strapi }) => ({
    async searchProducts(ctx) {
        try {
            const searchValue = ctx.params.searchvalue;


            const products = await strapi.query('api::product.product').findMany({
                filters: {
                    $or: [
                        { name: searchValue },
                        { longDesc: searchValue },
                        // { products_categories:{
                        //     title: searchValue
                        // }}
                    ]
                },
                // populate: ['products_categories']
            });


            // If no products match the search criteria, return 400: No Content Matches Your Search
            if (!products || products.length === 0) {
                return ctx.send('No Content Matches Your Search');
            }

            // Return products with title, category, price, discount, and photo
            return ctx.send(products);
        } catch (error) {
            console.error('Error during product search:', error);
            return ctx.response.badRequest('Product search failed');
        }
    },
    async addToWishlist(ctx) {
        try {

            const { action, productId } = ctx.request.body;
            if (!action || !productId) {
                ctx.throw('Action or productId missing', 400);
            }

            let tokendata;

            try {
                tokendata = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx);
            } catch (err) {
                return handleErrors(ctx, err, 'unauthorized');
            }
            if (!tokendata) {
                ctx.throw(401, 'No token provided');
            }

            const userInfo = await strapi.query('api::user-info.user-info').findOne({ where: { id: tokendata.userId }, populate: ['wishlist'], });
            if (!userInfo) {
                ctx.throw("No user found", 400);
            }

            let wishlist1 = userInfo.wishlist;


            if (action === 'unlike') {

                // Remove the product from the wishlist
                wishlist1 = wishlist1.filter(product => product.id !== productId);

            } else if (action === 'like') {

                // Add the product to the wishlist
                const product = await strapi.query('api::product.product').findOne({ where: { id: productId } });
                if (!product) {
                    ctx.throw(404, 'Product not found');
                }
                wishlist1.push(product);
            }


            const wishlistids = wishlist1.map(product => product.id);

            const updatedUser = await strapi.query('api::user-info.user-info').update({
                where: { id: userInfo.id },
                // data:{ wishlist:wishlist1},
                populate: ['wishlist.products'],
                data: {
                    wishlist: wishlist1,

                }
            });



            if (!updatedUser) {
                ctx.throw(400, 'Failed to update user');
            }

            ctx.send({ message: 'Product updated in wishlist successfully' });
        } catch (error) {
            ctx.throw(400, 'Failed to append product to user\'s wishlist', error);
        }

    },

    async wishlistItems(ctx) {
        console.log("----------------------------WISHLIST API-----------------------");
        try {
            let tokendata;

            try {
                tokendata = await strapi.plugins['users-permissions'].services.jwt.getToken(ctx);
            } catch (err) {
                return handleErrors(ctx, err, 'unauthorized');
            }
            if (!tokendata) {
                ctx.throw(401, 'No token provided');
            }

            const userInfo = await strapi.query('api::user-info.user-info').findOne({ where: { id: tokendata.userId }, populate: ['wishlist'], });
            if (!userInfo) {
                ctx.throw("No user found", 400);
            }

            let wishlist1 = userInfo.wishlist;


            ctx.send(wishlist1);

        } catch (error) {
            ctx.throw(400, 'Failed to get the wishlist', error);
        }
    },
    async compareProducts(ctx) {
        try {
            const { productId } = ctx.request.body;
            if (!productId) {
                ctx.throw('Product id required', 400);
            }

            // Fetch product data for each ID
            const productsData = await strapi.query('api::product.product').findMany({
                where: { id: productId },
                populate: ['Additional_info.general', 'Additional_info.product', 'Additional_info.dimensions', 'Additional_info.warranty'],
            });




            let response;
            if (productsData.length === 0) {
                response = { message: 'No data for comparsion', status: 400 };
            } else {
                response = { productsData, status: 200 };
            }
            if (!response) {
                ctx.throw('No data for comparison', 400);
            }

            // Send the response
            ctx.send(response);
        } catch (error) {
            ctx.throw(500, 'Internal Server Error', error);
        }
    },
    async relatedProducts(ctx) {
        try {
            const { productId } = ctx.request.body;
            if (!productId) {
                ctx.throw('Product ID required', 400);
            }

            // Fetch the category of the first product
            const firstProduct = await strapi.query('api::product.product').findOne({
                where: { id: productId[0] },
                populate: ['products_categories'],
            });

            // Fetch related products for the category of the first product
            const relatedProductsForCategory = await strapi.query('api::products-category.products-category').findOne({
                where: {
                    title: firstProduct.products_categories[0].title,
                },
                populate: ['products'],
            });

            const numericProductIds = productId.map(id => parseInt(id, 10));
            const filteredProducts = relatedProductsForCategory.products.filter(product => !numericProductIds.includes(product.id));


            let response;
            if (filteredProducts.length === 0) {
                response = { message: 'No products for comparisons', status: 400 };
            } else {
                response = { filteredProducts, status: 200 };
            }
            if (!response) {
                ctx.throw('No products for comparison');
            }
            // Send the response
            ctx.send(response);

        } catch (error) {
            ctx.throw(500, 'Internal Server Error', error);
        }
    }


}));
