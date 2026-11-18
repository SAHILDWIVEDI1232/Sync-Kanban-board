
import { AlertTriangle, X } from "lucide-react";

function ConfirmModal({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  onConfirm,
  onClose
}) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.close} onClick={onClose}>
          <X size={18} />
        </button>

        <AlertTriangle size={35} color="#dc2626" />

        <h2>{title}</h2>
        <p>{message}</p>

        <div style={styles.actions}>
          <button style={styles.cancel} onClick={onClose}>
            Cancel
          </button>

          <button style={styles.delete} onClick={onConfirm}>
            Delete
          </button>
        </div>
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
    zIndex: 1100,
    padding: 15
  },
  modal: {
    position: "relative",
    background: "white",
    padding: 25,
    borderRadius: 12,
    width: "100%",
    maxWidth: 380,
    textAlign: "center"
  },
  close: {
    position: "absolute",
    right: 12,
    top: 12,
    border: "none",
    background: "transparent",
    cursor: "pointer"
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    marginTop: 20
  },
  cancel: {
    padding: "10px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: 7,
    background: "white",
    cursor: "pointer"
  },
  delete: {
    padding: "10px 18px",
    border: "none",
    borderRadius: 7,
    background: "#dc2626",
    color: "white",
    cursor: "pointer"
  }
};

export default ConfirmModal;
