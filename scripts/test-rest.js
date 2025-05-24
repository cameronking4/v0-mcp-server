#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const readline = require('readline');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TRANSPORT_PATH = '/transport';

// Utility function to make HTTP requests
function makeRequest(method, url, data) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;

    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP Error: ${res.statusCode} - ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Create a readable interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask questions
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Initialize the MCP session
async function initializeSession() {
  console.log('Initializing MCP session...');
  try {
    const response = await makeRequest('POST', `${BASE_URL}${TRANSPORT_PATH}`, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        clientInfo: {
          name: 'test-rest-client',
          version: '1.0.0'
        }
      }
    });
    
    console.log('Session initialized successfully!');
    return response.result.sessionId;
  } catch (error) {
    console.error('Failed to initialize session:', error);
    process.exit(1);
  }
}

// List available tools
async function listTools(sessionId) {
  console.log('Listing available tools...');
  try {
    const response = await makeRequest('POST', `${BASE_URL}${TRANSPORT_PATH}`, {
      jsonrpc: '2.0',
      id: 2,
      method: 'listTools',
      params: {},
      sessionId
    });
    
    const tools = response.result.tools;
    console.log('Available tools:');
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    
    return tools;
  } catch (error) {
    console.error('Failed to list tools:', error);
    return [];
  }
}

// Call a tool
async function callTool(sessionId, name, args) {
  console.log(`Calling tool: ${name}`);
  try {
    const response = await makeRequest('POST', `${BASE_URL}${TRANSPORT_PATH}`, {
      jsonrpc: '2.0',
      id: 3,
      method: 'callTool',
      params: {
        name,
        arguments: args
      },
      sessionId
    });
    
    return response.result;
  } catch (error) {
    console.error(`Failed to call tool ${name}:`, error);
    return null;
  }
}

// Close the session
async function closeSession(sessionId) {
  console.log('Closing session...');
  try {
    await makeRequest('POST', `${BASE_URL}${TRANSPORT_PATH}`, {
      jsonrpc: '2.0',
      id: 4,
      method: 'close',
      params: {},
      sessionId
    });
    
    console.log('Session closed successfully!');
  } catch (error) {
    console.error('Failed to close session:', error);
  }
}

// Main function
async function main() {
  console.log(`Using MCP server at: ${BASE_URL}${TRANSPORT_PATH}`);
  
  const sessionId = await initializeSession();
  const tools = await listTools(sessionId);
  
  try {
    while (true) {
      console.log('\nAvailable commands:');
      console.log('1 - Echo test');
      console.log('2 - Create Link Token');
      console.log('3 - Exchange Public Token');
      console.log('4 - Get Accounts');
      console.log('5 - Get Transactions');
      console.log('q - Quit');
      
      const command = await ask('\nEnter command: ');
      
      if (command === 'q') {
        break;
      }
      
      let result;
      switch (command) {
        case '1': {
          const message = await ask('Enter message to echo: ');
          result = await callTool(sessionId, 'echo', { message });
          break;
        }
        case '2': {
          const userId = await ask('Enter client user ID (or leave empty for random ID): ');
          result = await callTool(sessionId, 'plaid.createLinkToken', {
            client_name: 'MCP Plaid Test',
            user: { client_user_id: userId || `user-${Date.now()}` },
            products: ['auth', 'transactions'],
            language: 'en',
            country_codes: ['US']
          });
          break;
        }
        case '3': {
          const publicToken = await ask('Enter public token: ');
          result = await callTool(sessionId, 'plaid.exchangePublicToken', { 
            public_token: publicToken 
          });
          break;
        }
        case '4': {
          const accessToken = await ask('Enter access token: ');
          result = await callTool(sessionId, 'plaid.getAccounts', { 
            access_token: accessToken 
          });
          break;
        }
        case '5': {
          const accessToken = await ask('Enter access token: ');
          const startDate = await ask('Enter start date (YYYY-MM-DD) or leave empty for default: ');
          const endDate = await ask('Enter end date (YYYY-MM-DD) or leave empty for default: ');
          
          const args = { access_token: accessToken };
          if (startDate) args.start_date = startDate;
          if (endDate) args.end_date = endDate;
          
          result = await callTool(sessionId, 'plaid.getTransactions', args);
          break;
        }
        default:
          console.log('Unknown command');
          continue;
      }
      
      if (result) {
        console.log('\nResult:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log('\nNo result received');
      }
    }
  } finally {
    await closeSession(sessionId);
    rl.close();
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 