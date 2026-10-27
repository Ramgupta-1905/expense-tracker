import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataFile = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "store.json");
const initialStore = { transactions: [], categories: [] };

function ensureStore() {
  mkdirSync(dirname(dataFile), { recursive: true });
  if (!existsSync(dataFile)) writeFileSync(dataFile, JSON.stringify(initialStore, null, 2));
}

export function readStore() {
  ensureStore();
  return JSON.parse(readFileSync(dataFile, "utf8"));
}

export function updateStore(update) {
  const store = readStore();
  const updatedStore = update(store);
  const temporaryFile = `${dataFile}.tmp`;
  writeFileSync(temporaryFile, JSON.stringify(updatedStore, null, 2));
  renameSync(temporaryFile, dataFile);
  return updatedStore;
}
