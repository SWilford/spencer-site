// This repository targets Node 22.20; @types/node 20 omits this native module.
declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(filename: string, options?: { readOnly?: boolean });
    exec(sql: string): void;
    close(): void;
    prepare(sql: string): {
      all(...args: (string | number | null)[]): Record<string, string | number | null>[];
      get(...args: (string | number | null)[]): Record<string, string | number | null> | undefined;
      run(...args: (string | number | null)[]): unknown;
    };
  }
}
