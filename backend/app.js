// require("dotenv").config();
// const express = require("express");
// const path = require("path");
// // require("dotenv").config();
// const sanitize = require("sanitize");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");

// const app = express();
// const port = process.env.PORT || 8000;
// const router = require("./routes");

// // Middleware
// app.use(cors({ origin: "*", optionsSuccessStatus: 200 }));
// app.use(express.json());
// app.use(cookieParser());
// app.use(sanitize.middleware);

// // API routes
// app.use("/api", router);

// // ✅ Serve Vite static frontend
// app.use(express.static(path.join(__dirname, "dist")));

// // ✅ SPA fallback for React Router
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });

// // Start server
// app.listen(port, () => {
//   console.log(`✅ Server running on port: ${port}`);
// });

// module.exports = app;


require("dotenv").config();

const express = require("express");

// const path = require("path"); // No longer needed if not serving static files

const sanitize = require("sanitize");

const cookieParser = require("cookie-parser");

const cors = require("cors");

const app = express();

const port = process.env.PORT || 8000;

const router = require("./routes");

// Middleware

// IMPORTANT: For CORS, if frontend and backend are on different subdomains/ports,

// you MUST specify the frontend's exact URL for 'origin' in production,

// e.g., origin: "https://yourfrontenddomain.com"

// For development, '*' might be okay, but not for production.

// CORS configuration to support custom headers and preflight
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-access-token",
      "x-accesstoken",
      "x-access_token",
    ],
    optionsSuccessStatus: 204,
  })
);
app.options("*", cors());

app.use(express.json());

app.use(cookieParser());

app.use(sanitize.middleware);

// API routes

app.use("/api", router);

// ⭐⭐⭐ REMOVE THESE LINES ⭐⭐⭐

// app.use(express.static(path.join(__dirname, "dist")));

// app.get("*", (req, res) => {

//   res.sendFile(path.join(__dirname, "dist", "index.html"));

// });

// ⭐⭐⭐ END REMOVAL ⭐⭐⭐

// Start server

app.listen(port, () => {
  console.log(`✅ Server running on port: ${port}`);
});

module.exports = app;