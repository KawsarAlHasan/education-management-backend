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

// education
app.use("/api/v1/courses", require("./router/educationRouter/coursesRoute"));
app.use(
  "/api/v1/courses-topic",
  require("./router/educationRouter/courseTopicRoute")
);
app.use(
  "/api/v1/courses-deatials",
  require("./router/educationRouter/courseDetailsRoute")
);

module.exports = { app };
