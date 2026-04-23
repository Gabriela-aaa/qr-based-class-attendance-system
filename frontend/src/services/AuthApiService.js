class AuthApiService {
  constructor(baseUrl = "http://localhost:5000/api") {
    this.baseUrl = baseUrl;
  }

  async request(path, options = {}) {
    const mergedHeaders = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: mergedHeaders,
    });

    const data = await response.json();
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
}

export default AuthApiService;

