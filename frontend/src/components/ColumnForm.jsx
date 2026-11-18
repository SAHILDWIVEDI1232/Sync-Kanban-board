
import { useState } from "react";
import { X } from "lucide-react";

function ColumnForm({ column, onSubmit, onClose }) {
  const [name, setName] = useState(column?.name || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim() });
  };

  return (
    <div style={styles.overlay}>
      <form style={styles.modal} onSubmit={handleSubmit}>
        <button type="button" style={styles.close} onClick={onClose}>
          <X size={20} />
        </button>

        <h2>{column ? "Edit Column" : "Create Column"}</h2>

        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Column name"
          required
          autoFocus
        />

        <button type="submit" style={styles.submit}>
          {column ? "Update Column" : "Create Column"}
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
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    gap: 15
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
    padding: 12,
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
    cursor: "pointer"
  }
};

export default ColumnForm;
