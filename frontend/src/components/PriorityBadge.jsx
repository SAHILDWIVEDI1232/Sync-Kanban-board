
import { Flag } from "lucide-react";

function PriorityBadge({ priority = "Medium" }) {
  const colors = {
    High: { bg: "#fee2e2", color: "#b91c1c" },
    Medium: { bg: "#fef3c7", color: "#92400e" },
    Low: { bg: "#dcfce7", color: "#166534" }
  };

  const selected = colors[priority] || colors.Medium;

  return (
    <span style={{
      ...styles.badge,
      background: selected.bg,
      color: selected.color
    }}>
      <Flag size={12} />
      {priority}
    </span>
  );
}

const styles = {
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 9px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600
  }
};

export default PriorityBadge;
