FROM language-server-proxy

RUN apt-get -y update

RUN apt-get -y install python3.11
RUN apt-get -y install python3.11-venv
RUN apt-get -y install python3-setuptools
RUN apt-get -y install python3-pip
RUN python3.11 -m venv .venv && . .venv/bin/activate

RUN python3.11 -m pip install pep8 --break-system-packages
RUN python3.11 -m pip install 'python-language-server[all]' --break-system-packages

ENV LANGUAGE=python
ENV PROC_COMMAND=pyls
