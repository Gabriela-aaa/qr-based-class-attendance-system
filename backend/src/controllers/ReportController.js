class ReportController {
  constructor(reportService) {
    this.reportService = reportService;
    this.getSummary = this.getSummary.bind(this);
    this.getMyEligibility = this.getMyEligibility.bind(this);
    this.getActivityLogs = this.getActivityLogs.bind(this);
    this.exportSummary = this.exportSummary.bind(this);
  }

  async getSummary(req, res, next) {
    try {
      const result = await this.reportService.getSummary({
        userID: req.user.userID,
        role: req.user.role,
        courseID: req.query.courseID ? Number(req.query.courseID) : null,
        sessionID: req.query.sessionID ? Number(req.query.sessionID) : null,
      });
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }

  async getMyEligibility(req, res, next) {
    try {
      const result = await this.reportService.getMyEligibility({
        userID: req.user.userID,
        courseID: Number(req.query.courseID),
      });
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }

  async getActivityLogs(req, res, next) {
    try {
      const result = await this.reportService.getLogs({
        role: req.user.role,
        limit: req.query.limit ? Number(req.query.limit) : 100,
      });
      return res.status(result.statusCode).json(result.payload);
    } catch (error) {
      return next(error);
    }
  }

  async exportSummary(req, res, next) {
    try {
      const result = await this.reportService.exportSummary({
        userID: req.user.userID,
        role: req.user.role,
        courseID: req.query.courseID ? Number(req.query.courseID) : null,
        sessionID: req.query.sessionID ? Number(req.query.sessionID) : null,
        format: req.query.format,
      });
      if (result.statusCode !== 200) {
        return res.status(result.statusCode).json(result.payload);
      }
      res.setHeader("Content-Type", result.payload.contentType);
      res.setHeader("Content-Disposition", `attachment; filename=${result.payload.filename}`);
      return res.status(200).send(result.payload.content);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = ReportController;
