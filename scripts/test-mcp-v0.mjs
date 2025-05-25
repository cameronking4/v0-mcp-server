#!/usr/bin/env node

/**
 * Test script for the v0 API tool via MCP server
 * 
 * Usage:
 *   node scripts/test-mcp-v0.mjs
 */

// Configuration
const MCP_SERVER_URL = 'http://localhost:3006/transport';
const V0_PROMPT = 'Create a Next.js AI chatbot with authentication';

async function main() {
  try {
    console.log('Testing MCP server with v0.generateCompletion tool...');
    
    // First, test if the server is running with a simple echo request
    console.log('Testing echo tool first...');
    const echoResponse = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'echo',
        input: {
          message: 'Hello, world!'
        }
      }),
    });
    
    const echoResponseText = await echoResponse.text();
    
    if (!echoResponse.ok) {
      throw new Error(`Server not responding correctly. Status: ${echoResponse.status} ${echoResponse.statusText}. Response: ${echoResponseText}`);
    }
    
    let echoData;
    try {
      echoData = JSON.parse(echoResponseText);
    } catch (error) {
      console.error('Error parsing echo response:', error);
      console.log('Raw response text:', echoResponseText);
      throw new Error(`Failed to parse echo response as JSON. Raw response: ${echoResponseText}`);
    }
    console.log('Echo response:', echoData);
    
    // Now test the v0.generateCompletion tool
    console.log('\nNow testing v0.generateCompletion tool...');
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'v0.generateCompletion',
        input: {
          prompt: V0_PROMPT,
          model: 'v0-1.0-md',
          stream: false,
          system_message: 'You are a helpful assistant that provides concise code examples.'
        }
      }),
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`v0 API error. Status: ${response.status} ${response.statusText}. Response: ${responseText}`);
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing v0 response:', error);
      console.log('Raw response text:', responseText);
      throw new Error(`Failed to parse v0 response as JSON. Raw response: ${responseText}`);
    }
    console.log('Response from v0 API:');
    console.log(JSON.stringify(data, null, 2));
    
    // Extract the text content from the response
    if (data.content && data.content.length > 0) {
      const textContent = data.content.find(item => item.type === 'text');
      if (textContent) {
        console.log('\nGenerated text:');
        console.log(textContent.text);
      }
    }
    
  } catch (error) {
    console.error('Error testing v0 API:', error);
  }
}

main();
