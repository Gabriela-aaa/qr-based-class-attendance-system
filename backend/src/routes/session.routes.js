const express = require("express");

const router = express.Router();

// Instructor: create/close class session (placeholders)
router.post("/", (req, res) => {
  res.status(501).json({ message: "Not implemented: create class session" });
});

router.post("/:sessionId/close", (req, res) => {
  res.status(501).json({ message: "Not implemented: close class session" });
});

module.exports = router;

