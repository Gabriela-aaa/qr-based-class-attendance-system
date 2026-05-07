import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RoleDashboardRouter from "./components/RoleDashboardRouter";

function App() {
  const [screen, setScreen] = useState("login");
  const [authUser, setAuthUser] = useState(() => {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  });
  const [authToken, setAuthToken] = useState(() =>
    localStorage.getItem("authToken"),
  );

  function handleLoginSuccess(user, token) {
    setAuthUser(user);
    setAuthToken(token);
  }

  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    setAuthUser(null);
    setAuthToken(null);
    setScreen("login");
  }

  return (
    <div className="legacy-page">
      <div className="legacy-header">
        <h1>Advanced Attendance System</h1>
        <p>Web Attendance Portal</p>
      </div>

      {!authUser && (
        <div className="legacy-nav">
          <button
            type="button"
            className={screen === "login" ? "active" : ""}
            onClick={() => setScreen("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={screen === "register" ? "active" : ""}
            onClick={() => setScreen("register")}
          >
            Student Register
          </button>
        </div>
      )}

      <div className="legacy-panel">
        {authUser ? (
          <RoleDashboardRouter authUser={authUser} authToken={authToken} onLogout={handleLogout} />
        ) : screen === "login" ? (
          <LoginPage
            onSwitchRegister={() => setScreen("register")}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <RegisterPage onSwitchLogin={() => setScreen("login")} />
        )}
      </div>
    </div>
  );
}

export default App;
