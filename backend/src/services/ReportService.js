class ReportService {
  constructor({ reportRepository, activityLogRepository }) {
    this.reportRepository = reportRepository;
    this.activityLogRepository = activityLogRepository;
  }

  toCsv(rows) {
    if (!rows.length) return "No data\n";
    const headers = Object.keys(rows[0]);
    const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const lines = [
      headers.map(escapeCell).join(","),
      ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")),
    ];
    return `${lines.join("\n")}\n`;
  }

  toSimplePdfBuffer(title, rows) {
    const lines = [title, "", ...rows.map((row) => JSON.stringify(row))];
    const text = lines.join("\n").replaceAll("(", "[").replaceAll(")", "]");
    const stream = `BT /F1 10 Tf 40 780 Td (${text}) Tj ET`;
    const objects = [
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
      "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
      `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((obj) => {
      offsets.push(pdf.length);
      pdf += `${obj}\n`;
    });
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return Buffer.from(pdf, "utf8");
  }

  async getSummary({ userID, role, courseID, sessionID }) {
    let instructorID = null;
    if (role === "instructor") {
      const instructor = await this.reportRepository.findInstructorByUserId(userID);
      if (!instructor) {
        return { statusCode: 404, payload: { message: "Instructor profile not found" } };
      }
      instructorID = instructor.instructorID;
    } else if (role !== "admin") {
      return { statusCode: 403, payload: { message: "Access denied" } };
    }

    const summary = await this.reportRepository.getAttendanceSummary({ courseID, sessionID, instructorID });
    await this.reportRepository.createReportRecord({
      reportType: "attendance_summary",
      generatedBy: `${role}:${userID}`,
      courseID,
      sessionID,
    });
    await this.activityLogRepository.createLog({
      activityType: "report_generated",
      userID,
      metadata: { reportType: "attendance_summary", courseID, sessionID },
    });
    return { statusCode: 200, payload: { summary } };
  }

  async getMyEligibility({ userID, courseID }) {
    const student = await this.reportRepository.findStudentByUserId(userID);
    if (!student) {
      return { statusCode: 404, payload: { message: "Student profile not found" } };
    }

    const rows = await this.reportRepository.getStudentEligibilityByCourse({
      courseID,
      studentID: student.studentID,
    });
    const mapped = rows.map((row) => {
      const percentage = row.totalSessions ? (row.attendedSessions / row.totalSessions) * 100 : 0;
      return {
        ...row,
        attendancePercentage: Number(percentage.toFixed(2)),
        eligible: percentage >= row.thresholdPercentage,
      };
    });
    return { statusCode: 200, payload: { eligibility: mapped[0] || null } };
  }

  async getLogs({ role, limit }) {
    if (role !== "admin") {
      return { statusCode: 403, payload: { message: "Only admin can view activity logs" } };
    }
    const logs = await this.activityLogRepository.listLogs(limit);
    return { statusCode: 200, payload: { logs } };
  }

  async exportSummary({ userID, role, courseID, sessionID, format }) {
    const summaryResult = await this.getSummary({ userID, role, courseID, sessionID });
    if (summaryResult.statusCode !== 200) {
      return summaryResult;
    }
    const rows = summaryResult.payload.summary;

    if (format === "excel") {
      return {
        statusCode: 200,
        payload: {
          contentType: "text/csv",
          filename: "attendance-summary.csv",
          content: this.toCsv(rows),
        },
      };
    }

    if (format === "pdf") {
      return {
        statusCode: 200,
        payload: {
          contentType: "application/pdf",
          filename: "attendance-summary.pdf",
          content: this.toSimplePdfBuffer("Attendance Summary", rows),
        },
      };
    }

    return { statusCode: 400, payload: { message: "Unsupported format. Use pdf or excel" } };
  }
}

module.exports = ReportService;
