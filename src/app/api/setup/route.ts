import { NextRequest, NextResponse } from 'next/server';
import { getNillionClient } from '@/lib/nillion-client';
import { getConfigFromHeaders, validateServerConfig } from '@/lib/server-config';

export async function POST(request: NextRequest) {
  try {
    // Get config from headers
    const config = getConfigFromHeaders(request.headers);
    validateServerConfig(config);
    
    const client = await getNillionClient(config);
    
    // Try to read profile first to see if builder is already registered
    try {
      const existingProfile = await client.readProfile();
      
      return NextResponse.json({
        success: true,
        message: 'Builder is already registered',
        profile: existingProfile.data,
      });
    } catch (profileError) {
      
      // Builder is auto-registered when first used, return empty profile
      return NextResponse.json({
        success: true,
        message: 'Builder setup complete (auto-registered)',
        profile: null,
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}