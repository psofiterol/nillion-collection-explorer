import { NextRequest, NextResponse } from 'next/server';
import { getNillionClient } from '@/lib/nillion-client';
import { getConfigFromHeaders, validateServerConfig } from '@/lib/server-config';
import { Uuid } from '@nillion/secretvaults';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get config from headers
    const config = getConfigFromHeaders(request.headers);
    validateServerConfig(config);
    
    const client = await getNillionClient(config);
    
    // Get collection metadata (count, size, schema, etc.)
    const collectionId = Uuid.parse(id);
    const metadataResponse = await client.readCollection(collectionId);
    const metadata = metadataResponse.data;
    
    // Get collection name and type from the collections list
    const collectionsResponse = await client.readCollections();
    const collection = collectionsResponse.data?.find((col: any) => col.id === id);
    
    return NextResponse.json({
      success: true,
      metadata: metadata,
      schema: metadata.schema,
      collectionInfo: {
        name: collection?.name,
        type: collection?.type,
      },
      fullResponse: metadataResponse.data
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collection metadata' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get config from headers
    const config = getConfigFromHeaders(request.headers);
    validateServerConfig(config);
    
    const client = await getNillionClient(config);
    
    const collectionId = Uuid.parse(id);
    await client.deleteCollection(collectionId);
    
    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}