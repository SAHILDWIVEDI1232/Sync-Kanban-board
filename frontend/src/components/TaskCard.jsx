
import { Pencil, Trash2, Flag } from "lucide-react";

function TaskCard({ task, onClick, onEdit, onDelete }) {
  const priorityColor = {
    High: "#dc2626",
    Medium: "#d97706",
    Low: "#16a34a"
  };

  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.top}>
        <strong>{task.title}</strong>

        <div style={styles.actions}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(task);
            }}
          >
            <Pencil size={15} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(task);
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {task.description && (
        <p style={styles.description}>{task.description}</p>
      )}

      <span style={{
        ...styles.priority,
        color: priorityColor[task.priority] || "#64748b"
      }}>
        <Flag size={13} />
        {task.priority || "Medium"}
      </span>
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    padding: 14,
    borderRadius: 9,
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    marginBottom: 10
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8
  },
  actions: {
    display: "flex",
    gap: 5
  },
  description: {
    fontSize: 13,
    color: "#64748b"
  },
  priority: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    marginTop: 8
  }
};

export default TaskCard;
