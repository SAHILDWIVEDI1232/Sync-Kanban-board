
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const initializeSocket = require("./sockets/socket");

// Routes
const authRoutes = require("./routes/auth.routes");
const organizationRoutes = require("./routes/organization.routes");
const tenantRoutes = require("./routes/tenant.routes");
const boardRoutes = require("./routes/board.routes");
const columnRoutes = require("./routes/column.routes");
const taskRoutes = require("./routes/task.routes");
const membershipRoutes = require("./routes/membership.routes");
const activityLogRoutes = require("./routes/activityLog.routes");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io available in controllers through req.app.get("io")
app.set("io", io);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SyncBoard API is running",
    realtime: "Socket.IO enabled"
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/activity-logs", activityLogRoutes);

// Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});

// Global Error Handler
app.use((error, req, res, next) => {
  console.error("Global Error:", error);

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error"
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("Socket.IO is ready");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
