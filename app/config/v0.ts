/**
 * v0 API configuration
 * 
 * This file configures the v0 API client with the necessary URL and headers.
 */

// v0 API endpoint URL
const V0_API_URL = 'https://api.v0.dev/v1/chat/completions';

// Environment variables accessor (to be populated at runtime)
let apiKey = '';

// Function to set the API key
export const setV0ApiKey = (key: string) => {
  console.log('Setting v0 API key:', key ? `${key.substring(0, 5)}...` : 'undefined or empty');
  apiKey = key;
};

// Export v0 API configuration
export const v0Config = {
  apiUrl: V0_API_URL,
  
  // Function to get headers with API key
  getHeaders: () => {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
};
