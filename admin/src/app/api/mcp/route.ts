import { createAdminMcpHandler } from "@/features/mcp/server/create-handler";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const handler = createAdminMcpHandler();

export { handler as GET, handler as POST, handler as DELETE };
