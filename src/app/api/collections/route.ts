import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getNillionClient } from '@/lib/nillion-client';
import { getConfigFromHeaders, validateServerConfig } from '@/lib/server-config';
import { Collection } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const config = getConfigFromHeaders(request.headers);
    validateServerConfig(config);
    const client = await getNillionClient(config);

    // Use readCollections to get collection names and basic info
    const collectionsResponse = await client.readCollections();
    const collections = collectionsResponse.data || [];

    // Transform to match expected format
    const formattedCollections = collections.map((collection: any) => ({
      _id: collection.id,
      name: collection.name,
      type: collection.type,
      // No description field - collections don't have descriptions in the nilDB API
      createdAt: new Date().toISOString(), // We don't have real creation date from readCollections
    }));

    return NextResponse.json({
      success: true,
      collections: formattedCollections,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch collections',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = getConfigFromHeaders(request.headers);
    validateServerConfig(config);
    const body = await request.json();
    const { name, type, description, schema } = body as Omit<Collection, '_id'>;


    if (!name || !type || !schema) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, type, schema',
        },
        { status: 400 }
      );
    }

    const client = await getNillionClient(config);
    const collectionId = randomUUID();

    // Use the same schema format as the working script
    const collectionDefinition = {
      _id: collectionId,
      type,
      name,
      schema: schema as unknown as Record<string, unknown>,
    };


    await client.createCollection(collectionDefinition);

    const collection: Collection = {
      _id: collectionDefinition._id,
      type: collectionDefinition.type,
      name: collectionDefinition.name,
      schema,
      description,
      createdAt: new Date().toISOString(),
    };


    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create collection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}