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

// school education
app.use("/api/v1/school-courses", require("./router/school/schoolCourseRoute"));
app.use("/api/v1/school-order", require("./router/school/schoolOrderRoute"));

// bid
app.use("/api/v1/assignment", require("./router/bid/assignmentRoute"));
app.use("/api/v1/bid", require("./router/bid/bidRoute"));
app.use("/api/v1/message", require("./router/messagesRoute"));

// orders
app.use("/api/v1/card", require("./router/cardRoute"));
app.use("/api/v1/coupon", require("./router/couponsRoute"));
app.use("/api/v1/order", require("./router/orderRoute"));

module.exports = { app };
