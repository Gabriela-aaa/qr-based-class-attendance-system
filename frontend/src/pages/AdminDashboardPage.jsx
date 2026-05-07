import { useState } from "react";
import DashboardShell from "../components/DashboardShell";
import FormValidator from "../services/FormValidator";
import apiClient from "../services/apiClient";

function AdminDashboardPage({ authToken, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState("instructor");
  const [logs, setLogs] = useState([]);
  const [instructorForm, setInstructorForm] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    department: "",
  });
  const [courseForm, setCourseForm] = useState({
    courseCode: "",
    courseName: "",
    department: "",
    creditHour: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateInstructorField(event) {
    const { name, value } = event.target;
    setInstructorForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateCourseField(event) {
    const { name, value } = event.target;
    setCourseForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateInstructor(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const validationError = FormValidator.validateInstructorCreate(instructorForm);
      if (validationError) {
        setError(validationError);
        return;
      }

      const data = await apiClient.createInstructor(instructorForm, authToken);
      setMessage(
        `${data.message}. Assigned Instructor ID: ${data.instructor.instructorID}`
      );
      setInstructorForm({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        department: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCourse(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const validationError = FormValidator.validateCourseCreate(courseForm);
      if (validationError) {
        setError(validationError);
        return;
      }

      const payload = { ...courseForm, creditHour: Number(courseForm.creditHour) };
      const data = await apiClient.addCourse(payload, authToken);
      setMessage(
        `${data.message}. Course ID: ${data.course.courseID}, Code: ${data.course.courseCode}`
      );
      setCourseForm({
        courseCode: "",
        courseName: "",
        department: "",
        creditHour: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadLogs() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const data = await apiClient.getActivityLogs(authToken, 100);
      setLogs(data.logs || []);
      setMessage("Activity logs loaded");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format) {
    setLoading(true);
    setError("");
    try {
      const { blob, filename } = await apiClient.exportReport(authToken, format);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(url);
      setMessage(`Export complete: ${filename}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell
      title="Administrator Dashboard"
      subtitle={`Logged in as: ${currentUser.username} (admin)`}
      tabs={[
        { id: "instructor", label: "Create Instructor Account" },
        { id: "course", label: "Add Course" },
        { id: "reports", label: "Activity Logs / Reports" },
      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => {
        setActiveTab(tabId);
        setMessage("");
        setError("");
      }}
      onLogout={onLogout}
      message={message}
      error={error}
    >
      {activeTab === "instructor" && (
        <div className="legacy-panel">
          <h3>Create Instructor Account</h3>
          <form className="legacy-form" onSubmit={handleCreateInstructor}>
            <label>
              Username
              <input name="username" value={instructorForm.username} onChange={updateInstructorField} required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={instructorForm.password} onChange={updateInstructorField} required />
            </label>
            <label>
              First Name
              <input name="firstName" value={instructorForm.firstName} onChange={updateInstructorField} required />
            </label>
            <label>
              Last Name
              <input name="lastName" value={instructorForm.lastName} onChange={updateInstructorField} required />
            </label>
            <label>
              Department
              <input name="department" value={instructorForm.department} onChange={updateInstructorField} required />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Instructor"}
            </button>
          </form>

        </div>
      )}

      {activeTab === "course" && (
        <div className="legacy-panel">
          <h3>Add Course</h3>
          <form className="legacy-form" onSubmit={handleAddCourse}>
            <label>
              Course Code
              <input name="courseCode" value={courseForm.courseCode} onChange={updateCourseField} required />
            </label>
            <label>
              Course Name
              <input name="courseName" value={courseForm.courseName} onChange={updateCourseField} required />
            </label>
            <label>
              Department
              <input name="department" value={courseForm.department} onChange={updateCourseField} required />
            </label>
            <label>
              Credit Hour
              <input
                name="creditHour"
                type="number"
                min="1"
                max="12"
                value={courseForm.creditHour}
                onChange={updateCourseField}
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Course"}
            </button>
          </form>

        </div>
      )}

      {activeTab === "reports" && (
        <div className="legacy-panel">
          <h3>Reports and Activity Logs</h3>
          <button type="button" onClick={handleLoadLogs} disabled={loading}>
            Load Activity Logs
          </button>
          <button type="button" onClick={() => handleExport("pdf")} disabled={loading}>
            Export PDF
          </button>
          <button type="button" onClick={() => handleExport("excel")} disabled={loading}>
            Export Excel
          </button>
          {logs.map((log) => (
            <p key={log.logID}>
              [{log.timestamp}] {log.activityType} by {log.username || "system"}
            </p>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

export default AdminDashboardPage;

