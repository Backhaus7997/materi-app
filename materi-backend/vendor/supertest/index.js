const http = require("node:http");

function request(app) {
  return {
    get: (path) => new TestRequest(app, "GET", path),
    post: (path) => new TestRequest(app, "POST", path),
  };
}

class TestRequest {
  constructor(app, method, path) {
    this.app = app;
    this.method = method;
    this.path = path;
    this.headers = {};
    this.payload = undefined;
  }

  set(name, value) {
    this.headers[name] = value;
    return this;
  }

  send(body) {
    this.payload = body;
    return this;
  }

  expect(status) {
    return this._execute().then((response) => {
      if (response.status !== status) {
        const error = new Error(`Expected status ${status} but received ${response.status}`);
        error.response = response;
        throw error;
      }
      return response;
    });
  }

  _execute() {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(0, () => {
        const { port } = server.address();
        const requestOptions = {
          method: this.method,
          hostname: "127.0.0.1",
          port,
          path: this.path,
          headers: { ...this.headers },
        };

        let body = this.payload;
        if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
          body = JSON.stringify(body);
          requestOptions.headers["content-type"] = requestOptions.headers["content-type"] || "application/json";
        }

        if (body) {
          requestOptions.headers["content-length"] = Buffer.byteLength(body);
        }

        const req = http.request(requestOptions, (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const rawBody = Buffer.concat(chunks).toString();
            let parsedBody = rawBody;

            const contentType = res.headers["content-type"] || "";
            if (contentType.includes("application/json") && rawBody) {
              try {
                parsedBody = JSON.parse(rawBody);
              } catch (err) {
                return reject(err);
              }
            }

            server.close();
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsedBody,
              text: rawBody,
            });
          });
        });

        req.on("error", (err) => {
          server.close();
          reject(err);
        });

        if (body) {
          req.write(body);
        }

        req.end();
      });
    });
  }
}

module.exports = request;
module.exports.default = request;
module.exports.request = request;
module.exports.agent = request;
