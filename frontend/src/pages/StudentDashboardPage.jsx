import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import FormValidator from "../services/FormValidator";
import apiClient from "../services/apiClient";

function StudentDashboardPage({ authToken, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [courses, setCourses] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    sessionID: "",
    qrToken: "",
    gpsLocation: "",
  });
  const [eligibilityCourseID, setEligibilityCourseID] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    department: "",
    year: "",
  });

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const [profileData, historyData, courseData] = await Promise.all([
          apiClient.getMyStudentProfile(authToken),
          apiClient.getAttendanceHistory(authToken),
          apiClient.getCourses(authToken),
        ]);
        if (!mounted) return;
        setProfile(profileData.profile);
        setHistory(historyData.history || []);
        setCourses(courseData.courses || []);
        setForm({
          firstName: profileData.profile.firstName || "",
          lastName: profileData.profile.lastName || "",
          department: profileData.profile.department || "",
          year: profileData.profile.year ? String(profileData.profile.year) : "",
        });
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [authToken]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateAttendanceField(event) {
    const { name, value } = event.target;
    setAttendanceForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateProfile(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const validationError = FormValidator.validateStudentProfile(form);
      if (validationError) {
        setError(validationError);
        return;
      }

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        department: form.department,
        year: Number(form.year),
      };
      const data = await apiClient.updateMyStudentProfile(payload, authToken);
      setProfile(data.profile);
      setMessage(data.message || "Profile updated successfully");
      setActiveTab("profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAttendance(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const validationError = FormValidator.validateAttendanceMark(attendanceForm);
      if (validationError) {
        setError(validationError);
        return;
      }
      const payload = {
        sessionID: Number(attendanceForm.sessionID),
        qrToken: attendanceForm.qrToken,
        gpsLocation: attendanceForm.gpsLocation || null,
      };
      const data = await apiClient.markAttendance(payload, authToken);
      setMessage(data.message);
      const historyData = await apiClient.getAttendanceHistory(authToken);
      setHistory(historyData.history || []);
      setAttendanceForm({ sessionID: "", qrToken: "", gpsLocation: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckEligibility() {
    if (!eligibilityCourseID) {
      setError("Select a course first");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const data = await apiClient.getMyEligibility(authToken, Number(eligibilityCourseID));
      setEligibility(data.eligibility);
      if (!data.eligibility) {
        setMessage("No eligibility data for this course yet.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell
      title="Student Dashboard"
      subtitle={`Logged in as: ${currentUser.username} (student)`}
      tabs={[
        { id: "profile", label: "Profile" },
        { id: "edit-profile", label: "Edit Profile" },
        { id: "attendance", label: "Attendance" },
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

      {activeTab === "profile" && profile && (
        <div className="legacy-panel">
          <h3>My Profile</h3>
          <p>
            <strong>Student ID:</strong> {profile.studentID}
          </p>
          <p>
            <strong>Name:</strong> {profile.firstName} {profile.lastName}
          </p>
          <p>
            <strong>Department:</strong> {profile.department}
          </p>
          <p>
            <strong>Year:</strong> {profile.year}
          </p>
        </div>
      )}

      {activeTab === "edit-profile" && (
        <div className="legacy-panel">
          <h3>Edit Profile</h3>
          <form className="legacy-form" onSubmit={handleUpdateProfile}>
            <label>
              First Name
              <input name="firstName" value={form.firstName} onChange={updateField} required />
            </label>
            <label>
              Last Name
              <input name="lastName" value={form.lastName} onChange={updateField} required />
            </label>
            <label>
              Department
              <input name="department" value={form.department} onChange={updateField} required />
            </label>
            <label>
              Year
              <input
                name="year"
                type="number"
                min="1"
                max="8"
                value={form.year}
                onChange={updateField}
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="legacy-panel">
          <h3>Mark Attendance</h3>
          <form className="legacy-form" onSubmit={handleMarkAttendance}>
            <label>
              Session ID
              <input
                name="sessionID"
                type="number"
                value={attendanceForm.sessionID}
                onChange={updateAttendanceField}
                required
              />
            </label>
            <label>
              QR Token
              <input name="qrToken" value={attendanceForm.qrToken} onChange={updateAttendanceField} required />
            </label>
            <label>
              GPS Location (optional)
              <input name="gpsLocation" value={attendanceForm.gpsLocation} onChange={updateAttendanceField} />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Mark Attendance"}
            </button>
          </form>

          <h3>Exam Eligibility</h3>
          <label>
            Course
            <select value={eligibilityCourseID} onChange={(event) => setEligibilityCourseID(event.target.value)}>
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.courseID} value={course.courseID}>
                  {course.courseCode} - {course.courseName}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handleCheckEligibility} disabled={loading}>
            Check Eligibility
          </button>
          {eligibility && (
            <p>
              Attendance: {eligibility.attendancePercentage}% (threshold {eligibility.thresholdPercentage}%) -{" "}
              {eligibility.eligible ? "Eligible" : "Not Eligible"}
            </p>
          )}
        </div>
      )}

      {(activeTab === "profile" || activeTab === "attendance") && (
        <div className="legacy-panel">
          <h3>Attendance History Dashboard</h3>
          {history.length === 0 && <p>No attendance records yet.</p>}
          {history.map((item) => (
            <p key={item.attendanceID}>
              [{item.markedAt}] {item.courseCode} / Session {item.sessionID} - {item.status}
            </p>
          ))}
        </div>
      )}

    </DashboardShell>
  );
}

export default StudentDashboardPage;

