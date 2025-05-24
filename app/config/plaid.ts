import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Plaid configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

// Create and export the Plaid client
export const plaidClient = new PlaidApi(configuration); 