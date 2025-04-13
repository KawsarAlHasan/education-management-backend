const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(express.json());

const globalCorsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(globalCorsOptions));
app.options("*", cors(globalCorsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use("/public", express.static(path.join(__dirname, "public")));

// auth
app.use("/api/v1/user", require("./router/authRouter/userRoute"));
app.use("/api/v1/forgot", require("./router/authRouter/forgotPassword"));
// app.use("/api/v1/vendor", require("./router/vendors/vendorRoute"));
// app.use(
//   "/api/v1/vendor-employees",
//   require("./router/vendors/vendorsEmployeesRoute")
// );

// Default Route
app.get("/", (req, res) => {
  res.status(200).send("Education Managemant server is working");
});

// 404 Not Found Middleware
app.use("*", (req, res, next) => {
  res.status(404).json({
    error: "You have hit the wrong route",
  });
});

module.exports = { app };
