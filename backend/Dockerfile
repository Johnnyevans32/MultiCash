FROM ghcr.io/puppeteer/puppeteer:23.6.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .

CMD ["node", "--optimize_for_size", "--max_old_space_size=460", "--gc_interval=100", "dist/main.js"]
