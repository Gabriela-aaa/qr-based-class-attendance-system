const express = require("express");

const router = express.Router();

// Placeholder endpoints (to be implemented from doc use cases)
router.post("/register", (req, res) => {
  res.status(501).json({ message: "Not implemented: register" });
});

router.post("/login", (req, res) => {
  res.status(501).json({ message: "Not implemented: login" });
});

router.post("/logout", (req, res) => {
  res.status(501).json({ message: "Not implemented: logout" });
});

module.exports = router;

