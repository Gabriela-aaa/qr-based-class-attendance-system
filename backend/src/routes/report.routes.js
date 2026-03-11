const express = require("express");

const router = express.Router();

// Instructor/Admin: generate/export reports (placeholders)
router.get("/", (req, res) => {
  res.status(501).json({ message: "Not implemented: generate reports" });
});

module.exports = router;

