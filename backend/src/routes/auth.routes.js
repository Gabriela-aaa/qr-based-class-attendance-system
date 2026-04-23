const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post(
  "/register/student",
  [
    body("username").trim().isLength({ min: 3, max: 100 }),
    body("password").isLength({ min: 6 }),
    body("studentID").trim().notEmpty(),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    body("department").trim().notEmpty(),
    body("year").isInt({ min: 1, max: 8 }),
  ],
  authController.registerStudent
);

router.post(
  "/login",
  [body("username").trim().notEmpty(), body("password").notEmpty()],
  authController.login
);

router.post("/logout", authController.logout);

module.exports = router;

