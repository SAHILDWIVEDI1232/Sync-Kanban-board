
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  ArrowRight
} from "lucide-react";

import api from "../services/api";

function Boards() {
  const location = useLocation();
  const navigate = useNavigate();

  const organization = location.state?.organization;
  const tenant = location.state?.tenant;

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBoards = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/boards/tenant/${tenant._id}`
      );

      setBoards(response.data.boards || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Boards load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [tenant?._id]);

  const openCreateModal = () => {
    setEditingBoard(null);
    setTitle("");
    setDescription("");
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (board) => {
    setEditingBoard(board);
    setTitle(board.title);
    setDescription(board.description || "");
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Board title required hai.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingBoard) {
        await api.put(`/boards/${editingBoard._id}`, {
          title: title.trim(),
          description: description.trim()
        });

        setSuccess("Board successfully updated.");
      } else {
        await api.post(`/boards/tenant/${tenant._id}`, {
          title: title.trim(),
          description: description.trim()
        });

        setSuccess("Board successfully created.");
      }

      setModalOpen(false);
      setTitle("");
      setDescription("");
      setEditingBoard(null);

      await fetchBoards();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Board save nahi ho paaya."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (boardId) => {
    const confirmed = window.confirm(
      "Kya aap is board ko delete karna chahte hain?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/boards/${boardId}`);

      setSuccess("Board successfully deleted.");
      await fetchBoards();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Board delete nahi ho paaya."
      );
    }
  };

  const openBoard = (board) => {
    navigate("/kanban", {
      state: {
        organization,
        tenant,
        board
      }
    });
  };

  if (!organization || !tenant) {
    return (
      <div style={styles.center}>
        <h2>Organization ya Branch select nahi hai.</h2>
        <button
          style={styles.primaryButton}
          onClick={() => navigate("/dashboard")}
        >
          Dashboard par jaayein
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            style={styles.backButton}
            onClick={() =>
              navigate("/tenants", {
                state: { organization }
              })
            }
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h2 style={styles.heading}>Boards</h2>
            <p style={styles.subtitle}>
              {organization.name} / {tenant.name}
            </p>
          </div>
        </div>

        <button
          style={styles.primaryButton}
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Create Board
        </button>
      </header>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <section style={styles.welcome}>
        <div>
          <h1>Workspace Boards</h1>
          <p>
            Apne projects aur team tasks ko boards mein organize karein.
          </p>
        </div>

        <LayoutDashboard size={55} color="#6366f1" />
      </section>

      <div style={styles.sectionHeader}>
        <h2>Your Boards</h2>

        <button
          style={styles.refreshButton}
          onClick={fetchBoards}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading ? (
        <p style={styles.info}>Loading boards...</p>
      ) : boards.length === 0 ? (
        <div style={styles.empty}>
          <LayoutDashboard size={45} color="#9ca3af" />
          <h3>Abhi koi board nahi hai</h3>
          <p>Apna pehla board create karein.</p>

          <button
            style={styles.primaryButton}
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Create First Board
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {boards.map((board) => (
            <div key={board._id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.boardIcon}>
                  <LayoutDashboard size={23} />
                </div>

                <div style={styles.actions}>
                  <button
                    style={styles.iconButton}
                    title="Edit board"
                    onClick={() => openEditModal(board)}
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    style={styles.deleteButton}
                    title="Delete board"
                    onClick={() => handleDelete(board._id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              <h3 style={styles.boardTitle}>
                {board.title}
              </h3>

              <p style={styles.description}>
                {board.description || "No description added."}
              </p>

              <button
                style={styles.openButton}
                onClick={() => openBoard(board)}
              >
                Open Board
                <ArrowRight size={17} />
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div style={styles.overlay}>
          <form
            style={styles.modal}
            onSubmit={handleSubmit}
          >
            <div style={styles.modalHeader}>
              <h2>
                {editingBoard ? "Edit Board" : "Create Board"}
              </h2>

              <button
                type="button"
                style={styles.iconButton}
                onClick={() => setModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <label style={styles.label}>Board Title</label>

            <input
              style={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter board title"
              required
            />

            <label style={styles.label}>Description</label>

            <textarea
              style={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter board description"
              rows={4}
            />

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingBoard
                  ? "Update Board"
                  : "Create Board"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    color: "#1e293b"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "30px"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },
  heading: {
    margin: 0,
    fontSize: "25px"
  },
  subtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "14px"
  },
  backButton: {
    border: "1px solid #e2e8f0",
    background: "white",
    borderRadius: "10px",
    padding: "11px",
    cursor: "pointer",
    display: "flex"
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "9px",
    padding: "12px 18px",
    cursor: "pointer",
    fontWeight: "600"
  },
  welcome: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "15px",
    padding: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "30px"
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px"
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "9px 13px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "20px"
  },
  card: {
    background: "white",
    padding: "22px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px"
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  boardIcon: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef2ff",
    color: "#4f46e5",
    borderRadius: "12px"
  },
  actions: {
    display: "flex",
    gap: "8px"
  },
  iconButton: {
    border: "1px solid #e2e8f0",
    background: "white",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex"
  },
  deleteButton: {
    border: "1px solid #fee2e2",
    background: "#fff1f2",
    color: "#dc2626",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex"
  },
  boardTitle: {
    fontSize: "19px",
    margin: "20px 0 8px"
  },
  description: {
    color: "#64748b",
    fontSize: "14px",
    minHeight: "38px",
    lineHeight: "1.5"
  },
  openButton: {
    width: "100%",
    marginTop: "15px",
    padding: "11px",
    border: "none",
    borderRadius: "8px",
    background: "#eef2ff",
    color: "#4338ca",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px"
  },
  empty: {
    background: "white",
    border: "1px dashed #cbd5e1",
    borderRadius: "15px",
    padding: "55px 20px",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    gap: "12px"
  },
  info: {
    color: "#64748b"
  },
  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px"
  },
  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000
  },
  modal: {
    background: "white",
    width: "100%",
    maxWidth: "450px",
    padding: "25px",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "600"
  },
  input: {
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    outline: "none",
    fontSize: "15px"
  },
  textarea: {
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    resize: "vertical",
    fontSize: "15px"
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px"
  }
};

export default Boards;
