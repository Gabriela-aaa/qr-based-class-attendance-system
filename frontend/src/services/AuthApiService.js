class AuthApiService {
  constructor(baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api") {
    this.baseUrl = baseUrl;
  }

  async request(path, options = {}) {
    const mergedHeaders = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: mergedHeaders,
      });
    } catch (error) {
      throw new Error(
        "Failed to reach backend API. Confirm backend is running and VITE_API_BASE_URL is correct."
      );
    }

    let data = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const rawText = await response.text();
      data = { message: rawText || "Request failed" };
    }
    if (!response.ok) {
      const validationDetails = Array.isArray(data.errors)
        ? data.errors.map((item) => item.msg || item.path).join(", ")
        : "";
      const errorMessage = validationDetails
        ? `${data.message || "Request failed"}: ${validationDetails}`
        : data.message || "Request failed";
      throw new Error(errorMessage);
    }
    return data;
  }

  registerStudent(payload) {
    return this.request("/auth/register/student", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  login(payload) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  createInstructor(payload, token) {
    return this.request("/users/instructors", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  addCourse(payload, token) {
    return this.request("/courses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  getMyStudentProfile(token) {
    return this.request("/users/me/student-profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  updateMyStudentProfile(payload, token) {
    return this.request("/users/me/student-profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  getCourses(token) {
    return this.request("/courses", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  createSession(payload, token) {
    return this.request("/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  closeSession(sessionID, token) {
    return this.request(`/sessions/${sessionID}/close`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getMySessions(token) {
    return this.request("/sessions/my", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  markAttendance(payload, token) {
    return this.request("/attendance/mark", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  getAttendanceHistory(token) {
    return this.request("/attendance/history", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getReportSummary(token, query = "") {
    return this.request(`/reports${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getMyEligibility(token, courseID) {
    return this.request(`/reports/eligibility/my?courseID=${courseID}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  getActivityLogs(token, limit = 100) {
    return this.request(`/reports/activity-logs?limit=${limit}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async exportReport(token, format, query = "") {
    let response;
    try {
      response = await fetch(`${this.baseUrl}/reports/export?format=${format}${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      throw new Error("Failed to reach backend API for export.");
    }
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Export failed");
    }
    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition") || "";
    const filenameMatch = contentDisposition.match(/filename=([^;]+)/i);
    const filename = filenameMatch ? filenameMatch[1] : `attendance-summary.${format === "pdf" ? "pdf" : "csv"}`;
    return { blob, filename };
  }
}

export default AuthApiService;

