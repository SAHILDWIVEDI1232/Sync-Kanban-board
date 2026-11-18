
import { useEffect, useState } from "react";
import { X, Calendar, User, Flag } from "lucide-react";
import api from "../services/api";

function TaskDetails({ task, onClose }) {
  const [details, setDetails] = useState(task);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await api.get(`/tasks/${task._id}`);
        setDetails(res.data.task || task);
      } catch (error) {
        console.error("Task details error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (task?._id) fetchTask();
  }, [task?._id]);

  if (!task) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.close} onClick={onClose}>
          <X size={20} />
        </button>

        <h2>Task Details</h2>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <h3>{details.title}</h3>
            <p>{details.description || "No description"}</p>

            <div style={styles.info}>
              <Flag size={17} />
              Priority: {details.priority || "Not set"}
            </div>

            <div style={styles.info}>
              <Calendar size={17} />
              Due Date: {details.dueDate
                ? new Date(details.dueDate).toLocaleDateString()
                : "Not set"}
            </div>

            <div style={styles.info}>
              <User size={17} />
              Assigned To: {details.assignedTo?.name || "Not assigned"}
            </div>

            <small>Task ID: {details._id}</small>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: 15
  },
  modal: {
    position: "relative",
    background: "white",
    padding: 25,
    borderRadius: 12,
    width: "100%",
    maxWidth: 450
  },
  close: {
    position: "absolute",
    right: 15,
    top: 15,
    border: "none",
    background: "transparent",
    cursor: "pointer"
  },
  info: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    margin: "15px 0",
    color: "#475569"
  }
};

export default TaskDetails;
