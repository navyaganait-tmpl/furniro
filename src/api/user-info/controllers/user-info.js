'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const bcrypt = require('bcrypt');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const sendConfirmationEmail = require('../../email');
// const sendConfirmationEmail = require('../../email');

module.exports = createCoreController('api::user-info.user-info', ({ strapi }) => ({

  async signup(ctx) {
    try {
      if (ctx.request.body.email) {

        if (ctx.request.body.password !== ctx.request.body.confirmPassword) {
          return this.returnMessage(ctx, null, {
            status: '400',
            name: 'ValidationError',
            message: 'Passwords do not match',
          });
        }
        console.log("check1");

        const existingUser = await this.findUserByEmail(ctx.request.body.email);

        console.log("check2");
        if (existingUser) {
          return this.returnMessage(ctx, null, {
            status: '409',
            name: 'ValidationError',
            message: 'Email is already taken',
          });
        }

        const user = await this.createUser(ctx.request.body.username, ctx.request.body.email, ctx.request.body.password);

        // Generate a new OTP
        const newOTP = Math.floor(100000 + Math.random() * 900000);

        // Save the new OTP in the otp table
        const createdOTP = await strapi.query('api::otp.otp').create({
          data: {
            OTP: newOTP,
            email: ctx.request.body.email,
          }
        });

        // Send the OTP to the user's email
        const subject = 'Your OTP';
        const text = `Your signup OTP is: ${newOTP}`;
        await sendConfirmationEmail(ctx.request.body.email, subject, text);



        return {
          message: 'Check your email for conformation',
          // otp: createdOTP,
        };


      } else if (ctx.request.body.googleAccessToken) {
        const user = await this.signupWithGoogle(ctx, ctx.request.body.googleAccessToken);
        return this.returnMessage(ctx, {
          user,
          message: 'User registered successfully',
        });
      } else if (ctx.request.body.facebookAccessToken) {
        const user = await this.signupWithFacebook(ctx.request.body.facebookAccessToken);
        return this.returnMessage(ctx, {
          user,
          message: 'User registered successfully',
        });
      } else {
        return this.returnMessage(ctx, null, {
          status: '400',
          name: 'ValidationError',
          message: 'Please provide valid credentials',
        });
      }
    } catch (error) {
      console.error('Error during signup:', error);
      return ctx.badRequest('Signup failed');
    }
  },

  async otp(ctx) {
    try {
      if(ctx.request.query.page=='signupVerify')
      {if (!ctx.request.body.otp || !ctx.request.body.email) {
        return ctx.response.badRequest('Enter valid credentials');
      }
      // Find the OTP in the database
      const otpEntry = await strapi.query('api::otp.otp').findOne({
        where: {
          $and:
            [{ OTP: ctx.request.body.otp },
            { email: ctx.request.body.email },]
        },

      });

      if (!otpEntry) {
        return ctx.response.badRequest('Invalid OTP');
      }
      // Calculate the expiry date (15 minutes after creation)
      const createdAt = new Date(otpEntry.createdAt);

      const expiryDate = new Date(createdAt.getTime() + 15 * 60 * 1000);

      // Check if OTP is not found or  expired


      if (expiryDate < new Date()) {
        return ctx.response.badRequest('expired OTP');
      }

      const admin = await strapi.query("plugin::users-permissions.user").findOne({ where: { id: 1 } });

      // const user = await this.createUser(ctx.request.body.username, ctx.request.body.email, ctx.request.body.password);
      const user = await strapi.query("api::user-info.user-info").update({
        where: {
          email: ctx.request.body.email,
        }, data: {
          registered: true,
        }
      })

      // const jwtToken = jwt.sign({userId:user.id}, process.env.ADMIN_JWT_SECRET, { expiresIn: '1h' });
      const jwtToken = strapi.plugins['users-permissions'].services.jwt.issue({
        adminId: admin.id,
        userId: user.id
      });
      this.setRememberMeCookie(ctx, jwtToken, ctx.request.body.remember);


      let otpsToDelete = await strapi.query('api::otp.otp').findMany({
        where: { email: ctx.request.body.email }
      });

      const otpIdsToDelete = otpsToDelete.map(otp => otp.id);

      // Invalidate the OTP
      let deleteUser = await strapi.query('api::otp.otp').deleteMany({
        where:
          { id: otpIdsToDelete }

      }
      );

      return this.returnMessage(ctx, {
        jwtToken,
        user,
        message: 'User registered successfully',
      });}

      if(ctx.request.query.page=='resetPassword'){
        if (!ctx.request.body.otp) {
          return ctx.response.badRequest('Invalid OTP');
      }
      if (!ctx.request.body.email||!ctx.request.body.password) {
          return ctx.response.badRequest('Invalid credentials');
      }



      // Find the OTP in the database
      const otpEntry = await strapi.query('api::otp.otp').findOne({
          where: {
            $and:
              [{ OTP: ctx.request.body.otp },
              { email: ctx.request.body.email },]
          },
          populate:['user_info'],
      })
      if (!otpEntry) {
          return ctx.response.badRequest('Invalid OTP');
      }

      const createdAt = new Date(otpEntry.createdAt);

      const expiryDate = new Date(createdAt.getTime() + 15 * 60 * 1000);
      
                 

      if (expiryDate < new Date()) {
          return ctx.response.badRequest('expired OTP');
      }

      // Update the user's password with the new password
      const user = await strapi.query('api::user-info.user-info').update({
          where:
              { id: otpEntry.user_info.id },
          data:
              { password: ctx.request.body.password }
      }
      );
      console.log(user);

      let otpsToDelete = await strapi.query('api::otp.otp').findMany({
          where: { user_info: user.id }
      });

      const otpIdsToDelete = otpsToDelete.map(otp => otp.id);

      // Invalidate the OTP
      let deleteUser = await strapi.query('api::otp.otp').deleteMany({
          where:
              { id: otpIdsToDelete }

      }
      );
      
      // Send the response
      return {
          message: 'Password reset successfully',
      };
      }

      else{
        return ctx.badRequest('Page doesnt exixt');
      }
    } catch (error) {
      console.error('Error during signup:', error);
      return ctx.badRequest('Signup falied');
    }
  },

  async login(ctx) {
    try {
      if (ctx.request.body.email) {
        const user = await this.findUserByEmail(ctx.request.body.email);

        if (!user) {
          return this.returnMessage(ctx, null, {
            status: '400',
            name: 'ValidationError',
            message: 'Invalid email',
          });
        }

        // const passwordMatch = await bcrypt.compare(ctx.request.body.password, user.password);

        if (ctx.request.body.password !== user.password) {
          return this.returnMessage(ctx, null, {
            status: '400',
            name: 'ValidationError',
            message: 'Invalid password',
          });
        }

        const admin = await strapi.query("plugin::users-permissions.user").findOne({ where: { id: 1 } });
        // const jwtToken = jwt.sign({userId:user.id}, process.env.ADMIN_JWT_SECRET, { expiresIn: '1h' });
        const jwtToken = strapi.plugins['users-permissions'].services.jwt.issue({
          id: admin.id,
          userId: user.id
        });

        this.setRememberMeCookie(ctx, jwtToken, ctx.request.body.remember);

        return this.returnMessage(ctx, {
          jwtToken,
          user,
          message: 'User logged in',
        });
      } else if (ctx.request.body.googleAccessToken) {
        const user = await this.signupWithGoogle(ctx, ctx.request.body.googleAccessToken);
        return this.returnMessage(ctx, {
          user,
          message: 'User logged in',
        });
      } else if (ctx.request.body.facebookAccessToken) {
        const user = await this.signupWithFacebook(ctx.request.body.facebookAccessToken);
        return this.returnMessage(ctx, {
          user,
          message: 'User logged in',
        });
      } else {
        return this.returnMessage(ctx, null, {
          status: '400',
          name: 'ValidationError',
          message: 'Please provide valid credentials',
        });
      }
    } catch (error) {
      console.error('Error during login:', error);
      return ctx.badRequest('Login failed');
    }
  },

  async findUserByEmail(email) {
    return await strapi.query('api::user-info.user-info').findOne({
      where: {
        $and: [{ email: email },
        {
          registered: true
        }]
      },
    });
  },

  async createUser(username, email, password) {
    try {
      return await strapi.query('api::user-info.user-info').create({
        data: {
          username: username,
          email: email,
          password: password,
        },
      });
    } catch (error) {
      console.error('Error while creating user:', error);
      throw error;
    }
  },

  returnMessage(ctx, data = null, error = null) {
    return {
      data: data,
      error: error,
    };
  },

  async signupWithGoogle(ctx, accessToken) {
    try {

      const getDecodedOAuthJwtGoogle = async (token) => {
        try {
          const client = new OAuth2Client(process.env.CLIENT_ID_GOOGLE);

          const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID_GOOGLE,
          });

          return ticket;
        } catch (error) {
          return { status: 500, data: error };
        }
      };


      const decodedToken = await getDecodedOAuthJwtGoogle(accessToken);

      if (!decodedToken || !decodedToken.payload || decodedToken.payload.aud !== process.env.AUTHORIZED_PARTY) {
        console.error('Google Access Token does not contain a valid payload:', decodedToken);
        return ctx.badRequest('Invalid Google Access Token');
      }

      // const googleUserId = decodedToken.payload.sub;

      if (!decodedToken.payload.sub) {
        console.error('Google Access Token does not contain a valid user ID:', decodedToken.payload);
        return ctx.badRequest('Invalid Google Access Token');
      }

      const existingUser = await this.findUserByEmail(decodedToken.payload.email);

      if (existingUser) {
        return existingUser;
      }

      return await this.createUser(decodedToken.payload.name, decodedToken.payload.email, ''); // Password is not required for Google signup
    } catch (error) {
      console.error('Error during Google signup:', error);
      throw error;
    }
  },

  async signupWithFacebook(accessToken) {
    try {
      const response = await axios.get(`https://graph.facebook.com/v15.0/me`, {
        params: {
          fields: 'id,name,email',
          access_token: accessToken,
        },
      });
      const userData = response.data;

      if (!userData || userData.error) {
        throw new Error('Invalid Facebook Access Token');
      }

      const existingUser = await this.findUserByEmail(userData.email);

      if (existingUser) {
        return existingUser;
      }

      return await this.createUser(userData.name, userData.email, '');
    } catch (error) {
      console.error('Error during Facebook signup:', error);
      throw error;
    }
  },

  setRememberMeCookie(ctx, jwtToken, remember) {
    if (remember) {
      const expirationTime = '7d';
      ctx.cookies.set('jwt', jwtToken, {
        httpOnly: true,
        maxAge: expirationTime,
      });
    } else {
      const expirationTime = '1d';
      ctx.cookies.set('jwt', jwtToken, {
        httpOnly: true,
        maxAge: expirationTime,
      });
    }
  },

}));
