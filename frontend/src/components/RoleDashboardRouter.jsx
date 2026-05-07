import AdminDashboardPage from "../pages/AdminDashboardPage";
import InstructorDashboardPage from "../pages/InstructorDashboardPage";
import StudentDashboardPage from "../pages/StudentDashboardPage";

function RoleDashboardRouter({ authUser, authToken, onLogout }) {
  if (authUser?.role === "admin") {
    return <AdminDashboardPage authToken={authToken} currentUser={authUser} onLogout={onLogout} />;
  }
  if (authUser?.role === "instructor") {
    return <InstructorDashboardPage authToken={authToken} currentUser={authUser} onLogout={onLogout} />;
  }
  if (authUser?.role === "student") {
    return <StudentDashboardPage authToken={authToken} currentUser={authUser} onLogout={onLogout} />;
  }
  return null;
}

export default RoleDashboardRouter;
