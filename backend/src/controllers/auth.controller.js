const { validationResult } = require("express-validator");
const { pool } = require("../config/database");
const AuthRepository = require("../repositories/AuthRepository");
const AuthService = require("../services/AuthService");

class AuthController {
  constructor(authService) {
    this.authService = authService;
    this.registerStudent = this.registerStudent.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
  }

  async registerStudent(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    try {
      const result = await this.authService.registerStudent(req.body);
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }

  async login(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    try {
      const result = await this.authService.login(req.body);
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }

  logout(req, res) {
    res.status(200).json({ message: "Logout successful" });
  }
}

const authRepository = new AuthRepository(pool);
const authService = new AuthService({
  pool,
  authRepository,
  jwtSecret: process.env.JWT_SECRET || "change_me_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
});
const authController = new AuthController(authService);

module.exports = authController;

