
import { ArrowLeft, LayoutDashboard, RefreshCw } from "lucide-react";
import PresenceIndicator from "./PresenceIndicator";

function BoardHeader({
  board,
  organization,
  tenant,
  onlineUsers = [],
  onBack,
  onRefresh
}) {
  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <button style={styles.button} onClick={onBack}>
          <ArrowLeft size={18} />
        </button>

        <LayoutDashboard size={23} color="#4f46e5" />

        <div>
          <h2>{board?.name || "Kanban Board"}</h2>
          <p>{organization?.name} / {tenant?.name}</p>
        </div>
      </div>

      <div style={styles.right}>
        <PresenceIndicator onlineUsers={onlineUsers} />

        <button style={styles.button} onClick={onRefresh}>
          <RefreshCw size={17} />
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15,
    padding: "15px 20px",
    background: "white",
    borderBottom: "1px solid #e2e8f0"
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  button: {
    display: "flex",
    padding: 9,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer"
  }
};

export default BoardHeader;
