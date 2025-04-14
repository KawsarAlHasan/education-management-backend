const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const { app } = require("./app");
const mySqlPool = require("./config/db");
dotenv.config();

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

mySqlPool
  .query("SELECT 1")
  .then(() => {
    console.log("MYSQL DB Connected");
  })
  .catch((error) => {
    console.log(error);
  });

// Server Start
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Education Management server is running on port ${port}`);
});

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
