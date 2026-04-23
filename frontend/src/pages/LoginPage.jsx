import { useState } from "react";
import AuthApiService from "../services/AuthApiService";
import FormValidator from "../services/FormValidator";

const authApiService = new AuthApiService();

function LoginPage({ onSwitchRegister, onLoginSuccess }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
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
      const validationError = FormValidator.validateLogin(form);
      if (validationError) {
        setError(validationError);
        return;
      }

      const data = await authApiService.login(form);
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));
      setMessage(`Login successful. Welcome, ${data.user.username} (${data.user.role}).`);
      if (onLoginSuccess) {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>System Login</h2>
      <form className="legacy-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input name="username" value={form.username} onChange={updateField} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} required />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <p className="legacy-link">
        New student?{" "}
        <button type="button" onClick={onSwitchRegister}>
          Register here
        </button>
      </p>
    </div>
  );
}

export default LoginPage;

