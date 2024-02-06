'use strict';

/**
 * user-info controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const bcrypt = require('bcrypt');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

module.exports = createCoreController('api::user-info.user-info', ({ strapi }) => ({
  async signup(ctx) {
    const { username, email, password, remember, googleAccessToken, facebookAccessToken } = ctx.request.body;

    if (email) {
      try {
        const existingUser = await strapi.query('api::user-info.user-info').findOne({
          where: {
            email: email,
          },
        });

        if (existingUser) {
          return ctx.badRequest('Email is already taken');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await strapi.query('api::user-info.user-info').create({
          data: {
            username,
            email,
            password: hashedPassword,
          },
        });

        const jwtToken = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });
        const expirationTime = remember ? '7d' : '1d';

        ctx.cookies.set('jwt', jwtToken, {
          httpOnly: true,
          maxAge: expirationTime,
        });

        return {
          user,
          message: 'User registered successfully',
        };
      } catch (error) {
        console.error('Error during signup:', error);
        return ctx.badRequest('Signup failed');
      }
    } else if (googleAccessToken) {
      try {
        const CLIENT_ID_GOOGLE = '1004756996202-d53f7ijm7lnl4qmm1trpnpuj49q1p6hm.apps.googleusercontent.com';
        const AUTHORIZED_PARTY = '1004756996202-d53f7ijm7lnl4qmm1trpnpuj49q1p6hm.apps.googleusercontent.com';

        const getDecodedOAuthJwtGoogle = async (token) => {
          try {
            const client = new OAuth2Client(CLIENT_ID_GOOGLE);
            const ticket = await client.verifyIdToken({
              idToken: token,
              audience: CLIENT_ID_GOOGLE,
            });
            console.log('Decoded Token:', ticket.getPayload());
            return ticket;
          } catch (error) {
            return { status: 500, data: error };
          }
        };

        const decodedToken = await getDecodedOAuthJwtGoogle(googleAccessToken);

        if (!decodedToken || !decodedToken.payload || decodedToken.payload.aud !== AUTHORIZED_PARTY) {
          console.error('Google Access Token does not contain a valid payload:', decodedToken);
          return ctx.badRequest('Invalid Google Access Token');
        }

        const googleUserId = decodedToken.payload.sub;

        if (!googleUserId) {
          console.error('Google Access Token does not contain a valid user ID:', decodedToken.payload);
          return ctx.badRequest('Invalid Google Access Token');
        }

        const existingUser = await strapi.query('api::user-info.user-info').findOne({
          where: {
            email: decodedToken.payload.email,
          },
        });

        if (existingUser) {
          return ctx.badRequest('User already exists');
        }

        const newUser = await strapi.query('api::user-info.user-info').create({
          data: {
            username: decodedToken.payload.name,
            email: decodedToken.payload.email,
          },
        });

        return ctx.send({
          user: newUser,
          message: 'User registered successfully',
        });
      } catch (error) {
        console.error('Google login failed:', error);
        return ctx.badRequest('Google login failed');
      }
    } else if (facebookAccessToken) {
      try {
        const facebookResponse = await axios.get(`https://graph.facebook.com/v15.0/me`, {
          params: {
            fields: 'id,name,email',
            access_token: facebookAccessToken,
          },
        });
        const facebookUserData = facebookResponse.data;
        console.log("facebook",facebookUserData);
        if (!facebookUserData || facebookUserData.error) {
          console.error('Facebook Access Token is not valid:', facebookUserData);
          return ctx.badRequest('Invalid Facebook Access Token');
        }

        const existingUser = await strapi.query('api::user-info.user-info').findOne({
          where: {
            email: facebookUserData.email,
          },
        });

        if (existingUser) {
          return ctx.badRequest('User already exists');
        }

        const newUser = await strapi.query('api::user-info.user-info').create({
          data: {
            username: facebookUserData.name,
            email: facebookUserData.email,
          },
        });

        return ctx.send({
          user: newUser,
          message: 'User registered successfully',
        });
      } catch (error) {
        console.error('Facebook login failed:', error);
        return ctx.badRequest('Facebook login failed');
      }
    }else{
      if (!email || !password) {
        return ctx.badRequest('Please enter valid credentials');
      }
    }

    return ctx.badRequest('Invalid request. No authentication method provided.');
  },

  async login(ctx) {
    const { username, email, password, remember, googleAccessToken, facebookAccessToken } = ctx.request.body;

    if (email) {
      try {
        // Find the user by email
        const user = await strapi.query('api::user-info.user-info').findOne({
          where: {
            email: email,
          },
        });
  
        if (!user) {
          return ctx.badRequest('Invalid email');
        }
  
        // Check if the provided password matches the stored hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
  
        if (!passwordMatch) {
          return ctx.badRequest('Invalid password');
        }
  
        // Generate JWT
        const jwtToken = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });
        const expirationTime = remember ? '7d' : '1d';
  
        // Set JWT as a secure HTTP-only cookie
        ctx.cookies.set('jwt', jwtToken, {
          httpOnly: true,
          maxAge: expirationTime,
        });
  
        return {
          user,
          message: 'User logged in',
        };
  
      } catch (error) {
        console.error('Error during login:', error);
        return ctx.badRequest('Login failed');
      }
    
    } else if (googleAccessToken) {
      try {
        const CLIENT_ID_GOOGLE = '1004756996202-d53f7ijm7lnl4qmm1trpnpuj49q1p6hm.apps.googleusercontent.com';
        const AUTHORIZED_PARTY = '1004756996202-d53f7ijm7lnl4qmm1trpnpuj49q1p6hm.apps.googleusercontent.com';

        const getDecodedOAuthJwtGoogle = async (token) => {
          try {
            const client = new OAuth2Client(CLIENT_ID_GOOGLE);
            const ticket = await client.verifyIdToken({
              idToken: token,
              audience: CLIENT_ID_GOOGLE,
            });
            console.log('Decoded Token:', ticket.getPayload());
            return ticket;
          } catch (error) {
            return { status: 500, data: error };
          }
        };

        const decodedToken = await getDecodedOAuthJwtGoogle(googleAccessToken);

        if (!decodedToken || !decodedToken.payload || decodedToken.payload.aud !== AUTHORIZED_PARTY) {
          console.error('Google Access Token does not contain a valid payload:', decodedToken);
          return ctx.badRequest('Invalid Google Access Token');
        }

        const googleUserId = decodedToken.payload.sub;

        if (!googleUserId) {
          console.error('Google Access Token does not contain a valid user ID:', decodedToken.payload);
          return ctx.badRequest('Invalid Google Access Token');
        }

        let existingUser = await strapi.query('api::user-info.user-info').findOne({
          where: {
            email: decodedToken.payload.email,
          },
        });

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash('temporary-password', 10);
          existingUser = await strapi.query('api::user-info.user-info').create({
            data: {
              username: decodedToken.payload.name,
              email: decodedToken.payload.email,
            },
          });
        }

        
        return ctx.send({
          user: existingUser,
          message: 'User logged in',
        });
      } catch (error) {
        console.error('Google login failed:', error);
        return ctx.badRequest('Google login failed');
      }
    } else if (facebookAccessToken) {
      try {
        const facebookResponse = await axios.get(`https://graph.facebook.com/v15.0/me`, {
          params: {
            fields: 'id,name,email',
            access_token: facebookAccessToken,
          },
        });
        const facebookUserData = facebookResponse.data;
        console.log("facebook",facebookUserData);
        if (!facebookUserData || facebookUserData.error) {
          console.error('Facebook Access Token is not valid:', facebookUserData);
          return ctx.badRequest('Invalid Facebook Access Token');
        }

        let existingUser = await strapi.query('api::user-info.user-info').findOne({
          where: {
            email: facebookUserData.email,
          },
        });

        if (!existingUser) {
          const newUser = await strapi.query('api::user-info.user-info').create({
            data: {
              username: facebookUserData.name,
              email: facebookUserData.email,
            },
          });
        }

        

        return ctx.send({
          user: existingUser,
          message: 'User logged in',
        });
      } catch (error) {
        console.error('Facebook login failed:', error);
        return ctx.badRequest('Facebook login failed');
      }
    }else{
      if (!email || !password) {
        return ctx.badRequest('Please enter valid credentials');
      }
    }

    return ctx.badRequest('Invalid request. No authentication method provided.');
  },
}));
