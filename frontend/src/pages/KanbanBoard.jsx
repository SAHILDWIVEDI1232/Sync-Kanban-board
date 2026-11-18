
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import {
  ArrowLeft, Plus, Pencil, Trash2, X, RefreshCw,
  CalendarDays, User, LayoutDashboard, History, Eye
} from "lucide-react";

import api from "../services/api";
import {
  connectSocket, leaveTenant, disconnectSocket
} from "../services/socket";

import TaskFilters from "../components/TaskFilters";
import PresenceIndicator from "../components/PresenceIndicator";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import PriorityBadge from "../components/PriorityBadge";

function DraggableTask({ task, onView, onEdit, onDelete }) {
  const {
    attributes, listeners, setNodeRef, transform, isDragging
  } = useDraggable({ id: task._id });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...styles.card,
        transform: transform
          ? `translate3d(${transform.x}px,${transform.y}px,0)`
          : undefined,
        opacity: isDragging ? 0.5 : 1
      }}
    >
      <div {...listeners} {...attributes} style={{ cursor: "grab" }}>
        <div style={styles.row}>
          <PriorityBadge priority={
            (task.priority || "MEDIUM").toLowerCase() === "high"
              ? "High"
              : (task.priority || "MEDIUM").toLowerCase() === "low"
                ? "Low" : "Medium"
          } />
          <small>v{task.version ?? 0}</small>
        </div>

        <h4>{task.title}</h4>
        <p>{task.description}</p>

        {task.dueDate && (
          <small><CalendarDays size={13} />{" "}
            {new Date(task.dueDate).toLocaleDateString()}
          </small>
        )}

        {task.assignedTo && (
          <small><User size={13} />{" "}
            {task.assignedTo.name || "Assigned"}
          </small>
        )}
      </div>

      <div style={styles.row}>
        <button onClick={() => onView(task)}><Eye size={14} /> View</button>
        <button onClick={() => onEdit(task)}><Pencil size={14} /> Edit</button>
        <button onClick={() => onDelete(task._id)}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function BoardColumn({ column, tasks, actions }) {
  const { setNodeRef, isOver } = useDroppable({ id: column._id });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...styles.column,
        background: isOver ? "#eef2ff" : "#f1f5f9"
      }}
    >
      <div style={styles.row}>
        <div>
          <h3>{column.title}</h3>
          <small>{tasks.length} tasks</small>
        </div>

        <div style={styles.row}>
          <button onClick={() => actions.editColumn(column)}>
            <Pencil size={14} />
          </button>
          <button onClick={() => actions.deleteColumn(column._id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {tasks.map(task => (
        <DraggableTask
          key={task._id}
          task={task}
          onView={actions.viewTask}
          onEdit={actions.editTask}
          onDelete={actions.deleteTask}
        />
      ))}

      {tasks.length === 0 && (
        <p style={styles.muted}>Drop tasks here</p>
      )}

      <button
        style={styles.addButton}
        onClick={() => actions.addTask(column)}
      >
        <Plus size={15} /> Add Task
      </button>
    </div>
  );
}

function KanbanBoard() {
  const location = useLocation();
  const navigate = useNavigate();

  const organization = location.state?.organization;
  const tenant = location.state?.tenant;
  const board = location.state?.board;

  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [modalType, setModalType] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const fetchWorkspace = useCallback(async () => {
    if (!board?._id) return;

    try {
      setLoading(true);
      setError("");

      const [columnRes, taskRes] = await Promise.all([
        api.get(`/columns/board/${board._id}`),
        api.get(`/tasks/board/${board._id}`)
      ]);

      setColumns(columnRes.data.columns || []);
      setTasks(taskRes.data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || "Workspace load nahi hua.");
    } finally {
      setLoading(false);
    }
  }, [board?._id]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    if (!tenant?._id) return;

    const socket = connectSocket(tenant._id);
    const refresh = () => fetchWorkspace();

    const handlePresence = data => {
      if (data.tenantId === tenant._id) {
        setOnlineUsers(data.onlineUserIds || []);
      }
    };

    const events = [
      "task-created", "task-updated", "task-moved", "task-deleted",
      "column-created", "column-updated", "column-deleted"
    ];

    events.forEach(event => socket.on(event, refresh));
    socket.on("presence-updated", handlePresence);

    return () => {
      events.forEach(event => socket.off(event, refresh));
      socket.off("presence-updated", handlePresence);
      leaveTenant(tenant._id);
      disconnectSocket();
    };
  }, [tenant?._id, fetchWorkspace]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setDueDate("");
    setEditingItem(null);
    setSelectedColumn(null);
  };

  const openColumn = column => {
    resetForm();
    setModalType("column");
    setEditingItem(column);
    setTitle(column?.title || "");
    setError("");
  };

  const openTask = (column, task = null) => {
    resetForm();
    setModalType("task");
    setSelectedColumn(column);
    setEditingItem(task);

    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "MEDIUM");
      setDueDate(task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : "");
    }

    setError("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!title.trim()) return setError("Title required hai.");

    try {
      setSaving(true);
      setError("");

      if (modalType === "column") {
        const data = { title: title.trim() };

        if (editingItem) {
          await api.put(`/columns/${editingItem._id}`, data);
        } else {
          await api.post(`/columns/board/${board._id}`, data);
        }
      } else {
        const data = {
          title: title.trim(),
          description: description.trim(),
          priority,
          dueDate: dueDate || null
        };

        if (editingItem) {
          await api.put(`/tasks/${editingItem._id}`, {
            ...data,
            expectedVersion: editingItem.version
          });
        } else {
          await api.post(
            `/tasks/board/${board._id}/column/${selectedColumn._id}`,
            data
          );
        }
      }

      setSuccess("Successfully saved.");
      setModalType("");
      resetForm();
      await fetchWorkspace();
    } catch (err) {
      setError(err.response?.data?.message || "Save nahi ho paaya.");
      if (err.response?.status === 409) fetchWorkspace();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;

    try {
      if (confirm.type === "task") {
        await api.delete(`/tasks/${confirm.id}`);
      } else {
        await api.delete(`/columns/${confirm.id}`);
      }

      setSuccess("Successfully deleted.");
      setConfirm(null);
      await fetchWorkspace();
    } catch (err) {
      setError(err.response?.data?.message || "Delete nahi ho paaya.");
      setConfirm(null);
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;

    const task = tasks.find(item => item._id === active.id);
    const targetColumnId = over.id;
    const currentColumnId = task?.columnId?._id || task?.columnId;

    if (!task || currentColumnId === targetColumnId) return;

    const position = tasks.filter(item =>
      (item.columnId?._id || item.columnId) === targetColumnId
    ).length;

    setTasks(current => current.map(item =>
      item._id === task._id
        ? { ...item, columnId: targetColumnId }
        : item
    ));

    try {
      await api.patch(`/tasks/${task._id}/move`, {
        targetColumnId,
        position,
        expectedVersion: task.version
      });

      setSuccess("Task moved successfully.");
      await fetchWorkspace();
    } catch (err) {
      setError(err.response?.data?.message || "Task move nahi hua.");
      await fetchWorkspace();
    }
  };

  if (!organization || !tenant || !board) {
    return (
      <div style={styles.center}>
        <h2>Workspace details missing hain.</h2>
        <button onClick={() => navigate("/dashboard")}>Dashboard</button>
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title?.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());

    const matchesPriority =
      priorityFilter === "All" ||
      (task.priority || "MEDIUM").toLowerCase() === priorityFilter.toLowerCase();

    return matchesSearch && matchesPriority;
  });

  const actions = {
    addTask: column => openTask(column),
    editColumn: openColumn,
    deleteColumn: id => setConfirm({ type: "column", id }),
    viewTask: setSelectedTask,
    editTask: task => {
      const column = columns.find(c =>
        c._id === (task.columnId?._id || task.columnId)
      );
      openTask(column, task);
    },
    deleteTask: id => setConfirm({ type: "task", id })
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.row}>
          <button onClick={() => navigate("/boards", {
            state: { organization, tenant }
          })}>
            <ArrowLeft size={18} />
          </button>

          <div>
            <h2>{board.title}</h2>
            <small>{organization.name} / {tenant.name}</small>
          </div>
        </div>

        <div style={styles.row}>
          <PresenceIndicator onlineUsers={onlineUsers} />

          <button onClick={fetchWorkspace}>
            <RefreshCw size={15} /> Refresh
          </button>

          <button onClick={() => navigate("/activity-logs", {
            state: { organization, tenant, board }
          })}>
            <History size={15} /> Activity Logs
          </button>

          <button style={styles.primary} onClick={() => openColumn()}>
            <Plus size={16} /> Add Column
          </button>
        </div>
      </header>

      <Toast message={error} type="error" onClose={() => setError("")} />
      <Toast message={success} onClose={() => setSuccess("")} />

      <div style={styles.banner}>
        <div>
          <h1>Kanban Workspace</h1>
          <p>Manage tasks and collaborate with your team.</p>
        </div>
        <LayoutDashboard size={35} color="#4f46e5" />
      </div>

      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        priority={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      {loading ? (
        <Loading message="Loading workspace..." />
      ) : columns.length === 0 ? (
        <EmptyState
          title="No columns available"
          message="Create your first column to get started."
        />
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <div style={styles.columns}>
            {columns.map(column => (
              <BoardColumn
                key={column._id}
                column={column}
                tasks={filteredTasks
                  .filter(task =>
                    (task.columnId?._id || task.columnId) === column._id
                  )
                  .sort((a, b) => a.position - b.position)}
                actions={actions}
              />
            ))}
          </div>
        </DndContext>
      )}

      {modalType && (
        <div style={styles.overlay}>
          <form style={styles.modal} onSubmit={handleSubmit}>
            <div style={styles.row}>
              <h2>{modalType === "column"
                ? editingItem ? "Edit Column" : "Create Column"
                : editingItem ? "Edit Task" : "Create Task"}</h2>
              <button type="button" onClick={() => {
                setModalType("");
                resetForm();
              }}>
                <X size={19} />
              </button>
            </div>

            <label>Title</label>
            <input
              style={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Enter title"
            />

            {modalType === "task" && (
              <>
                <label>Description</label>
                <textarea
                  style={styles.input}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />

                <label>Priority</label>
                <select
                  style={styles.input}
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>

                <label>Due Date</label>
                <input
                  type="date"
                  style={styles.input}
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </>
            )}

            <button style={styles.primary} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      )}

      {selectedTask && (
        <div style={styles.overlay} onClick={() => setSelectedTask(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.row}>
              <h2>Task Details</h2>
              <button onClick={() => setSelectedTask(null)}>
                <X size={19} />
              </button>
            </div>

            <h3>{selectedTask.title}</h3>
            <p>{selectedTask.description || "No description"}</p>
            <p>Priority: {selectedTask.priority || "MEDIUM"}</p>
            <p>Due Date: {selectedTask.dueDate
              ? new Date(selectedTask.dueDate).toLocaleDateString()
              : "Not set"}</p>
            <p>Assigned: {selectedTask.assignedTo?.name || "Not assigned"}</p>
            <p>Version: {selectedTask.version ?? 0}</p>

            <button style={styles.primary} onClick={() => setSelectedTask(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={`Delete ${confirm.type}?`}
          message="This action cannot be undone."
          onConfirm={handleDelete}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 22,
    background: "#f8fafc",
    color: "#1e293b",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 22
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10
  },
  banner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12
  },
  columns: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    overflowX: "auto",
    padding: "15px 0"
  },
  column: {
    flex: "0 0 290px",
    minHeight: 300,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #e2e8f0"
  },
  card: {
    background: "white",
    padding: 13,
    marginTop: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 9,
    boxShadow: "0 2px 5px #00000008",
    touchAction: "none"
  },
  addButton: {
    width: "100%",
    padding: 10,
    marginTop: 12,
    border: "1px dashed #cbd5e1",
    borderRadius: 7,
    background: "transparent",
    cursor: "pointer"
  },
  primary: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "10px 14px",
    background: "#4f46e5",
    color: "white",
    border: 0,
    borderRadius: 8,
    cursor: "pointer"
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 11,
    border: "1px solid #cbd5e1",
    borderRadius: 7
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    background: "#0f172a88"
  },
  modal: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    maxWidth: 440,
    maxHeight: "90vh",
    overflowY: "auto",
    padding: 22,
    background: "white",
    borderRadius: 12
  },
  muted: {
    padding: 20,
    textAlign: "center",
    color: "#94a3b8"
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 15
  }
};

export default KanbanBoard;
