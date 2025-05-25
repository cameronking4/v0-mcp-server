import { NextResponse } from 'next/server';
import { v0Config } from '../../config/v0';

export async function GET(request: Request) {
  // Log the environment variables for debugging
  console.log('Environment variables:', {
    V0_API_KEY: process.env.V0_API_KEY ? `${process.env.V0_API_KEY.substring(0, 5)}...` : 'undefined',
  });
  try {
    // Check if the v0 API key is set
    const headers = v0Config.getHeaders();
    console.log('v0Config headers:', {
      Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 15)}...` : 'undefined',
    });
    const hasApiKey = headers.Authorization && headers.Authorization.startsWith('Bearer ');
    
    if (!hasApiKey) {
      return NextResponse.json({ 
        status: 'error',
        message: 'V0 API key is not set'
      }, { status: 400 });
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
          content: 'Say hello world'
        }
      ],
      stream: false
    };
    
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
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        status: 'error',
        message: `v0 API error: ${response.status} ${response.statusText}`,
        errorDetails: errorText
      }, { status: 500 });
    }
    
    const data = await response.json();
    
    return NextResponse.json({ 
      status: 'ok',
      data
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      message: error.message || String(error)
    }, { status: 500 });
  }
}
