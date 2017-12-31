var express = require("express");
var url = require("url");
var fs = require("fs");
var app = express();
app
  .use((req, res, next) => {
    var path;
    if (req.url === "/") {
      path = __dirname + "/index.html";
    } else {
      path = __dirname + "/" + url.parse(req.url).pathname;
    }
    fs.readFile(path, function(err) {
      if (err) {
        fs.readFile(__dirname + "/index.html", function(err, content) {
          res.end(content);
        });
      } else {
        return next();
      }
    });
  })
  .use("/", express.static(__dirname))
  .listen(3000);
