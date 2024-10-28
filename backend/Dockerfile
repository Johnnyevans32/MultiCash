# Use Puppeteer base image
FROM node:lts-alpine

WORKDIR /usr/src/app

RUN apk update && apk add --no-cache nmap && \
    echo @edge https://dl-cdn.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge https://dl-cdn.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache \
      chromium \
      harfbuzz \
      "freetype>2.8" \
      ttf-freefont \
      nss

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy package.json and yarn.lock to install dependencies
COPY package*.json ./
RUN yarn install

# Copy application code
COPY . .

# Build application (if applicable)
RUN yarn build

# Set the command to start your application
CMD ["node", "--optimize_for_size", "--max_old_space_size=460", "--gc_interval=100", "dist/main.js"]
