const { validationResult } = require("express-validator");

class UserManagementController {
  constructor(userManagementService) {
    this.userManagementService = userManagementService;
    this.createInstructorAccount = this.createInstructorAccount.bind(this);
  }

  async createInstructorAccount(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    try {
      const result = await this.userManagementService.createInstructorAccount(req.body);
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = UserManagementController;

