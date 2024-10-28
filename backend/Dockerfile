# Use Puppeteer base image
FROM ghcr.io/puppeteer/puppeteer:23.6.0

# Set necessary environment variables to skip Chromium download and define cache directory
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable 

WORKDIR /usr/src/app

# Copy package.json and yarn.lock to install dependencies
COPY package*.json ./
RUN yarn install

# Copy application code
COPY . .

# Build application (if applicable)
RUN yarn build

# Puppeteer cache handling
RUN npx puppeteer browsers install chrome
# Set the command to start your application
CMD ["node", "--optimize_for_size", "--max_old_space_size=460", "--gc_interval=100", "dist/main.js"]
