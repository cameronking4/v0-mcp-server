#!/usr/bin/env node

import { Client, HttpClientTransport } from "@modelcontextprotocol/sdk";
import readline from "readline/promises";
import { randomUUID } from 'crypto';

async function main() {
  const baseUrl = process.argv[2] || "http://localhost:3000";
  const transport = new HttpClientTransport({
    baseUrl: `${baseUrl}/transport`,
  });

  const client = new Client({
    name: "mcp-plaid-test-client",
    version: "1.0.0",
  });

  try {
    await client.connect(transport);
    console.log("Connected to MCP server!");

    const toolsResult = await client.listTools();
    console.log("Available tools:", toolsResult.tools.map(tool => tool.name));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    while (true) {
      console.log("\nAvailable commands:");
      console.log("1 - Echo test");
      console.log("2 - Create Link Token");
      console.log("3 - Exchange Public Token");
      console.log("4 - Get Accounts");
      console.log("5 - Get Transactions");
      console.log("q - Quit");

      const command = await rl.question("\nEnter command: ");

      if (command === "q") {
        break;
      }

      let result;
      try {
        switch (command) {
          case "1":
            const message = await rl.question("Enter message to echo: ");
            result = await client.callTool({ name: "echo", arguments: { message } });
            break;
          case "2":
            const userIdInput = await rl.question("Enter client user ID (or leave empty for random ID): ");
            const userId = userIdInput || randomUUID();
            
            console.log(`Using client_user_id: ${userId}`);
            
            result = await client.callTool({
              name: "plaid.createLinkToken",
              arguments: {
                client_name: "MCP Plaid Test",
                user: { client_user_id: userId },
                products: ["auth", "transactions"],
                language: "en",
                country_codes: ["US"]
              },
            });
            break;
          case "3":
            const publicToken = await rl.question("Enter public token: ");
            result = await client.callTool({
              name: "plaid.exchangePublicToken",
              arguments: { public_token: publicToken },
            });
            break;
          case "4":
            const accountsToken = await rl.question("Enter access token: ");
            result = await client.callTool({
              name: "plaid.getAccounts",
              arguments: { access_token: accountsToken },
            });
            break;
          case "5":
            const txToken = await rl.question("Enter access token: ");
            const startDate = await rl.question("Enter start date (YYYY-MM-DD) or leave empty for default: ");
            const endDate = await rl.question("Enter end date (YYYY-MM-DD) or leave empty for default: ");
            
            const args = { access_token: txToken };
            if (startDate) args.start_date = startDate;
            if (endDate) args.end_date = endDate;
            
            result = await client.callTool({
              name: "plaid.getTransactions",
              arguments: args,
            });
            break;
          default:
            console.log("Unknown command");
            continue;
        }

        if (result && result.content) {
          console.log("\nResult:", result.content);
        } else {
          console.log("\nEmpty or invalid result from server");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }

    rl.close();
  } catch (error) {
    console.error("Error connecting to MCP server:", error);
  } finally {
    await client.close();
  }
}

main().catch(console.error); 