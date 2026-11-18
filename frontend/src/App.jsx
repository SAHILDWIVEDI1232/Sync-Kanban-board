
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import MyTasks from "./pages/MyTasks";
import Members from "./pages/Members";
import Tenants from "./pages/Tenants";
import Boards from "./pages/Boards";
import KanbanBoard from "./pages/KanbanBoard";
import ActivityLogs from "./pages/ActivityLogs";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/organizations" element={<Organizations />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/members" element={<Members />} />

        <Route path="/tenants" element={<Tenants />} />
        <Route path="/boards" element={<Boards />} />
        <Route path="/kanban" element={<KanbanBoard />} />
        <Route path="/activity-logs" element={<ActivityLogs />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
