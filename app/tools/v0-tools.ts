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
      
      // Make the API request
      const response = await fetch(v0Config.apiUrl, {
        method: 'POST',
        headers: v0Config.getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`v0 API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
      }
      
      // Handle streaming response
      if (params.stream) {
        // For MCP, we can't actually stream the response, so we'll collect all chunks
        const reader = response.body?.getReader();
        let result = '';
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Convert the chunk to text
            const chunk = new TextDecoder().decode(value);
            
            // Parse the SSE data
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data:') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.substring(5));
                  if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                    result += data.choices[0].delta.content;
                  }
                } catch (e) {
                  // Ignore parsing errors in SSE data
                }
              }
            }
          }
        }
        
        return {
          content: [
            {
              type: "text" as const,
              text: result
            }
          ],
        };
      } else {
        // Handle regular JSON response
        const data = await response.json();
        
        return {
          content: [
            {
              type: "text" as const,
              text: data.choices[0].message.content
            }
          ],
        };
      }
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
