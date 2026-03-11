const express = require("express");

const router = express.Router();

// Admin: manage user accounts, view activity logs (placeholders)
router.get("/", (req, res) => {
  res.status(501).json({ message: "Not implemented: list users" });
});

module.exports = router;

