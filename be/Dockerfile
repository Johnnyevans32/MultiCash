# 
FROM node:20

# 
WORKDIR /code

ENV USE_DOCKER=true

# 
COPY ./package.json /code/package.json

# 
RUN yarn

# 
COPY . /code

# 
CMD ["yarn", "run", "start"]
