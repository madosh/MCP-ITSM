FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source
COPY backend/ ./

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"] 