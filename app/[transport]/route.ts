import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { v0Tools, v0RequestSchema } from "../tools/v0-tools";
import { setV0ApiKey } from "../config/v0";
import { NextResponse } from 'next/server';

const handler = createMcpHandler(
  (server) => {
    // Echo tool (for testing)
    server.tool(
      "echo",
      "Echo a message",
      { message: z.string() },
      async ({ message }) => ({
        content: [{ type: "text", text: `Tool echo: ${message}` }],
      })
    );

    // Set the v0 API key from environment
    if (process.env.V0_API_KEY) {
      setV0ApiKey(process.env.V0_API_KEY);
    }

    // v0 API tool
    server.tool(
      "v0.generateCompletion",
      "Generate text using the v0 API",
      v0RequestSchema.shape,
      async (args) => v0Tools.generateCompletion(args)
    );
  },
  {
    capabilities: {
      tools: {
        echo: {
          description: "Echo a message",
        },
        "v0.generateCompletion": {
          description: "Generate text using the v0 API",
        },
      },
    },
  },
  {
    redisUrl: process.env.REDIS_URL,
    basePath: "/transport",
    verboseLogs: true,
    maxDuration: 60,
  }
);

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export { handler as GET, handler as POST, handler as DELETE };
