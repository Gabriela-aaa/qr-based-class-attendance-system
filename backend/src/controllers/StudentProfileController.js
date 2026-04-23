const { validationResult } = require("express-validator");

class StudentProfileController {
  constructor(studentProfileService) {
    this.studentProfileService = studentProfileService;
    this.getMyProfile = this.getMyProfile.bind(this);
    this.updateMyProfile = this.updateMyProfile.bind(this);
  }

  async getMyProfile(req, res, next) {
    try {
      const result = await this.studentProfileService.getMyProfile(req.user.userID);
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }

  async updateMyProfile(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    try {
      const result = await this.studentProfileService.updateMyProfile({
        userID: req.user.userID,
        ...req.body,
      });
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = StudentProfileController;

