module.exports = {
    routes: [
        {
            method: "POST",
            path: "/addToCart",
            handler: "cart.addToCart",
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: "GET",
            path: "/getCart",
            handler: "cart.getCart",
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: "POST",
            path: "/deleteFromCart",
            handler: "cart.deleteFromCart",
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: "POST",
            path: "/updateQuantity",
            handler: "cart.updateQuantity",
            config: {
                policies: [],
                middlewares: [],
            },
        },

    ],

};