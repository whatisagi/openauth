import { joinKey, StorageAdapter } from "./storage.js";
import { AwsClient } from "aws4fetch";

interface DynamoStorageOptions {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region?: string;
  table: string;
  pk?: string;
  sk?: string;
}

export function DynamoStorage(options: DynamoStorageOptions): StorageAdapter {
  const client = new AwsClient({
    ...options,
    service: "dynamodb",
  });

  function parseKey(key: string[]) {
    if (key.length === 2) {
      return {
        pk: joinKey(key),
        sk: "value",
      };
    }

    return {
      pk: joinKey(key.slice(0, 2)),
      sk: joinKey(key.slice(2)),
    };
  }

  return {
    async get(key: string[]) {},

    async set(key: string[], value: any) {},

    async remove(key: string[]) {},

    async *scan(prefix: string[]) {},
  };
}
