module.exports = {
    routes: [
      {
        method: "POST",
        path: "/generateOTP",
        handler: "otp.generateOTP",
        config: {
          policies: [],
          middlewares: [],
        },
      },
      {
        method: "POST",
        path: "/resetPassword",
        handler: "otp.resetPassword",
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
    
  };