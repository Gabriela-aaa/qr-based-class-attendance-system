import { useEffect, useState } from "react";
import AuthApiService from "../services/AuthApiService";
import FormValidator from "../services/FormValidator";

const authApiService = new AuthApiService();

function StudentDashboardPage({ authToken, currentUser, onLogout }) {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
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
        const data = await authApiService.getMyStudentProfile(authToken);
        if (!mounted) return;
        setProfile(data.profile);
        setForm({
          firstName: data.profile.firstName || "",
          lastName: data.profile.lastName || "",
          department: data.profile.department || "",
          year: data.profile.year ? String(data.profile.year) : "",
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
      const data = await authApiService.updateMyStudentProfile(payload, authToken);
      setProfile(data.profile);
      setMessage(data.message || "Profile updated successfully");
      setShowEditProfile(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Student Dashboard</h2>
      <p>Logged in as: {currentUser.username} (student)</p>

      <div className="legacy-nav">
        <button
          type="button"
          onClick={() => {
            setShowEditProfile(true);
            setMessage("");
            setError("");
          }}
        >
          Edit Profile
        </button>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>

      {profile && (
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

      {showEditProfile && (
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

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default StudentDashboardPage;

