/**
 * End-to-end API verification (run while backend is up: npm run dev)
 * Usage: npm run test:e2e
 */
require("../config/loadEnv").loadBackendEnv();

const http = require("http");

const BASE = process.env.E2E_API_BASE || "http://127.0.0.1:5000/api";
const ADMIN_USER = process.env.ADMIN_SEED_USERNAME || "sys_admin";
const ADMIN_PASS = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";

const log = {
  steps: [],
  failures: [],
};

function request(method, path, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith("http") ? path : `${BASE}${path}`);
    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (token) opts.headers.Authorization = `Bearer ${token}`;
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let json = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          json = { _raw: raw };
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json, raw });
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function dbCheck(label, sql, params = []) {
  try {
    const { pool } = require("../config/database");
    const [rows] = await pool.execute(sql, params);
    log.steps.push({
      phase: "DB",
      label,
      ok: true,
      rowCount: Array.isArray(rows) ? rows.length : 0,
      sample: Array.isArray(rows) && rows[0] ? rows[0] : null,
    });
    return rows;
  } catch (e) {
    log.steps.push({
      phase: "DB",
      label,
      ok: false,
      error: e.message,
    });
    return null;
  }
}

async function main() {
  const suffix = Date.now();
  const studentUsername = `e2e_stu_${suffix}`;
  const studentId = `E2E${suffix}`.slice(0, 12);
  const instUsername = `e2e_inst_${suffix}`;

  console.log("=== E2E API Flow ===\nBase:", BASE, "\n");

  let h;
  try {
    h = await request("GET", "/health");
  } catch (e) {
    console.error("FATAL: Cannot reach backend. Is it running on port 5000?\n", e.message);
    process.exit(1);
  }
  log.steps.push({
    step: 0,
    name: "GET /api/health",
    request: { method: "GET", url: `${BASE}/health` },
    response: { status: h.status, body: h.body },
  });
  if (h.status !== 200) {
    log.failures.push("Health check failed");
  }

  const regBody = {
    username: studentUsername,
    password: "e2epass123",
    studentID: studentId,
    firstName: "E2E",
    lastName: "Student",
    department: "CS",
    year: 2,
  };
  let reg = await request("POST", "/auth/register/student", { body: regBody });
  log.steps.push({
    step: 1,
    name: "Register student",
    request: { method: "POST", url: `${BASE}/auth/register/student`, body: regBody },
    response: { status: reg.status, body: reg.body },
  });
  if (reg.status !== 201) {
    log.failures.push(`Register student: HTTP ${reg.status}`);
  }

  await dbCheck("students row after register", "SELECT student_id, first_name FROM students WHERE student_id = ?", [
    studentId,
  ]);

  let stLogin = await request("POST", "/auth/login", {
    body: { username: studentUsername, password: "e2epass123" },
  });
  const tokenStudent = stLogin.body?.token;
  log.steps.push({
    step: 1,
    name: "Login student",
    request: {
      method: "POST",
      url: `${BASE}/auth/login`,
      body: { username: studentUsername, password: "***" },
    },
    response: { status: stLogin.status, body: { ...stLogin.body, token: tokenStudent ? "(JWT present)" : null } },
  });
  if (stLogin.status !== 200 || !tokenStudent) {
    log.failures.push(`Login student: HTTP ${stLogin.status} or missing token`);
  }

  let adLogin = await request("POST", "/auth/login", {
    body: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  const tokenAdmin = adLogin.body?.token;
  log.steps.push({
    step: 1,
    name: "Login admin",
    request: { method: "POST", url: `${BASE}/auth/login`, body: { username: ADMIN_USER, password: "***" } },
    response: { status: adLogin.status, body: { ...adLogin.body, token: tokenAdmin ? "(JWT present)" : null } },
  });
  if (adLogin.status !== 200 || !tokenAdmin) {
    log.failures.push(
      `Login admin: HTTP ${adLogin.status}. Run: npm run db:seed:admin (after npm run db:init).`
    );
  }

  if (!tokenAdmin) {
    console.log("\n--- STOPPING: Admin token required for instructor + course flows ---\n");
    printReport();
    process.exit(1);
  }

  const instBody = {
    username: instUsername,
    password: "e2epass123",
    firstName: "E2E",
    lastName: "Instructor",
    department: "CS",
  };
  let inst = await request("POST", "/users/instructors", { body: instBody, token: tokenAdmin });
  log.steps.push({
    step: 2,
    name: "Admin create instructor",
    request: { method: "POST", url: `${BASE}/users/instructors`, body: instBody },
    response: { status: inst.status, body: inst.body },
  });
  if (inst.status !== 201) {
    log.failures.push(`Create instructor: HTTP ${inst.status}`);
  }

  await dbCheck("instructors row", "SELECT instructor_id, first_name FROM instructors WHERE user_id = (SELECT user_id FROM users WHERE username = ?)", [
    instUsername,
  ]);

  let insLogin = await request("POST", "/auth/login", {
    body: { username: instUsername, password: "e2epass123" },
  });
  const tokenInstructor = insLogin.body?.token;
  log.steps.push({
    step: 2,
    name: "Login instructor",
    request: { method: "POST", url: `${BASE}/auth/login`, body: { username: instUsername, password: "***" } },
    response: { status: insLogin.status, body: { ...insLogin.body, token: tokenInstructor ? "(JWT present)" : null } },
  });
  if (insLogin.status !== 200 || !tokenInstructor) {
    log.failures.push(`Login instructor: HTTP ${insLogin.status}`);
  }

  const courseCode = `E2E${suffix}`.slice(0, 8);
  const courseBody = {
    courseCode,
    courseName: "E2E Web Course",
    department: "CS",
    creditHour: 3,
  };
  let courseRes = await request("POST", "/courses", { body: courseBody, token: tokenAdmin });
  const courseID = courseRes.body?.course?.courseID;
  log.steps.push({
    step: 3,
    name: "Admin create course",
    request: { method: "POST", url: `${BASE}/courses`, body: courseBody },
    response: { status: courseRes.status, body: courseRes.body },
  });
  if (courseRes.status !== 201 || !courseID) {
    log.failures.push(`Create course: HTTP ${courseRes.status}`);
  }

  await dbCheck("courses row", "SELECT course_id, course_code FROM courses WHERE course_code = ?", [courseCode]);

  if (!tokenInstructor || !courseID) {
    console.log("\n--- STOPPING: Need instructor token + courseID ---\n");
    printReport();
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const sessBody = {
    courseID,
    sessionDate: today,
    startTime: "09:00",
    gpsLocation: null,
  };
  let sess = await request("POST", "/sessions", { body: sessBody, token: tokenInstructor });
  const sessionID = sess.body?.session?.sessionID;
  const qrToken = sess.body?.session?.qrToken;
  const qrImage = sess.body?.session?.qrImage;
  log.steps.push({
    step: 4,
    name: "Instructor create session",
    request: { method: "POST", url: `${BASE}/sessions`, body: sessBody },
    response: {
      status: sess.status,
      body: {
        ...sess.body,
        session: sess.body?.session
          ? {
              ...sess.body.session,
              qrToken: qrToken ? `${qrToken.slice(0, 20)}...` : null,
              qrImage: qrImage ? "(base64 image data URL present)" : null,
            }
          : undefined,
      },
    },
  });
  if (sess.status !== 201 || !sessionID || !qrToken) {
    log.failures.push(`Create session: HTTP ${sess.status}`);
  }

  await dbCheck("class_sessions row", "SELECT session_id, status, qr_code IS NOT NULL AS has_qr_hash FROM class_sessions WHERE session_id = ?", [
    sessionID,
  ]);

  if (!tokenStudent || !sessionID || !qrToken) {
    printReport();
    process.exit(1);
  }

  const markBody = {
    sessionID,
    qrToken,
    gpsLocation: null,
  };
  let mark = await request("POST", "/attendance/mark", { body: markBody, token: tokenStudent });
  log.steps.push({
    step: 5,
    name: "Student mark attendance",
    request: { method: "POST", url: `${BASE}/attendance/mark`, body: { ...markBody, qrToken: "(full token sent)" } },
    response: { status: mark.status, body: mark.body },
  });
  if (mark.status !== 201) {
    log.failures.push(`Mark attendance: HTTP ${mark.status} — ${JSON.stringify(mark.body)}`);
  }

  await dbCheck("attendance row", "SELECT attendance_id, student_id, session_id FROM attendance WHERE student_id = ? AND session_id = ?", [
    studentId,
    sessionID,
  ]);

  let histStu = await request("GET", "/attendance/history", { token: tokenStudent });
  log.steps.push({
    step: 6,
    name: "Student attendance history",
    request: { method: "GET", url: `${BASE}/attendance/history` },
    response: { status: histStu.status, body: histStu.body },
  });
  if (histStu.status !== 200) {
    log.failures.push(`Student history: HTTP ${histStu.status}`);
  }

  let histInst = await request("GET", "/attendance/history", { token: tokenInstructor });
  log.steps.push({
    step: 6,
    name: "Instructor attendance history",
    request: { method: "GET", url: `${BASE}/attendance/history` },
    response: { status: histInst.status, body: histInst.body },
  });
  if (histInst.status !== 200) {
    log.failures.push(`Instructor history: HTTP ${histInst.status}`);
  }

  let repAdmin = await request("GET", `/reports?courseID=${courseID}`, { token: tokenAdmin });
  log.steps.push({
    step: 6,
    name: "Admin report summary",
    request: { method: "GET", url: `${BASE}/reports?courseID=${courseID}` },
    response: { status: repAdmin.status, body: repAdmin.body },
  });
  if (repAdmin.status !== 200) {
    log.failures.push(`Admin report: HTTP ${repAdmin.status}`);
  }

  let repInst = await request("GET", `/reports?courseID=${courseID}`, { token: tokenInstructor });
  log.steps.push({
    step: 6,
    name: "Instructor report summary",
    request: { method: "GET", url: `${BASE}/reports?courseID=${courseID}` },
    response: { status: repInst.status, body: repInst.body },
  });
  if (repInst.status !== 200) {
    log.failures.push(`Instructor report: HTTP ${repInst.status}`);
  }

  printReport();
}

function printReport() {
  console.log("\n========== REQUEST / RESPONSE LOG ==========\n");
  for (const s of log.steps) {
    if (s.step != null) {
      console.log(`--- ${s.step}. ${s.name} ---`);
      console.log("Request:", JSON.stringify(s.request, null, 2));
      console.log("Response:", JSON.stringify(s.response, null, 2));
      console.log("");
    } else if (s.phase === "DB") {
      console.log(`--- DB: ${s.label} ---`, s.ok ? JSON.stringify(s, null, 2) : s.error);
      console.log("");
    }
  }
  console.log("\n========== SUMMARY ==========");
  if (log.failures.length === 0) {
    console.log("All API steps in this script completed with expected HTTP success codes.");
  } else {
    console.log("Failures / warnings:");
    log.failures.forEach((f) => console.log(" -", f));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
