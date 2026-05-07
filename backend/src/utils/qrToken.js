const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const QR_TOKEN_SECRET = process.env.QR_TOKEN_SECRET || process.env.JWT_SECRET || "change_me_in_production";
const QR_TOKEN_EXPIRES_IN = process.env.QR_TOKEN_EXPIRES_IN || "30m";

function hashQrToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function timingSafeHashEqual(leftHex, rightHex) {
  if (!leftHex || !rightHex) return false;
  if (leftHex.length !== rightHex.length) return false;
  const left = Buffer.from(leftHex, "hex");
  const right = Buffer.from(rightHex, "hex");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function createQrToken({ sessionID, courseID, instructorID }) {
  return jwt.sign(
    {
      typ: "attendance_qr",
      sid: Number(sessionID),
      cid: Number(courseID),
      iid: String(instructorID),
      nonce: crypto.randomBytes(16).toString("hex"),
    },
    QR_TOKEN_SECRET,
    { expiresIn: QR_TOKEN_EXPIRES_IN }
  );
}

function verifyQrToken(token) {
  return jwt.verify(token, QR_TOKEN_SECRET);
}

module.exports = {
  createQrToken,
  verifyQrToken,
  hashQrToken,
  timingSafeHashEqual,
};
