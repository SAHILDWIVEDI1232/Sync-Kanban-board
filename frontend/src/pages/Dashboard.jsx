
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, CheckSquare,
  Plus, Settings, Bell, Search, LogOut, X
} from "lucide-react";

import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await api.get("/organizations");
      setOrganizations(res.data.organizations || res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const createOrganization = async (e) => {
    e.preventDefault();

    try {
      await api.post("/organizations", {
        name: orgName,
        description
      });

      setShowModal(false);
      setOrgName("");
      setDescription("");
      fetchOrganizations();
    } catch (err) {
      setError(err.response?.data?.message || "Creation failed");
    }
  };

  const openOrganizations = () => {
    navigate("/organizations");
  };

  const openMembers = () => {
    if (!selectedOrganization) {
      setError("Please select an organization first.");
      return;
    }

    navigate("/members", {
      state: { organization: selectedOrganization }
    });
  };

  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>
          <LayoutDashboard /> SyncBoard
        </h2>

        <p style={styles.menuTitle}>WORKSPACE</p>

        <div style={styles.activeMenu}>
          <LayoutDashboard size={19} /> Dashboard
        </div>

        <div style={styles.menuItem} onClick={openOrganizations}>
          <Building2 size={19} /> Organizations
        </div>

        <div style={styles.menuItem} onClick={() => navigate("/my-tasks")}>
          <CheckSquare size={19} /> My Tasks
        </div>

        <div style={styles.menuItem} onClick={openMembers}>
          <Users size={19} /> Members
        </div>

        <div style={styles.bottomMenu}>
          <div style={styles.menuItem} onClick={() => setError("Settings page is not available yet.")}>
            <Settings size={19} /> Settings
          </div>

          <div style={styles.menuItem} onClick={() => navigate("/login")}>
            <LogOut size={19} /> Logout
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back! Here's your workspace overview.</p>
          </div>
          <Bell size={22} />
        </header>

        <div style={styles.searchBox}>
          <Search size={19} />
          <input placeholder="Search workspace..." style={styles.searchInput} />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <section style={styles.stats}>
          <StatCard icon={<Building2 />} title="Organizations" value={organizations.length} />
          <StatCard icon={<LayoutDashboard />} title="Boards" value="0" />
          <StatCard icon={<CheckSquare />} title="My Tasks" value="0" />
          <StatCard icon={<Users />} title="Team Members" value="0" />
        </section>

        <section style={styles.workspace}>
          <div>
            <h2>Your Organizations</h2>
            <p>Select an organization to open workspace.</p>
          </div>

          <button style={styles.createButton} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Create Organization
          </button>
        </section>

        {loading && <p>Loading...</p>}

        {!loading && organizations.length === 0 && (
          <p>No organizations found.</p>
        )}

        <div style={styles.orgGrid}>
          {organizations.map(org => (
            <div
              key={org._id}
              style={{
                ...styles.orgCard,
                border: selectedOrganization?._id === org._id
                  ? "2px solid #4f46e5"
                  : "1px solid #e2e8f0"
              }}
              onClick={() => setSelectedOrganization(org)}
            >
              <Building2 color="#4f46e5" />
              <h3>{org.name}</h3>
              <p>{org.description || "Organization workspace"}</p>
            </div>
          ))}
        </div>

        {selectedOrganization && (
          <div style={styles.panel}>
            <h2>{selectedOrganization.name}</h2>

            <button
              style={styles.createButton}
              onClick={() => navigate("/tenants", {
                state: { organization: selectedOrganization }
              })}
            >
              Manage Branches
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <div style={styles.overlay}>
          <form style={styles.modal} onSubmit={createOrganization}>
            <div style={styles.header}>
              <h2>Create Organization</h2>
              <X
                style={{ cursor: "pointer" }}
                onClick={() => setShowModal(false)}
              />
            </div>

            <input
              style={styles.input}
              placeholder="Organization Name"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              required
            />

            <textarea
              style={styles.input}
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            <button style={styles.createButton}>Create</button>
          </form>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div style={styles.statCard}>
      {icon}
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

const styles = {
  container: { display: "flex", minHeight: "100vh", background: "#f8fafc" },
  sidebar: { width: 230, padding: 20, background: "white", display: "flex", flexDirection: "column" },
  logo: { color: "#4f46e5", display: "flex", gap: 10 },
  menuTitle: { color: "#94a3b8", marginTop: 30 },
  menuItem: { display: "flex", gap: 12, padding: 13, cursor: "pointer", color: "#64748b" },
  activeMenu: { display: "flex", gap: 12, padding: 13, background: "#eef2ff", color: "#4f46e5" },
  bottomMenu: { marginTop: "auto" },
  main: { flex: 1, padding: 30, minWidth: 0 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  searchBox: { display: "flex", gap: 10, padding: 12, background: "white", margin: "25px 0", maxWidth: 450 },
  searchInput: { border: 0, outline: 0, flex: 1 },
  stats: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 15 },
  statCard: { background: "white", padding: 20, borderRadius: 10 },
  workspace: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", margin: "35px 0 20px" },
  createButton: { background: "#4f46e5", color: "white", border: 0, padding: 12, borderRadius: 8, cursor: "pointer", display: "flex", gap: 8, alignItems: "center" },
  orgGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 15 },
  orgCard: { padding: 20, background: "white", borderRadius: 10, cursor: "pointer" },
  panel: { marginTop: 25, padding: 20, background: "white", borderRadius: 10 },
  overlay: { position: "fixed", inset: 0, background: "#0008", display: "grid", placeItems: "center", zIndex: 1000 },
  modal: { background: "white", padding: 25, borderRadius: 12, width: "90%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 15 },
  input: { padding: 12, border: "1px solid #ddd", borderRadius: 7 },
  error: { color: "red" }
};

export default Dashboard;
