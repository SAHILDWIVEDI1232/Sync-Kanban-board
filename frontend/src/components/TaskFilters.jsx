
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";

function TaskFilters({
  search,
  onSearchChange,
  priority,
  onPriorityChange
}) {
  return (
    <div style={styles.container}>
      <SearchBar
        value={search}
        onChange={onSearchChange}
      />

      <FilterBar
        priority={priority}
        onPriorityChange={onPriorityChange}
      />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    padding: "15px 20px",
    background: "#f8fafc"
  }
};

export default TaskFilters;
