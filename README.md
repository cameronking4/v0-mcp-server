# v0 API MCP Server for Vercel

This project implements a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for integrating with the v0 API. Built on Vercel's Next.js platform, it provides AI assistants with tools to interact with the v0 API through a secure, standardized interface.

## Features

- **v0 API Integration**: Generate text using the v0-1.0-md model
- **MCP-Compliant**: Implements the Model Context Protocol for AI assistant integration
- **Vercel Deployment**: Easy deployment to Vercel's serverless platform

## Available Tools

This MCP server exposes the following tools:

### `echo`
A simple tool for testing - echoes back the provided message.

### `v0.generateCompletion`
Generates text using the v0 API. This tool allows you to send prompts to the v0-1.0-md model and receive responses.

Parameters:
- `prompt` (required): The prompt to send to the v0 model
- `model` (optional, default: "v0-1.0-md"): The v0 model to use
- `stream` (optional, default: false): Whether to stream the response
- `system_message` (optional): Optional system message to include
- `max_tokens` (optional): Maximum number of tokens to generate
- `temperature` (optional): Temperature for response generation

## Setup

### Prerequisites

- Node.js (16.x or higher)
- A v0 API key
- A Vercel account for deployment
- Redis instance (e.g., Upstash Redis)

### Environment Variables

Create a `.env` file with the following variables:

```
V0_API_KEY=your_v0_api_key
REDIS_URL=your_redis_url
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

### Testing the MCP Server

The repository includes test clients that can be used to interact with the MCP server locally:

```bash
# Start the MCP server
npm run dev

# In another terminal, run the test client
npm run test-client

# Or test the v0 API specifically
npm run test-v0
```

### Deployment

Deploy to Vercel:

```bash
vercel
```

## Usage

This MCP server can be used with any MCP-compatible client, such as Claude with MCP capabilities. The server will be available at:

```
https://your-vercel-app.vercel.app/transport
```

## Troubleshooting

### "Error calling v0 API: Request failed with status code 401"

If you encounter this error when calling the v0 API, there are several possible causes:

1. **Invalid API Key**: Verify that your v0 API key is correct and properly set in the environment variables.

2. **API Key Permissions**: Ensure your API key has the necessary permissions to use the v0 API.

3. **Missing Required Fields**: When calling `v0.generateCompletion`, ensure you include all required fields:
   ```json
   {
     "prompt": "Your prompt here",
     "model": "v0-1.0-md"
   }
   ```

4. **Rate Limiting**: The v0 API has usage limits. Check if you've exceeded your quota.

For more detailed error information, check the server logs for the full error response from the v0 API.

## License

MIT
