const express = require("express");

const router = express.Router();

// Student: mark attendance, view history (placeholders)
router.post("/mark", (req, res) => {
  res.status(501).json({ message: "Not implemented: mark attendance" });
});

router.get("/history", (req, res) => {
  res.status(501).json({ message: "Not implemented: attendance history" });
});

module.exports = router;

