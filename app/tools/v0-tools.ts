import { z } from 'zod';
import { v0Config } from '../config/v0';

// Schema for v0 API request
export const v0RequestSchema = z.object({
  prompt: z.string().describe('The prompt to send to the v0 model'),
  model: z.string().default('v0-1.0-md').describe('The v0 model to use'),
  stream: z.boolean().default(false).describe('Whether to stream the response'),
  system_message: z.string().optional().describe('Optional system message to include'),
  max_tokens: z.number().optional().describe('Maximum number of tokens to generate'),
  temperature: z.number().optional().describe('Temperature for response generation'),
});

// Tool implementations
export const v0Tools = {
  /**
   * Call the v0 API and return the response
   */
  async generateCompletion(params: z.infer<typeof v0RequestSchema>) {
    try {
      // Prepare the request payload
      const messages = [];
      
      // Add system message if provided
      if (params.system_message) {
        messages.push({
          role: 'system',
          content: params.system_message
        });
      }
      
      // Add user message with the prompt
      messages.push({
        role: 'user',
        content: params.prompt
      });
      
      const payload = {
        model: params.model,
        messages,
        stream: params.stream
      };
      
      // Add optional parameters if they exist
      if (params.max_tokens) {
        Object.assign(payload, { max_tokens: params.max_tokens });
      }
      
      if (params.temperature) {
        Object.assign(payload, { temperature: params.temperature });
      }
      
      // Log the request for debugging
      console.log('Making v0 API request to:', v0Config.apiUrl);
      console.log('With headers:', JSON.stringify(v0Config.getHeaders(), null, 2));
      console.log('With payload:', JSON.stringify(payload, null, 2));
      
      // Make the API request with manually set headers
      const apiKey = process.env.V0_API_KEY;
      const response = await fetch(v0Config.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Log the response status
      console.log('v0 API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        // Try to get error details
        const errorText = await response.text();
        console.error('v0 API error response:', errorText);
        
        let errorData = null;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Not JSON, use the text directly
        }
        
        throw new Error(`v0 API error: ${response.status} ${response.statusText} ${errorData ? JSON.stringify(errorData) : errorText}`);
      }
      
      // Handle the response
      const data = await response.json();
      console.log('v0 API response data received');
      
      // Extract the content from the response
      let content = '';
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        content = data.choices[0].message.content;
      }
      
      return {
        content: [
          {
            type: "text" as const,
            text: content
          }
        ],
      };
    } catch (error: any) {
      console.error("v0 API error:", error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error calling v0 API: ${error.message || String(error)}`
          }
        ],
      };
    }
  }
};
