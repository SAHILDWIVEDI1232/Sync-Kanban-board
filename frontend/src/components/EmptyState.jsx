
import { Inbox } from "lucide-react";

function EmptyState({
  title = "Nothing here yet",
  message = "Create something to get started."
}) {
  return (
    <div style={styles.container}>
      <Inbox size={42} color="#94a3b8" />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 35,
    textAlign: "center",
    color: "#64748b",
    background: "white",
    border: "1px dashed #cbd5e1",
    borderRadius: 10
  }
};

export default EmptyState;
