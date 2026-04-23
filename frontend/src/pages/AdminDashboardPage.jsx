import { useState } from "react";
import AuthApiService from "../services/AuthApiService";
import FormValidator from "../services/FormValidator";

const authApiService = new AuthApiService();

function AdminDashboardPage({ authToken, currentUser, onLogout }) {
  const [showCreateInstructor, setShowCreateInstructor] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
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

      const data = await authApiService.createInstructor(instructorForm, authToken);
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
      const data = await authApiService.addCourse(payload, authToken);
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

  return (
    <div>
      <h2>Administrator Dashboard</h2>
      <p>Logged in as: {currentUser.username} (admin)</p>

      <div className="legacy-nav">
        <button
          type="button"
          onClick={() => {
            setShowCreateInstructor(true);
            setShowAddCourse(false);
            setMessage("");
            setError("");
          }}
        >
          Create Instructor Account
        </button>
        <button
          type="button"
          onClick={() => {
            setShowAddCourse(true);
            setShowCreateInstructor(false);
            setMessage("");
            setError("");
          }}
        >
          Add Course
        </button>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>

      {showCreateInstructor && (
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

          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {showAddCourse && (
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

          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;

