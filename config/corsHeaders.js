import { allowedOrigins } from "./allowedOrigins.js";

function setCorsHeaders(req, res, next) {
  const or = req.headers.origin;

  if (allowedOrigins.indexOf(or) !== -1 || !or) {
    res.setHeader("Access-Control-Allow-Origin", `${or}`);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    next();
  }
}

export default setCorsHeaders;
