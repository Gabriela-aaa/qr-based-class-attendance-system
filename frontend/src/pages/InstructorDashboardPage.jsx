import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import FormValidator from "../services/FormValidator";
import apiClient from "../services/apiClient";

function InstructorDashboardPage({ authToken, currentUser, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [activeTab, setActiveTab] = useState("session");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newSession, setNewSession] = useState({
    courseID: "",
    sessionDate: "",
    startTime: "",
    gpsLocation: "",
  });
  const [latestQr, setLatestQr] = useState(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [coursesData, sessionsData] = await Promise.all([
        apiClient.getCourses(authToken),
        apiClient.getMySessions(authToken),
      ]);
      setCourses(coursesData.courses || []);
      setSessions(sessionsData.sessions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [authToken]);

  function updateSessionField(event) {
    const { name, value } = event.target;
    setNewSession((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateSession(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const validationError = FormValidator.validateSessionCreate(newSession);
      if (validationError) {
        setError(validationError);
        return;
      }
      const payload = {
        courseID: Number(newSession.courseID),
        sessionDate: newSession.sessionDate,
        startTime: newSession.startTime,
        gpsLocation: newSession.gpsLocation || null,
      };
      const data = await apiClient.createSession(payload, authToken);
      setMessage(`${data.message}. Session ID: ${data.session.sessionID}`);
      setLatestQr(data.session);
      setNewSession({ courseID: "", sessionDate: "", startTime: "", gpsLocation: "" });
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseSession(sessionID) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await apiClient.closeSession(sessionID, authToken);
      setMessage(data.message);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadReport() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await apiClient.getReportSummary(authToken);
      setReportRows(data.summary || []);
      setMessage("Report loaded successfully");
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell
      title="Instructor Dashboard"
      subtitle={`Logged in as: ${currentUser.username} (instructor)`}
      tabs={[
        { id: "session", label: "Sessions" },
        { id: "report", label: "Reports" },
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
      {activeTab === "session" && (
        <div className="legacy-panel">
          <h3>Create Session</h3>
          <form className="legacy-form" onSubmit={handleCreateSession}>
            <label>
              Course
              <select name="courseID" value={newSession.courseID} onChange={updateSessionField} required>
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.courseID} value={course.courseID}>
                    {course.courseCode} - {course.courseName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" name="sessionDate" value={newSession.sessionDate} onChange={updateSessionField} required />
            </label>
            <label>
              Start Time
              <input type="time" name="startTime" value={newSession.startTime} onChange={updateSessionField} required />
            </label>
            <label>
              GPS Location (optional)
              <input name="gpsLocation" value={newSession.gpsLocation} onChange={updateSessionField} />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create Session"}
            </button>
          </form>

          {latestQr && (
            <div className="legacy-panel">
              <p>
                <strong>Session ID:</strong> {latestQr.sessionID}
              </p>
              <p>
                <strong>QR Token:</strong> {latestQr.qrToken}
              </p>
              <img src={latestQr.qrImage} alt="Session QR" style={{ maxWidth: "220px" }} />
            </div>
          )}

          <h3>My Sessions</h3>
          {sessions.map((session) => (
            <div key={session.sessionID} className="legacy-panel">
              <p>
                <strong>Session #{session.sessionID}</strong> - {session.courseCode} ({session.sessionDate})
              </p>
              <p>Status: {session.status}</p>
              {session.status === "open" && (
                <button type="button" onClick={() => handleCloseSession(session.sessionID)} disabled={loading}>
                  Close Session
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "report" && (
        <div className="legacy-panel">
          <h3>Attendance Reports</h3>
          <button type="button" onClick={handleLoadReport} disabled={loading}>
            Load Summary
          </button>
          <button type="button" onClick={() => handleExport("pdf")} disabled={loading}>
            Export PDF
          </button>
          <button type="button" onClick={() => handleExport("excel")} disabled={loading}>
            Export Excel
          </button>
          {reportRows.map((row, index) => (
            <p key={`${row.sessionID}-${index}`}>
              {row.courseCode} - Session {row.sessionID}: {row.presentCount} present
            </p>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

export default InstructorDashboardPage;
