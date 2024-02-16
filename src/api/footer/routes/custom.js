module.exports = {
    routes: [
        {
            method: "POST",
            path: "/subscribe",
            handler: "footer.subscribe",
            config: {
                policies: [],
                middlewares: [],
            },
        },

    ],

};