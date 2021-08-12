# coreon-sparql-client

coreon-sparql-client is a ui application for making sparql queries to the equivalent Coreon endpoint.

It can be loaded inside an iframe, or run as an independent ui app.

## Installation

Prerequisites:
- Docker (20.10.8)
- nginx (nginx/1.18.0 (Ubuntu))

In order for the queries to access the endpoint and receive response, two factors are required:
1. a repository URI that specifies the target from which the data will be parsed
2. an API key for user authentication.

Both pieces of information are meant to be provided dynamically by a parent application (since the current app is configured to be rendered in an iframe inside a parent application).

In order for this app to be run independently, the necessary info will need to be set manually.

To install this application and deploy it as a docker image using nginx, please follow the instructions at
https://www.docker.com/blog/how-to-use-the-official-nginx-docker-image/


```bash
sudo docker build -t webserver .

sudo docker run -it --rm -d -p 8080:80 --name web webserver
```
The application can then be accessed at localhost:8080

## Usage

The UI consists of a form that contains a textarea input. Use this input to build custom queries and submit in order to receive a response from the Coreon sparql endpoint. The response will be rendered as an html table, below the query.

## License
MIT License

Copyright (c) 2021 the Coreon team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
