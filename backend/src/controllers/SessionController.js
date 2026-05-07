const { validationResult } = require("express-validator");

class SessionController {
  constructor(sessionService) {
    this.sessionService = sessionService;
    this.createSession = this.createSession.bind(this);
    this.closeSession = this.closeSession.bind(this);
    this.listMySessions = this.listMySessions.bind(this);
  }

  buildRequestContext(req) {
    return {
      ip: req.ip,
      userAgent: req.get("user-agent") || null,
    };
  }

  async createSession(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    try {
      const result = await this.sessionService.createSession({
        userID: req.user.userID,
        ...req.body,
        requestContext: this.buildRequestContext(req),
      });
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }

  async closeSession(req, res, next) {
    try {
      const result = await this.sessionService.closeSession({
        userID: req.user.userID,
        sessionID: Number(req.params.sessionId),
        requestContext: this.buildRequestContext(req),
      });
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }

  async listMySessions(req, res, next) {
    try {
      const result = await this.sessionService.listMySessions(req.user.userID);
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = SessionController;
