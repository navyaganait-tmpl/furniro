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
      
    ],
    
  };