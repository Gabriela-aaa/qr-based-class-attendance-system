const jwt = require("jsonwebtoken");

class AuthMiddleware {
  constructor(jwtSecret) {
    this.jwtSecret = jwtSecret;
    this.requireAuth = this.requireAuth.bind(this);
  }

  requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Missing or invalid authorization token" });
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret);
      req.user = payload;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  }

  requireRole(...allowedRoles) {
    return (req, res, next) => {
      const role = req.user?.role;
      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      return next();
    };
  }
}

const authMiddleware = new AuthMiddleware(process.env.JWT_SECRET || "change_me_in_production");

module.exports = authMiddleware;

