module.exports = ({ env }) => {
    return {
        upload: {
            config: {
                provider: 'cloudinary',
                providerOptions: {
                    cloud_name: env('CLOUDINARY_NAME'),
                    api_key: env('CLOUDINARY_KEY'),
                    api_secret: env('CLOUDINARY_SECRET'),
                },
                actionOptions: {
                    upload: {},
                    uploadStream: {},
                    delete: {},
                },
            },
        },
        // redis: {
        //     enabled: true,
        //     config: {
        //         connections: {
        //             default: {
        //                 connection: {
        //                     host: '127.0.0.1',
        //                     port: 6379,
        //                     db: 0,
        //                 },
        //                 settings: {
        //                     debug: true,
        //                 },
        //             },
        //         },
        //     },
        // },
        "rest-cache": {
            enabled: true,
            config: {
                provider: {
                    name: "memory",
                    options: {
                        max: 32767,
                        connection: "default",
                    },
                },
                strategy: {
                    enableEtag: true,
                    logs: true,
                    clearRelatedCache: true,
                    maxAge: 360000,
                    hitpass: false,
                    contentTypes: [
                        // {
                        //     contentTypes: "api::user-info.user-info",
                        //     routes:
                        //         [
                        //             {
                        //                 path: "/api/signup",
                        //                 method: "POST",
                        //                 hitpass: false,
                        //             },
                        //             {
                        //                 path: "/api/login",
                        //                 method: "POST",
                        //                 hitpass: false,
                        //             },

                        //         ]
                        // },
                        // {
                        //     contentTypes: "api::product.product",
                        //     routes:
                        //         [
                        //             {
                        //                 path: "/api/products/:searchvalue",
                        //                 method: "GET",
                        //                 hitpass: false,
                        //             },


                        //         ]
                        // },
                        "api::product.product",
                        "api::banner.banner",
                        "api::cart.cart",
                        "api::footer.footer",
                        "api::product-range.product-range",
                        "api::products-category.products-category"

                    ],
                    debug: true,
                },
            },
        },

    };
};