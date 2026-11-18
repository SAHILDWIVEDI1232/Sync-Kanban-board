
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const Tenant = require("../models/Tenant");
const Membership = require("../models/Membership");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true
    }
  });

  // Authenticate socket connection using JWT cookie
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";

      const tokenCookie = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("token="));

      if (!tokenCookie) {
        return next(new Error("Authentication required"));
      }

      const token = decodeURIComponent(
        tokenCookie.substring("token=".length)
      );

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      socket.user = {
        userId: decoded.userId
      };

      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.userId;

    console.log("Socket connected:", userId);

    // Join private user room
    socket.join(`user:${userId}`);

    // Broadcast online users in a tenant
    const broadcastTenantPresence = async (tenantId) => {
      try {
        const roomName = `tenant:${tenantId}`;

        const sockets = await io.in(roomName).fetchSockets();

        const onlineUserIds = [
          ...new Set(
            sockets.map(
              (connectedSocket) => connectedSocket.user.userId
            )
          )
        ];

        io.to(roomName).emit("presence-updated", {
          tenantId,
          onlineUserIds
        });
      } catch (error) {
        console.error("Presence Broadcast Error:", error.message);
      }
    };

    // Join authorized tenant room
    socket.on("join-tenant", async (tenantId) => {
      try {
        if (
          !tenantId ||
          !/^[a-fA-F0-9]{24}$/.test(tenantId)
        ) {
          socket.emit("socket-error", {
            message: "Invalid tenant ID"
          });
          return;
        }

        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
          socket.emit("socket-error", {
            message: "Tenant not found"
          });
          return;
        }

        // Check active Org Admin access
        const orgAdmin = await Membership.findOne({
          userId,
          organizationId: tenant.organizationId,
          tenantId: null,
          role: "ORG_ADMIN",
          status: "ACTIVE"
        });

        // Check tenant membership
        let membership = null;

        if (!orgAdmin) {
          membership = await Membership.findOne({
            userId,
            organizationId: tenant.organizationId,
            tenantId: tenant._id,
            role: {
              $in: ["TENANT_ADMIN", "MEMBER"]
            },
            status: "ACTIVE"
          });
        }

        if (!orgAdmin && !membership) {
          socket.emit("socket-error", {
            message: "You are not authorized to join this tenant"
          });
          return;
        }

        // Leave previous tenant rooms
        const previousTenantRooms = [...socket.rooms].filter(
          (room) => room.startsWith("tenant:")
        );

        for (const room of previousTenantRooms) {
          await socket.leave(room);

          const previousTenantId = room.replace("tenant:", "");

          await broadcastTenantPresence(previousTenantId);
        }

        // Join authorized tenant room
        const roomName = `tenant:${tenant._id}`;

        await socket.join(roomName);

        socket.emit("tenant-joined", {
          success: true,
          tenantId: tenant._id
        });

        // Broadcast updated online users
        await broadcastTenantPresence(tenant._id);

        console.log(
          `User ${userId} joined tenant room ${tenant._id}`
        );
      } catch (error) {
        console.error("Join Tenant Error:", error.message);

        socket.emit("socket-error", {
          message: "Unable to join tenant room"
        });
      }
    });

    // Leave tenant room
    socket.on("leave-tenant", async (tenantId) => {
      try {
        if (
          !tenantId ||
          !/^[a-fA-F0-9]{24}$/.test(tenantId)
        ) {
          return;
        }

        const roomName = `tenant:${tenantId}`;

        await socket.leave(roomName);

        socket.emit("tenant-left", {
          success: true,
          tenantId
        });

        await broadcastTenantPresence(tenantId);
      } catch (error) {
        console.error("Leave Tenant Error:", error.message);
      }
    });

    // Handle disconnect and update tenant presence
    socket.on("disconnecting", async () => {
      try {
        const tenantRooms = [...socket.rooms].filter(
          (room) => room.startsWith("tenant:")
        );

        for (const room of tenantRooms) {
          const tenantId = room.replace("tenant:", "");

          // Current socket is still in the room during disconnecting.
          // Exclude it when calculating remaining online users.
          const sockets = await io.in(room).fetchSockets();

          const onlineUserIds = [
            ...new Set(
              sockets
                .filter(
                  (connectedSocket) => connectedSocket.id !== socket.id
                )
                .map(
                  (connectedSocket) => connectedSocket.user.userId
                )
            )
          ];

          io.to(room).emit("presence-updated", {
            tenantId,
            onlineUserIds
          });
        }
      } catch (error) {
        console.error("Presence Disconnect Error:", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", userId);
    });
  });

  return io;
};

module.exports = initializeSocket;
