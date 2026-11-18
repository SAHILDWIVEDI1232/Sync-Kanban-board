
import { useState } from "react";
import { X } from "lucide-react";

function TaskForm({ task, columns = [], onSubmit, onClose }) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [columnId, setColumnId] = useState(task?.columnId?._id || task?.columnId || "");
  const [priority, setPriority] = useState(task?.priority || "Medium");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description,
      columnId,
      priority
    });
  };

  return (
    <div style={styles.overlay}>
      <form style={styles.modal} onSubmit={handleSubmit}>
        <button type="button" style={styles.close} onClick={onClose}>
          <X size={20} />
        </button>

        <h2>{task ? "Edit Task" : "Create Task"}</h2>

        <label>Task Title</label>
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          required
        />

        <label>Description</label>
        <textarea
          style={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
        />

        <label>Column</label>
        <select
          style={styles.input}
          value={columnId}
          onChange={(e) => setColumnId(e.target.value)}
        >
          <option value="">Select column</option>
          {columns.map((column) => (
            <option key={column._id} value={column._id}>
              {column.name}
            </option>
          ))}
        </select>

        <label>Priority</label>
        <select
          style={styles.input}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <button style={styles.submit} type="submit">
          {task ? "Update Task" : "Create Task"}
        </button>
      </form>
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
    maxWidth: 450,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  close: {
    position: "absolute",
    right: 15,
    top: 15,
    border: "none",
    background: "transparent",
    cursor: "pointer"
  },
  input: {
    padding: 11,
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    fontSize: 14
  },
  submit: {
    padding: 12,
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 10
  }
};

export default TaskForm;
