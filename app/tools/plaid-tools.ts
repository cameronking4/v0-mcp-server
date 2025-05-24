import { z } from 'zod';
import { plaidClient } from '../config/plaid';
import type { CountryCode, Products, LinkTokenCreateRequest } from 'plaid';
import crypto from 'crypto';

// Schemas for tool inputs
export const createLinkTokenSchema = z.object({
  client_name: z.string().default('MCP Plaid Integration'),
  language: z.string().default('en'),
  country_codes: z.array(z.enum(['US', 'CA', 'GB', 'FR', 'ES', 'IE', 'NL', 'DE'])).default(['US']),
  user: z.object({
    client_user_id: z.string().describe('A unique ID for the user')
  }),
  products: z.array(
    z.enum(['transactions', 'auth', 'identity', 'income', 'assets', 'investments'])
  ).default(['transactions']),
  webhook: z.string().optional(),
  redirect_uri: z.string().optional(),
});

export const exchangePublicTokenSchema = z.object({
  public_token: z.string().describe('The public token from Plaid Link')
});

export const getAccountsSchema = z.object({
  access_token: z.string().describe('The access token for the linked account')
});

export const getTransactionsSchema = z.object({
  access_token: z.string().describe('The access token for the linked account'),
  start_date: z.string().default(() => {
    // Default to 30 days ago
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }),
  end_date: z.string().default(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  })
});

// Tool implementations
export const plaidTools = {
  /**
   * Create a link token for initializing Plaid Link
   */
  async createLinkToken(params: z.infer<typeof createLinkTokenSchema>) {
    try {
      // Ensure client_user_id doesn't contain special characters that could cause issues
      // If it's an email, hash it to create a consistent ID
      let clientUserId = params.user.client_user_id;
      if (clientUserId.includes('@')) {
        clientUserId = crypto
          .createHash('md5')
          .update(clientUserId)
          .digest('hex');
      }

      const createParams: LinkTokenCreateRequest = {
        user: {
          client_user_id: clientUserId
        },
        client_name: params.client_name || 'MCP Plaid Integration',
        language: params.language || 'en',
        country_codes: (params.country_codes || ['US']) as CountryCode[],
        products: (params.products || ['transactions']) as Products[],
      };
      
      // Add optional parameters if they exist
      if (params.webhook) {
        createParams.webhook = params.webhook;
      }
      
      if (params.redirect_uri) {
        createParams.redirect_uri = params.redirect_uri;
      }
      
      // Add debugging for Sandbox mode
      if (process.env.NODE_ENV !== 'production') {
        console.log("Creating link token with params:", JSON.stringify(createParams, null, 2));
      }
      
      const response = await plaidClient.linkTokenCreate(createParams);
      
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              link_token: response.data.link_token,
              expiration: response.data.expiration
            }, null, 2)
          }
        ],
      };
    } catch (error: any) {
      console.error("Plaid error details:", error.response?.data || error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error creating link token: ${error.response?.data?.error_message || error.message || String(error)}`
          }
        ],
      };
    }
  },
  
  /**
   * Exchange a public token for an access token
   */
  async exchangePublicToken(params: z.infer<typeof exchangePublicTokenSchema>) {
    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: params.public_token
      });
      
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              access_token: response.data.access_token,
              item_id: response.data.item_id
            }, null, 2)
          }
        ],
      };
    } catch (error: any) {
      console.error("Plaid error details:", error.response?.data || error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error exchanging token: ${error.response?.data?.error_message || error.message || String(error)}`
          }
        ],
      };
    }
  },
  
  /**
   * Get accounts for a linked item
   */
  async getAccounts(params: z.infer<typeof getAccountsSchema>) {
    try {
      const response = await plaidClient.accountsGet({
        access_token: params.access_token
      });
      
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2)
          }
        ],
      };
    } catch (error: any) {
      console.error("Plaid error details:", error.response?.data || error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error getting accounts: ${error.response?.data?.error_message || error.message || String(error)}`
          }
        ],
      };
    }
  },
  
  /**
   * Get transactions for an account
   */
  async getTransactions(params: z.infer<typeof getTransactionsSchema>) {
    try {
      const response = await plaidClient.transactionsGet({
        access_token: params.access_token,
        start_date: params.start_date,
        end_date: params.end_date,
        options: {
          count: 100,
          offset: 0
        }
      });
      
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(response.data, null, 2)
          }
        ],
      };
    } catch (error: any) {
      console.error("Plaid error details:", error.response?.data || error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error getting transactions: ${error.response?.data?.error_message || error.message || String(error)}`
          }
        ],
      };
    }
  }
}; 