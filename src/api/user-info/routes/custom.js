module.exports = {
  routes: [
    {
      method: "POST",
      path: "/signup",
      handler: "user-info.signup",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/otp",
      handler: "user-info.otp",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/login",
      handler: "user-info.login",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],

};