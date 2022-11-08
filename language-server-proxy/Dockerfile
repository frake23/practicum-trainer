FROM ubuntu:18.04 AS go
RUN apt-get update \
	&& apt-get upgrade -y \
	&& apt-get install -y wget \
	&& export LATEST_VERSION=`wget -qO- https://golang.org/dl | grep -oE go[0-9]+\.[0-9]+\.[0-9]+\.linux-amd64\.tar\.gz | head -n 1` \
	&& wget -c https://dl.google.com/go/$LATEST_VERSION \
	&& tar -xzf $LATEST_VERSION

FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

COPY --from=go /go /go
ENV PATH "${PATH}:/go/bin:/root/go/bin"
ENV GOPATH "/go"
RUN /go/bin/go install golang.org/x/tools/gopls@latest

RUN apt-get -y update

RUN apt-get -y install python3
RUN apt-get -y install python3-setuptools
RUN apt-get -y install python3-pip

RUN pip3 install pep8
RUN pip3 install 'python-language-server[all]'

RUN yarn

COPY . .

EXPOSE 8080

CMD [ "yarn", "start" ]
