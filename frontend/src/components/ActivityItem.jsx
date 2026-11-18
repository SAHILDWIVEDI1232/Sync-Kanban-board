
import { Activity, Clock, User } from "lucide-react";

function ActivityItem({ log }) {
  const action = (log.action || "ACTIVITY")
    .replaceAll("_", " ")
    .toLowerCase();

  return (
    <div style={styles.card}>
      <div style={styles.icon}>
        <Activity size={19} color="#4f46e5" />
      </div>

      <div style={styles.content}>
        <strong>{log.userId?.name || "Unknown User"}</strong>

        <p>{action} {log.entityType || "item"}</p>

        <div style={styles.meta}>
          <span><User size={13} /> {log.userId?.email || "User"}</span>
          <span>
            <Clock size={13} />
            {log.createdAt
              ? new Date(log.createdAt).toLocaleString("en-IN")
              : "Date unavailable"}
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: "flex",
    gap: 13,
    padding: 15,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 10
  },
  icon: {
    padding: 10,
    background: "#eef2ff",
    borderRadius: 8,
    height: "fit-content"
  },
  content: { flex: 1, minWidth: 0 },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    color: "#64748b",
    fontSize: 11
  }
};

export default ActivityItem;
