
import { Plus, Pencil, Trash2 } from "lucide-react";
import TaskCard from "./TaskCard";

function Column({
  column,
  tasks = [],
  onAddTask,
  onEditColumn,
  onDeleteColumn,
  onTaskClick,
  onEditTask,
  onDeleteTask
}) {
  return (
    <div style={styles.column}>
      <div style={styles.header}>
        <h3>{column.name}</h3>

        <div style={styles.actions}>
          <button onClick={() => onAddTask(column)}>
            <Plus size={16} />
          </button>

          <button onClick={() => onEditColumn(column)}>
            <Pencil size={15} />
          </button>

          <button onClick={() => onDeleteColumn(column)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <p style={styles.count}>{tasks.length} tasks</p>

      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          onClick={() => onTaskClick(task)}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
        />
      ))}
    </div>
  );
}

const styles = {
  column: {
    minWidth: 270,
    width: 270,
    padding: 14,
    background: "#f1f5f9",
    borderRadius: 10,
    minHeight: 250
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  actions: {
    display: "flex",
    gap: 5
  },
  count: {
    color: "#64748b",
    fontSize: 12,
    marginBottom: 14
  }
};

export default Column;
