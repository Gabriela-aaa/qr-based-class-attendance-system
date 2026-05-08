const express = require("express");
const cors = require("cors");
const { loadBackendEnv } = require("./config/loadEnv");

loadBackendEnv();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const courseRoutes = require("./routes/course.routes");
const sessionRoutes = require("./routes/session.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const reportRoutes = require("./routes/report.routes");
const { notFound, errorHandler } = require("./middleware/error.middleware");
const { getDbState } = require("./config/database");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  const db = getDbState();
  res.status(200).json({
    status: db.connected ? "ok" : "unknown",
    service: "advanced-attendance-backend",
    db,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

