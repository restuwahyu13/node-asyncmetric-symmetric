######################
# START STAGE 1
######################
FROM node:16.19.1-bullseye
USER ${USER}
COPY ./package.*json ./
COPY . ./

#######################
# UPGRADE STAGE 2
#######################
RUN apt-get autoremove \
  && apt-get autoclean \
  && apt-get update \
  && apt-get upgrade -y \
  && build-essential -y

###############################
# INSTALLATION & BUILD STAGE 3
###############################
RUN npm cache clean -f \
  && npm i node-gyp -g \
  && npm i --loglevel verbose --no-audit --legacy-peer-deps \
  && npm run build

#######################
# FINAL STAGE 4
#######################
EXPOSE 3000
CMD npm start