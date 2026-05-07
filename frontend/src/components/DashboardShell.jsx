function DashboardShell({
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  onLogout,
  message,
  error,
  children,
}) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{subtitle}</p>

      <div className="legacy-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>

      {children}

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default DashboardShell;
