#!/usr/bin/env node

/**
 * Test script for the v0 API tool
 * 
 * Usage:
 *   node scripts/test-v0.mjs
 */

import fetch from 'node-fetch';

// Configuration
const MCP_SERVER_URL = 'http://localhost:3006/transport';
const V0_PROMPT = 'Create a Next.js AI chatbot with authentication';

async function main() {
  try {
    console.log('Testing v0.generateCompletion tool...');
    
    // Call the v0.generateCompletion tool
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
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
