import { NextResponse } from 'next/server';
import { v0Config } from '../../config/v0';

export async function GET() {
  try {
    // Check if the v0 API key is set
    const headers = v0Config.getHeaders();
    const hasApiKey = headers.Authorization && headers.Authorization.startsWith('Bearer ');
    
    return NextResponse.json({ 
      status: 'ok',
      v0ApiConfigured: hasApiKey,
      apiUrl: v0Config.apiUrl
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      message: error.message || String(error)
    }, { status: 500 });
  }
}
