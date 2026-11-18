
import { Filter } from "lucide-react";

function FilterBar({ priority, onPriorityChange }) {
  return (
    <div style={styles.container}>
      <Filter size={17} color="#64748b" />

      <select
        style={styles.select}
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value)}
      >
        <option value="All">All Priorities</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "9px 12px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 8
  },
  select: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 13,
    cursor: "pointer"
  }
};

export default FilterBar;
