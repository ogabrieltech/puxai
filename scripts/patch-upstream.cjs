const fs = require("node:fs");
function edit(path, transform) {
  const old = fs.readFileSync(path, "utf8");
  const updated = transform(old);
  if (updated === old) throw new Error("No changes made: " + path);
  fs.writeFileSync(path, updated);
}
function replaceRequired(s, before, after, label) {
  if (!s.includes(before)) throw new Error("Source drift in " + label + ": " + before);
  return s.replace(before, after);
}
// Do not send details of the deployed installation to upstream monitoring.
edit("src/server/index.ts", (s) => {
  const a = s.indexOf("    // --- WA-AKG Monitor Heartbeat ---");
  const marker = "    // --------------------------------";
  const b = s.indexOf(marker, a);
  if (a < 0 || b < 0) throw new Error("Upstream heartbeat source changed; review required.");
  return s.slice(0,a) + s.slice(b + marker.length);
});
// Default to closed registration.
edit("prisma/schema.prisma", (s) => {
  s = replaceRequired(s, 'appName            String   @default("WA-AKG")', 'appName            String   @default("ogabrieltechIA")', "schema appName");
  return replaceRequired(s, "enableRegistration Boolean  @default(true)", "enableRegistration Boolean  @default(false)", "schema registration");
});
// Prevent registration before an admin config record exists.
edit("src/app/api/auth/register/route.ts", (s) =>
  replaceRequired(s, "if (systemConfig && systemConfig.enableRegistration === false)", "if (!systemConfig || systemConfig.enableRegistration !== true)", "register route")
);
// Ensure initial branding and that registration stays closed on every boot.
edit("scripts/setup-admin.js", (s) =>
  replaceRequired(s, "    const existingUser = await prisma.user.findUnique({", 
  '    await prisma.systemConfig.upsert({ where: { id: "default" }, create: { id: "default", appName: "ogabrieltechIA", enableRegistration: false, timezone: "America/Sao_Paulo" }, update: { appName: "ogabrieltechIA", enableRegistration: false, timezone: "America/Sao_Paulo" } });\n\n    const existingUser = await prisma.user.findUnique({', "admin initialization")
);
// Brand colors; app-specific UI remains forked upstream for now.
edit("src/app/globals.css", (s) => s + '\n/* ogabrieltechIA brand */\n:root { --primary:#6d28d9; --primary-foreground:#ffffff; --ring:#6d28d9; --sidebar-primary:#6d28d9; --sidebar-ring:#6d28d9; }\n.dark { --primary:#a78bfa; --primary-foreground:#1c1233; --ring:#a78bfa; --sidebar-primary:#a78bfa; --sidebar-ring:#a78bfa; }\n');

// Restrict Socket.IO to authenticated sessions with room-level authorization.
edit("src/server/socket.ts", (_s) => "import { Server } from \"socket.io\";\nimport { getToken } from \"next-auth/jwt\";\nimport { prisma } from \"../lib/prisma\";\nimport { logger } from \"../lib/logger\";\n\nexport function setupSocket(io: Server) {\n  io.use(async (socket, next) => {\n    try {\n      const token = await getToken({ req: { headers: { cookie: socket.handshake.headers.cookie || \"\" } }, secret: process.env.AUTH_SECRET!, secureCookie: process.env.NODE_ENV === \"production\" });\n      if (!token?.id || typeof token.id !== \"string\") return next(new Error(\"Unauthorized\"));\n      socket.data.userId = token.id;\n      socket.data.role = typeof token.role === \"string\" ? token.role : \"\";\n      next();\n    } catch (e) {\n      next(new Error(\"Unauthorized\"));\n    }\n  });\n\n  io.on(\"connection\", (socket) => {\n    socket.on(\"join-session\", async (sessionId: unknown) => {\n      if (typeof sessionId !== \"string\" || sessionId.length > 128) return;\n      try {\n        const session = await prisma.session.findUnique({ where: { sessionId }, select: { id: true, userId: true } });\n        if (!session) return;\n        const userId = socket.data.userId as string;\n        const isAdmin = socket.data.role === \"SUPERADMIN\";\n        const isOwner = session.userId === userId;\n        const shared = !isOwner && !isAdmin ? await prisma.sessionAccess.findFirst({ where: { userId, sessionId: session.id }, select: { id: true } }) : null;\n        if (isOwner || isAdmin || !!shared) socket.join(sessionId);\n      } catch (e) { logger.warn(\"Socket\", \"Session subscription rejected\"); }\n    });\n    socket.on(\"join-user-room\", (userId: unknown) => {\n      if (typeof userId === \"string\" && userId === socket.data.userId) socket.join(`user:${userId}`);\n    });\n    socket.on(\"disconnect\", () => logger.debug(\"Socket\", \"Client disconnected\"));\n  });\n}\n");
edit("src/server/index.ts", (s) => replaceRequired(s, 'origin: "*"', 'origin: process.env.BASE_URL || false', "socket CORS"));

console.log("ogabrieltechIA privacy, registration and branding patches applied.");
