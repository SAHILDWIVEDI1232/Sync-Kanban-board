
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ["websocket", "polling"]
});

let activeTenantId = null;

// Automatically join tenant after connection or reconnection
socket.on("connect", () => {
  console.log("Socket connected:", socket.id);

  if (activeTenantId) {
    socket.emit("join-tenant", activeTenantId);
  }
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

export const connectSocket = (tenantId) => {
  if (tenantId) {
    activeTenantId = tenantId;
  }

  if (!socket.connected) {
    socket.connect();
  } else if (activeTenantId) {
    socket.emit("join-tenant", activeTenantId);
  }

  return socket;
};

export const joinTenant = (tenantId) => {
  if (!tenantId) return;

  activeTenantId = tenantId;

  if (socket.connected) {
    socket.emit("join-tenant", tenantId);
  }
};

export const leaveTenant = (tenantId) => {
  if (!tenantId) return;

  if (socket.connected) {
    socket.emit("leave-tenant", tenantId);
  }

  if (activeTenantId === tenantId) {
    activeTenantId = null;
  }
};

export const disconnectSocket = () => {
  activeTenantId = null;

  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
