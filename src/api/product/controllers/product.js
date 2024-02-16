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
                    ]
                }
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
            // console.log(ctx.request.headers.authorization);
            // console.log(ctx.state.user);
            const { action, productId } = ctx.request.body;
            // console.log("check1");
            // const { user } = ctx.state;
            // check first if token in headers authorizations.
            const tokendata = await strapi.plugins["users-permissions"].services.jwt.getToken(ctx)

            // console.log("user", user);
            // console.log("user", tokendata.userId);
            // Get the user's wishlist
            const userInfo = await strapi.query('api::user-info.user-info').findOne({ where: { id: tokendata.userId }, populate:['wishlist'], });
            // const wishlist = userInfo.wishlist;
            console.log(userInfo);
            // console.log("here", userInfo);
            // const populatedWishlist = await strapi.query('api::user-info.user-info').findOne({ where: { id: userInfo.id }, populate: ['wishlist'], })
            // console.log("here", populatedWishlist);
            // console.log(populatedWishlist);
            // Get the user's wishlist
            let wishlist1 = userInfo.wishlist;
            console.log("wishlist1", wishlist1);

            // if (populatedWishlist && populatedWishlist.wishlist && Array.isArray(populatedWishlist.wishlist.id)) {
            //     wishlistIds = populatedWishlist.wishlist.id;
            // }

            // console.log(wishlist1);
            // Logic to add or remove product from user's wishlist

            if (action === 'unlike') {
                // Remove the product from the wishlist
                wishlist1 = wishlist1.filter(product => product.id !== productId);
                // console.log(wishlist1);
            } else if (action === 'like') {
                // Add the product to the wishlist
                const product = await strapi.query('api::product.product').findOne({where:{ id: productId} });
                if (!product) {
                    ctx.throw(404, 'Product not found');
                }
                wishlist1.push(product);
            }

            console.log("wishlist1", wishlist1);
            const wishlistids = wishlist1.map(product => product.id);
            console.log(wishlistids);
            const updatedUser = await strapi.query('api::user-info.user-info').update({
                where: { id: userInfo.id },
                // data:{ wishlist:wishlist1},
                populate: ['wishlist.products'],
                data: {
                    wishlist: wishlist1,

            }});

            console.log("updated", updatedUser);
            if (!updatedUser) {
                ctx.throw(400, 'Failed to update user');
            }
            // const populatedWishlis = await strapi.query('api::user-info.user-info').findOne({ where: { id: userInfo.id }, populate: ['wishlist.products'], })

            // console.log(populatedWishlis);
            ctx.send({ message: 'Product updated in wishlist successfully', wishlist1 });
        } catch (error) {
            ctx.throw(400, 'Failed to append product to user\'s wishlist', error);
        }

    },
    async compareProducts(ctx) {
        try {
            const { product } = ctx.request.body;
            console.log(ctx.request);
            console.log(ctx.request.body);
            console.log(product);
            // console.log("Type of productIds[0]:", typeof product[0]);
            // Fetch product data for each ID
            const productsData = await strapi.query('api::product.product').findMany({
                where: { id: product },
                populate: ['Additional_info.general', 'Additional_info.product'],
            });
            // productsData.forEach(item => {
            //     const additionalInfo = item.Additional_info;
            //     console.log(additionalInfo);
            //   });
            console.log(productsData);

            
            let response;
            if (productsData.length === 0) {
                response = { message: 'No data for comparsion', status: 400 };
            } else {
                response = { productsData,  status: 200 };
            }

            // Send the response
            ctx.send(response);
        } catch (error) {
            ctx.throw(500, 'Internal Server Error', error);
        }
    },
    async relatedProducts(ctx){
        try{
            const { product } = ctx.request.body;
            console.log(ctx.request.body);
            // Fetch the category of the first product
            const firstProduct = await strapi.query('api::product.product').findOne({
                where: { id: product[0] },
                populate: ['products_categories'],
            });
            // const firstProductCategory = await strapi.query('api::products-category.products-category').findOne({ id: firstProduct.category });
            console.log(firstProduct.products_categories[0].title);
            // Fetch related products for the category of the first product
            const relatedProductsForCategory = await strapi.query('api::products-category.products-category').findOne({
                where: {
                    title: firstProduct.products_categories[0].title,
                },
                populate: ['products'],
            });
            // console.log(relatedProductsForCategory);

            //     const relatedProductsIds = relatedProductsForCategory.products
            //     .filter(product => !productIds.includes(product.id))
            //     .map(product => product.id);
            // console.log(relatedProductsIds);
            const numericProductIds = product.map(id => parseInt(id, 10));
            const filteredProducts = relatedProductsForCategory.products.filter(product => !numericProductIds.includes(product.id));
            console.log(filteredProducts);

            let response;
            if (filteredProducts.length === 0) {
                response = { message: 'No products for comparison', status: 400 };
            } else {
                response = {filteredProducts, status: 200 };
            }

            // Send the response
            ctx.send(response);

        }catch(error){
            ctx.throw(500, 'Internal Server Error', error);
        }
    }


}));
