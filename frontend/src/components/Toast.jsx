
import { CheckCircle, AlertCircle, X } from "lucide-react";

function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  const isError = type === "error";

  return (
    <div style={{
      ...styles.toast,
      background: isError ? "#fee2e2" : "#dcfce7",
      color: isError ? "#b91c1c" : "#166534"
    }}>
      {isError
        ? <AlertCircle size={19} />
        : <CheckCircle size={19} />}

      <span>{message}</span>

      <button onClick={onClose} style={styles.close}>
        <X size={16} />
      </button>
    </div>
  );
}

const styles = {
  toast: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 15px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 12
  },
  close: {
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    cursor: "pointer"
  }
};

export default Toast;
