module.exports = {
    routes: [
        {
            method: "POST",
            path: "/createOrder",
            handler: "transaction.createOrder",
            config: {
                policies: [],
                middlewares: [],
            },
        },
        
            {
                method: "POST",
                path: "/verifyOrder",
                handler: "transaction.verifyOrder",
                config: {
                    policies: [],
                    middlewares: [],
                },
            },
       

    ],

};