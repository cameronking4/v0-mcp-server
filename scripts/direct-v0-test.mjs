#!/usr/bin/env node

/**
 * Direct test script for the v0 API
 * 
 * This script directly calls the v0 API without going through the MCP server.
 * 
 * Usage:
 *   node scripts/direct-v0-test.mjs
 */

// Use built-in fetch API
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env file manually
const loadEnv = () => {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envVars[key] = value;
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error loading .env file:', error);
    return {};
  }
};

const env = loadEnv();

// Configuration
const V0_API_URL = 'https://api.v0.dev/v1/chat/completions';
const MCP_SERVER_URL = 'http://localhost:3006/transport'; // For reference
const V0_API_KEY = env.V0_API_KEY;
const V0_PROMPT = 'Create a Next.js AI chatbot with authentication';

async function main() {
  try {
    console.log('Testing direct v0 API call...');
    console.log('API Key available:', !!V0_API_KEY);
    
    if (!V0_API_KEY) {
      throw new Error('V0_API_KEY environment variable is not set!');
    }
    
    // Prepare the request payload
    const payload = {
      model: 'v0-1.0-md',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides concise code examples.'
        },
        {
          role: 'user',
          content: V0_PROMPT
        }
      ],
      stream: false
    };
    
    console.log('Making v0 API request to:', V0_API_URL);
    console.log('With payload:', JSON.stringify(payload, null, 2));
    
    // Make the API request
    const response = await fetch(V0_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${V0_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('v0 API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('v0 API error response:', errorText);
      throw new Error(`v0 API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response from v0 API:');
    console.log(JSON.stringify(data, null, 2));
    
    // Extract the text content from the response
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      console.log('\nGenerated text:');
      console.log(data.choices[0].message.content);
    }
    
  } catch (error) {
    console.error('Error testing v0 API:', error);
  }
}

main();
