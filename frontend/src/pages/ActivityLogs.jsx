
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  RefreshCw,
  User,
  Clock
} from "lucide-react";

import api from "../services/api";

function ActivityLogs() {
  const location = useLocation();
  const navigate = useNavigate();

  const organization = location.state?.organization;
  const tenant = location.state?.tenant;
  const board = location.state?.board;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    if (!tenant?._id) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/activity-logs/tenant/${tenant._id}`
      );

      setLogs(response.data.logs || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Activity logs load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tenant?._id]);

  const formatAction = (action) => {
    return (action || "UNKNOWN")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const getActionColor = (action) => {
    if (action?.includes("CREATED")) {
      return {
        background: "#dcfce7",
        color: "#166534"
      };
    }

    if (action?.includes("DELETED")) {
      return {
        background: "#fee2e2",
        color: "#b91c1c"
      };
    }

    if (action?.includes("UPDATED")) {
      return {
        background: "#dbeafe",
        color: "#1d4ed8"
      };
    }

    if (action?.includes("MOVED")) {
      return {
        background: "#fef3c7",
        color: "#92400e"
      };
    }

    return {
      background: "#f1f5f9",
      color: "#475569"
    };
  };

  if (!organization || !tenant) {
    return (
      <div style={styles.center}>
        <h2>Workspace details missing hain.</h2>

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
              navigate(
                board ? "/kanban" : "/boards",
                {
                  state: { organization, tenant, board }
                }
              )
            }
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h2 style={styles.heading}>Activity Logs</h2>

            <p style={styles.subtitle}>
              {organization.name} / {tenant.name}
            </p>
          </div>
        </div>

        <button
          style={styles.refreshButton}
          onClick={fetchLogs}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <div style={styles.infoCard}>
        <Activity size={35} color="#4f46e5" />

        <div>
          <h2>Workspace Activity</h2>
          <p>
            Track all activities performed by your team.
          </p>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={styles.info}>Loading activity logs...</p>
      ) : logs.length === 0 ? (
        <div style={styles.empty}>
          <Activity size={40} color="#94a3b8" />
          <h3>No activity found</h3>
          <p>Team activities will appear here.</p>
        </div>
      ) : (
        <div style={styles.logList}>
          <div style={styles.logCount}>
            {logs.length} activities found
          </div>

          {logs.map((log) => (
            <div key={log._id} style={styles.logCard}>
              <div style={styles.iconBox}>
                <Activity size={19} color="#4f46e5" />
              </div>

              <div style={styles.logContent}>
                <div style={styles.logTop}>
                  <strong>
                    {log.userId?.name || "Unknown User"}
                  </strong>

                  <span
                    style={{
                      ...styles.actionBadge,
                      ...getActionColor(log.action)
                    }}
                  >
                    {formatAction(log.action)}
                  </span>
                </div>

                <p style={styles.description}>
                  {formatAction(log.entityType)} activity
                </p>

                <div style={styles.meta}>
                  <span>
                    <User size={13} />
                    {log.userId?.email || "User"}
                  </span>

                  <span>
                    <Clock size={13} />
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "25px",
    background: "#f8fafc",
    color: "#1e293b",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "25px"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "13px"
  },
  heading: {
    margin: 0,
    fontSize: "24px"
  },
  subtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
    color: "#64748b"
  },
  backButton: {
    display: "flex",
    padding: "11px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    cursor: "pointer"
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "10px 13px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer"
  },
  infoCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "22px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    marginBottom: "25px"
  },
  logList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  logCount: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "5px"
  },
  logCard: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    padding: "17px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "11px"
  },
  iconBox: {
    display: "flex",
    padding: "10px",
    background: "#eef2ff",
    borderRadius: "9px"
  },
  logContent: {
    flex: 1,
    minWidth: 0
  },
  logTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px"
  },
  actionBadge: {
    padding: "5px 9px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700"
  },
  description: {
    margin: "8px 0",
    color: "#475569",
    fontSize: "13px"
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    color: "#94a3b8",
    fontSize: "11px"
  },
  info: {
    color: "#64748b"
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "55px 20px",
    background: "white",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    textAlign: "center"
  },
  error: {
    padding: "12px",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    marginBottom: "15px"
  },
  primaryButton: {
    padding: "11px 16px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "9px",
    cursor: "pointer"
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

export default ActivityLogs;
