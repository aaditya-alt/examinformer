import { CBTTest } from './types/cbt';

// In-memory cache for actively loaded / dynamically registered tests
export const testsStore = new Map<string, CBTTest>();

export function registerNewTest(newTest: CBTTest): boolean {
  if (!newTest || !newTest.id || !newTest.title) return false;
  testsStore.set(newTest.id, newTest);
  return true;
}

export function deleteTest(id: string): boolean {
  return testsStore.delete(id);
}
