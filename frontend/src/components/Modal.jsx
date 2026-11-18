
import { X } from "lucide-react";

function Modal({ title, children, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <h2>{title}</h2>
          <button onClick={onClose} style={styles.close}>
            <X size={20} />
          </button>
        </div>

        {children}
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
    padding: 15,
    zIndex: 1000
  },
  modal: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "white",
    padding: 22,
    borderRadius: 12
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18
  },
  close: {
    display: "flex",
    border: "none",
    background: "transparent",
    cursor: "pointer"
  }
};

export default Modal;
