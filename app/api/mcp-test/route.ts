import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the MCP server with a simple echo request
    console.log('Making request to MCP server...');
    const response = await fetch('http://localhost:3006/transport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'echo',
        input: {
          message: 'Hello, world!'
        }
      }),
    });
    
    console.log('MCP server response status:', response.status, response.statusText);
    const responseText = await response.text();
    console.log('MCP server response text:', responseText);
    
    if (!response.ok) {
      return NextResponse.json({ 
        status: 'error',
        message: `MCP server error: ${response.status} ${response.statusText}`,
        errorDetails: responseText
      }, { status: 500 });
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing MCP server response:', error);
      return NextResponse.json({ 
        status: 'error',
        message: `Failed to parse MCP server response as JSON`,
        errorDetails: responseText
      }, { status: 500 });
    }
    
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
