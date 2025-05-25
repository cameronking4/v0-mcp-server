import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { v0Tools, v0RequestSchema } from "../tools/v0-tools";
import { setV0ApiKey } from "../config/v0";
import { NextResponse } from 'next/server';

// Create a custom handler function
const customHandler = async (request: Request) => {
  console.log('Received request to transport endpoint');
  
  try {
    // Parse the request body
    const body = await request.json();
    console.log('Request body:', body);
    
    // Handle echo tool
    if (body.tool === 'echo') {
      console.log('Echo tool called with message:', body.input.message);
      return NextResponse.json({
        content: [{ type: "text", text: `Tool echo: ${body.input.message}` }],
      });
    }
    
    // Handle v0.generateCompletion tool
    if (body.tool === 'v0.generateCompletion') {
      console.log('v0.generateCompletion tool called with args:', body.input);
      const result = await v0Tools.generateCompletion(body.input);
      return NextResponse.json(result);
    }
    
    // Unknown tool
    return NextResponse.json({
      content: [{ type: "text", text: `Unknown tool: ${body.tool}` }],
    }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling request:', error);
    return NextResponse.json({
      content: [{ type: "text", text: `Error: ${error.message || String(error)}` }],
    }, { status: 500 });
  }
};

const handler = createMcpHandler(
  (server) => {
    // Echo tool (for testing)
    server.tool(
      "echo",
      "Echo a message",
      { message: z.string().describe('Message to echo') },
      async ({ message }) => {
        console.log('Echo tool called with message:', message);
        return {
          content: [{ type: "text", text: `Tool echo: ${message}` }],
        };
      }
    );

    // Set the v0 API key from environment
    const v0ApiKey = process.env.V0_API_KEY;
    console.log('V0_API_KEY environment variable exists:', !!v0ApiKey);
    
    if (v0ApiKey) {
      setV0ApiKey(v0ApiKey);
      console.log('V0 API key set successfully');
    } else {
      console.error('V0_API_KEY environment variable is not set!');
    }

    // v0 API tool
    server.tool(
      "v0.generateCompletion",
      "Generate text using the v0 API",
      v0RequestSchema.shape,
      async (args) => {
        console.log('v0.generateCompletion tool called with args:', args);
        return v0Tools.generateCompletion(args);
      }
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

// Add a health check endpoint
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.endsWith('/health')) {
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
  return handler(request);
}

// Use our custom handler for POST requests
export async function POST(request: Request) {
  console.log('POST request to transport endpoint');
  return customHandler(request);
}

export { handler as DELETE };
