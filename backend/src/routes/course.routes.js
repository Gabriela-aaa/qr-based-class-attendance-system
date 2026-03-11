const express = require("express");

const router = express.Router();

// Admin: add course (placeholder)
router.post("/", (req, res) => {
  res.status(501).json({ message: "Not implemented: add course" });
});

module.exports = router;

