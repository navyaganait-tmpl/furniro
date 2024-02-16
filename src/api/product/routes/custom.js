module.exports = {
    routes: [
        {
            method: "GET",
            path: "/products/:searchvalue",
            handler: "product.searchProducts",
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: "POST",
            path: "/addToWishlist",
            handler: "product.addToWishlist",
            config: {
                auth: false
            }
        },
        {
            method: "POST",
            path: "/compareProducts",
            handler: "product.compareProducts",
            config: {
                policies: [],
                middlewares: [],
            }
        },
        {
            method: "POST",
            path: "/relatedProducts",
            handler: "product.relatedProducts",
            config: {
                policies: [],
                middlewares: [],
            }
        }
    ]
};