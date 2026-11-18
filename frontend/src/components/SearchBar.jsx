
import { Search, X } from "lucide-react";

function SearchBar({ value, onChange, placeholder = "Search tasks..." }) {
  return (
    <div style={styles.container}>
      <Search size={18} color="#64748b" />

      <input
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />

      {value && (
        <button style={styles.clear} onClick={() => onChange("")}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 13px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    maxWidth: 350
  },
  input: {
    flex: 1,
    minWidth: 0,
    border: "none",
    outline: "none",
    fontSize: 14
  },
  clear: {
    display: "flex",
    border: "none",
    background: "transparent",
    cursor: "pointer"
  }
};

export default SearchBar;
