module.exports = {
    routes: [
        {
            method: "POST",
            path: "/applyCoupon",
            handler: "coupon.applyCoupon",
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ]
}