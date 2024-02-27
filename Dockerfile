# Use an official Node.js runtime as a parent image
FROM node:14.19.1

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install Strapi dependencies
RUN npm install

# Copy the rest of the Strapi application code to the container
COPY . .

# Build the Strapi application (if needed)
RUN npm run build

# Expose the port that Strapi will run on
EXPOSE 1337

# Start Strapi in production mode
CMD ["npm", "run" , "develop"]

