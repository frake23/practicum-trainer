FROM language-server-proxy

RUN apt-get update \
	&& apt-get upgrade -y \
	&& apt-get install -y wget \
	&& wget -c https://dl.google.com/go/go1.19.3.linux-arm64.tar.gz \
	&& tar -xzf go1.19.3.linux-arm64.tar.gz -C /

ENV PATH "${PATH}:/go/bin:/root/go/bin"
ENV GOPATH "/go"
RUN /go/bin/go install golang.org/x/tools/gopls@latest

RUN cd / && go mod init practicum-trainer

ENV LANGUAGE=go
ENV PROC_COMMAND=gopls
