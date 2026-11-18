
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  LayoutDashboard,
  ArrowRight
} from "lucide-react";

import api from "../services/api";

function Tenants() {
  const location = useLocation();
  const navigate = useNavigate();
  const organization = location.state?.organization;

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [editingTenant, setEditingTenant] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (organization?._id) {
      fetchTenants();
    } else {
      setLoading(false);
      setError("Organization not selected.");
    }
  }, [organization?._id]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/tenants/organization/${organization._id}`
      );

      setTenants(
        Array.isArray(response.data.tenants)
          ? response.data.tenants
          : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load branches."
      );
    } finally {
      setLoading(false);
    }
  };

  const openWorkspace = (tenant) => {
    navigate("/boards", {
      state: {
        organization,
        tenant
      }
    });
  };

  const openCreateModal = () => {
    setEditingTenant(null);
    setTenantName("");
    setError("");
    setShowModal(true);
  };

  const openEditModal = (tenant) => {
    setEditingTenant(tenant);
    setTenantName(tenant.name);
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tenantName.trim()) {
      setError("Branch name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingTenant) {
        await api.put(`/tenants/${editingTenant._id}`, {
          name: tenantName.trim()
        });

        setSuccess("Branch updated successfully!");
      } else {
        await api.post(
          `/tenants/organization/${organization._id}`,
          { name: tenantName.trim() }
        );

        setSuccess("Branch created successfully!");
      }

      setShowModal(false);
      setTenantName("");
      setEditingTenant(null);

      await fetchTenants();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save branch."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tenant) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${tenant.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/tenants/${tenant._id}`);

      setSuccess("Branch deleted successfully!");
      await fetchTenants();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete branch."
      );
    }
  };

  if (!organization) {
    return (
      <div style={styles.center}>
        <h2>Organization not selected</h2>
        <button
          style={styles.primaryButton}
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <h1>Tenant Management</h1>
        <p>Manage branches of {organization.name}</p>
      </header>

      {success && <p style={styles.success}>{success}</p>}
      {error && <p style={styles.error}>{error}</p>}

      <section style={styles.summary}>
        <Building2 size={30} color="#4f46e5" />
        <div>
          <h2>{organization.name}</h2>
          <p>Organization Workspace</p>
          <small>Organization ID: {organization._id}</small>
        </div>
      </section>

      <section style={styles.sectionHeader}>
        <div>
          <h2>Your Branches</h2>
          <p>Create and manage organization branches.</p>
        </div>

        <div style={styles.actions}>
          <button
            style={styles.refreshButton}
            onClick={fetchTenants}
            disabled={loading}
          >
            <RefreshCw size={17} />
          </button>

          <button
            style={styles.primaryButton}
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Create Branch
          </button>
        </div>
      </section>

      {loading && <p>Loading branches...</p>}

      {!loading && tenants.length === 0 && !error && (
        <div style={styles.emptyState}>
          <Building2 size={40} color="#4f46e5" />
          <h3>No branches yet</h3>
          <p>Create your first branch for this organization.</p>

          <button
            style={styles.primaryButton}
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Create First Branch
          </button>
        </div>
      )}

      {!loading && tenants.length > 0 && (
        <div style={styles.grid}>
          {tenants.map((tenant) => (
            <div key={tenant._id} style={styles.card}>
              <div style={styles.cardTop}>
                <Building2 size={25} color="#4f46e5" />

                <div style={styles.actions}>
                  <button
                    style={styles.editButton}
                    onClick={() => openEditModal(tenant)}
                    title="Edit"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDelete(tenant)}
                    title="Delete"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              <h3>{tenant.name}</h3>
              <p>Organization Branch</p>
              <small>Slug: {tenant.slug}</small>

              <button
                style={styles.workspaceButton}
                onClick={() => openWorkspace(tenant)}
              >
                <LayoutDashboard size={17} />
                Open Workspace
                <ArrowRight size={17} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>
                {editingTenant ? "Edit Branch" : "Create Branch"}
              </h2>

              <button
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
                type="button"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Branch Name</label>

              <input
                style={styles.input}
                type="text"
                placeholder="Example: Noida Branch"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
              />

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={saving}
              >
                {saving
                  ? "Please wait..."
                  : editingTenant
                    ? "Update Branch"
                    : "Create Branch"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "35px",
    color: "#0f172a"
  },
  header: { marginBottom: "30px" },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    background: "transparent",
    color: "#4f46e5",
    cursor: "pointer",
    marginBottom: "20px",
    fontWeight: "600"
  },
  summary: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    background: "#ffffff",
    padding: "22px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    marginBottom: "35px"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "22px"
  },
  actions: {
    display: "flex",
    gap: "10px"
  },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 17px",
    border: "none",
    borderRadius: "8px",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer"
  },
  workspaceButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    marginTop: "20px",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer"
  },
  refreshButton: {
    padding: "10px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: "8px",
    cursor: "pointer"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px"
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "22px"
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px"
  },
  editButton: {
    background: "#eef2ff",
    color: "#4f46e5",
    border: "none",
    padding: "8px",
    borderRadius: "7px",
    cursor: "pointer"
  },
  deleteButton: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "none",
    padding: "8px",
    borderRadius: "7px",
    cursor: "pointer"
  },
  emptyState: {
    background: "#ffffff",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    minHeight: "250px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "14px",
    textAlign: "center"
  },
  success: {
    background: "#f0fdf4",
    color: "#15803d",
    padding: "12px",
    borderRadius: "8px"
  },
  error: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "12px",
    borderRadius: "8px"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000
  },
  modal: {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "25px",
    width: "100%",
    maxWidth: "430px"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  closeButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer"
  },
  label: {
    display: "block",
    fontWeight: "600",
    marginBottom: "9px"
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px"
  }
};

export default Tenants;
