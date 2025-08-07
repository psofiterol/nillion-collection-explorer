import { Keypair } from '@nillion/nuc';
import { SecretVaultBuilderClient, Did } from '@nillion/secretvaults';
import type { NetworkConfigType } from './server-config';

// Server-side Nillion client that accepts config as parameter
export async function getNillionClient(config: NetworkConfigType): Promise<SecretVaultBuilderClient> {
  if (!config.NILLION_API_KEY) {
    throw new Error('NILLION_API_KEY is required - please set it in the Network Configuration settings');
  }

  const builderKeypair = Keypair.from(config.NILLION_API_KEY);
  const builderDid = builderKeypair.toDid().toString();

  // Create builder client
  const builder = await SecretVaultBuilderClient.from({
    keypair: builderKeypair,
    urls: {
      chain: config.NILCHAIN_URL,
      auth: config.NILAUTH_URL,
      dbs: [...config.NILDB_NODES],
    },
    blindfold: {
      operation: 'store',
    },
  });

  await builder.refreshRootToken();

  // One-time registration check (only needed once per builder DID)
  try {
    await builder.readProfile();
  } catch (profileError) {
    try {
      await builder.register({
        did: Did.parse(builderDid),
        name: 'Demo UI Builder',
      });
    } catch (registerError) {
      // Handle case where registration happened concurrently
      if (registerError instanceof Error && registerError.message.includes('duplicate key')) {
        // Already registered, continue
      } else {
        throw registerError;
      }
    }
  }

  return builder;
}

export function getBuilderKeypair(apiKey: string): Keypair {
  return Keypair.from(apiKey);
}

export function getBuilderDid(apiKey: string): string {
  return getBuilderKeypair(apiKey).toDid().toString();
}