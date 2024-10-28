# Use Puppeteer base image
FROM ghcr.io/puppeteer/puppeteer:23.6.0

# Set necessary environment variables to skip Chromium download and define cache directory
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    PUPPETEER_CACHE_DIR=/opt/render/project/puppeteer \
    XDG_CACHE_HOME=/opt/render/project/cache
    
WORKDIR /usr/src/app

# Copy package.json and yarn.lock to install dependencies
COPY package*.json ./
RUN yarn install

# Copy application code
COPY . .

# Build application (if applicable)
RUN yarn build

# Puppeteer cache handling
RUN if [ ! -d $PUPPETEER_CACHE_DIR ]; then \
        echo "...Copying Puppeteer Cache from Build Cache" && \
        cp -R $XDG_CACHE_HOME/puppeteer/ $PUPPETEER_CACHE_DIR; \
    else \
        echo "...Storing Puppeteer Cache in Build Cache" && \
        cp -R $PUPPETEER_CACHE_DIR $XDG_CACHE_HOME; \
    fi

# Set the command to start your application
CMD ["node", "--optimize_for_size", "--max_old_space_size=460", "--gc_interval=100", "dist/main.js"]
