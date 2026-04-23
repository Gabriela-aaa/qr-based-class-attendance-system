import { useState } from "react";
import AuthApiService from "../services/AuthApiService";
import FormValidator from "../services/FormValidator";

const authApiService = new AuthApiService();

function RegisterPage({ onSwitchLogin }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    studentID: "",
    firstName: "",
    lastName: "",
    department: "",
    year: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const validationError = FormValidator.validateRegister(form);
      if (validationError) {
        setError(validationError);
        return;
      }

      const payload = { ...form, year: Number(form.year) };
      const data = await authApiService.registerStudent(payload);
      setMessage(data.message || "Registration successful");
      setForm({
        username: "",
        password: "",
        studentID: "",
        firstName: "",
        lastName: "",
        department: "",
        year: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Student Registration</h2>
      <form className="legacy-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input name="username" value={form.username} onChange={updateField} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} required />
        </label>
        <label>
          Student ID
          <input name="studentID" value={form.studentID} onChange={updateField} required />
        </label>
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
          <input name="year" type="number" min="1" max="8" value={form.year} onChange={updateField} required />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Register Student"}
        </button>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <p className="legacy-link">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchLogin}>
          Go to Login
        </button>
      </p>
    </div>
  );
}

export default RegisterPage;

