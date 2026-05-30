// @ts-nocheck - socket.io types not installed
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
	// DO NOT change the path, it is used by Caddy to forward the request to the correct port
	path: "/",
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
	pingTimeout: 60000,
	pingInterval: 25000,
});

// Store connected users
const connectedUsers = new Map<string, string>(); // socketId -> userId

io.on("connection", (socket) => {
	console.log(`User connected: ${socket.id}`);

	// Handle user authentication
	socket.on("authenticate", (userId: string) => {
		connectedUsers.set(socket.id, userId);
		console.log(`User ${userId} authenticated`);
	});

	// Handle joining notification rooms
	socket.on("join-room", (room: string) => {
		socket.join(room);
		console.log(`Socket ${socket.id} joined room: ${room}`);
	});

	// Handle leaving rooms
	socket.on("leave-room", (room: string) => {
		socket.leave(room);
	});

	// Handle sending notifications
	socket.on(
		"send-notification",
		(data: {
			targetUserId?: string;
			targetRoom?: string;
			notification: {
				id: string;
				type: "application" | "interview" | "message" | "system" | "ai";
				title: string;
				message: string;
				timestamp: string;
				read: boolean;
				link?: string;
			};
		}) => {
			if (data.targetUserId) {
				// Send to specific user
				socket.to(data.targetUserId).emit("notification", data.notification);
			}
			if (data.targetRoom) {
				// Send to room
				socket.to(data.targetRoom).emit("notification", data.notification);
			}
			// Also broadcast to all
			socket.emit("notification-sent", {
				success: true,
				notificationId: data.notification.id,
			});
		},
	);

	// Handle typing indicators
	socket.on(
		"typing",
		(data: { roomId: string; userId: string; isTyping: boolean }) => {
			socket.to(data.roomId).emit("user-typing", data);
		},
	);

	// Handle disconnect
	socket.on("disconnect", () => {
		connectedUsers.delete(socket.id);
		console.log(`User disconnected: ${socket.id}`);
	});

	socket.on("error", (error) => {
		console.error(`Socket error (${socket.id}):`, error);
	});
});

// Simulate periodic notifications for demo purposes
const demoNotifications = [
	{
		type: "application" as const,
		title: "New Application",
		message: "John Doe applied for Senior Frontend Developer",
		link: "/company/applications",
	},
	{
		type: "interview" as const,
		title: "Interview Scheduled",
		message: "Interview with Sarah Chen scheduled for tomorrow at 2 PM",
		link: "/company/interviews",
	},
	{
		type: "message" as const,
		title: "New Message",
		message: "You have a new message from Ahmed Hassan",
		link: "/candidate/messages",
	},
	{
		type: "ai" as const,
		title: "AI Analysis Complete",
		message: "Resume analysis for 5 candidates is ready",
		link: "/company/pipeline",
	},
	{
		type: "system" as const,
		title: "System Update",
		message: "Platform maintenance scheduled for this weekend",
		link: "/admin/health",
	},
];

let notificationIndex = 0;
setInterval(() => {
	const demo = demoNotifications[notificationIndex % demoNotifications.length];
	io.emit("notification", {
		id: `notif-${Date.now()}`,
		...demo,
		timestamp: new Date().toISOString(),
		read: false,
	});
	notificationIndex++;
}, 30000); // Every 30 seconds

const PORT = 3003;
httpServer.listen(PORT, () => {
	console.log(`Notification WebSocket service running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("Received SIGTERM signal, shutting down server...");
	httpServer.close(() => {
		console.log("Notification WebSocket server closed");
		process.exit(0);
	});
});

process.on("SIGINT", () => {
	console.log("Received SIGINT signal, shutting down server...");
	httpServer.close(() => {
		console.log("Notification WebSocket server closed");
		process.exit(0);
	});
});
