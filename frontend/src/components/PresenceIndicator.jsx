
import { Users } from "lucide-react";

function PresenceIndicator({ onlineUsers = [] }) {
  return (
    <div style={styles.container}>
      <Users size={17} />
      <span>{onlineUsers.length} online</span>

      <div style={styles.users}>
        {onlineUsers.map((user, index) => (
          <span key={user._id || user.id || index} style={styles.dot} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "#ecfdf5",
    color: "#15803d",
    borderRadius: 8,
    fontSize: 13
  },
  users: {
    display: "flex",
    gap: 4
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#22c55e"
  }
};

export default PresenceIndicator;
