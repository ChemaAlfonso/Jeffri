# Use the official Node.js image as the base image
FROM node:22.4

# Set the working directory inside the container
WORKDIR /usr/app

# Copy package.json and package-lock.json to the working directory
COPY ./server/package*.json ./

# Install the project dependencies
RUN npm install

# Copy the rest of the application files to the working directory
COPY client/dist ./client
COPY server/dist ./server
COPY .env ../.env

# Expose the port the app runs on
EXPOSE 4021

# Command to run the application
CMD ["node", "server/main.js"]