import { joinKey, splitKey, StorageAdapter } from "./storage.js";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";

export interface MemoryStorageOptions {
  persist?: string;
}
export function MemoryStorage(input?: MemoryStorageOptions): StorageAdapter {
  const store = [] as [string, Record<string, any>][];

  if (input?.persist) {
    if (existsSync(input.persist)) {
      const file = readFileSync(input?.persist);
      store.push(...JSON.parse(file.toString()));
    }
  }

  async function save() {
    if (!input?.persist) return;
    const file = JSON.stringify(store);
    await writeFile(input.persist, file);
  }

  function search(key: string) {
    let left = 0;
    let right = store.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const comparison = key.localeCompare(store[mid][0]);

      if (comparison === 0) {
        return { found: true, index: mid };
      } else if (comparison < 0) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    return { found: false, index: left };
  }
  return {
    async get(key: string[]) {
      const match = search(joinKey(key));
      if (match.found) {
        return store[match.index][1];
      }
      return;
    },
    async set(key: string[], value: any, ttl?: number) {
      const joined = joinKey(key);
      const match = search(joined);
      store[match.index] = [joined, value];
      await save();
    },
    async remove(key: string[]) {
      const joined = joinKey(key);
      const match = search(joined);
      if (match.found) {
        store.splice(match.index, 1);
      }
      await save();
    },
    async *scan(prefix: string[]) {
      for (const [key, value] of store) {
        if (key.startsWith(joinKey(prefix))) {
          yield [splitKey(key), value];
        }
      }
    },
  };
}
