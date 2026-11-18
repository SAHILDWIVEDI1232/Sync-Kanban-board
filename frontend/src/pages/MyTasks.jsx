
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/tasks/my")
      .then(res => {
        setTasks(res.data.tasks || []);
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 25 }}>
      <button onClick={() => navigate("/dashboard")}>Back</button>

      <h2>My Tasks</h2>

      {loading && <p>Loading...</p>}

      {!loading && tasks.length === 0 && <p>No tasks assigned to you.</p>}

      {tasks.map(task => (
        <div key={task._id} style={{
          padding: 15,
          margin: 10,
          border: "1px solid #ddd",
          borderRadius: 8
        }}>
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <p>Priority: {task.priority}</p>
        </div>
      ))}
    </div>
  );
}

export default MyTasks;
