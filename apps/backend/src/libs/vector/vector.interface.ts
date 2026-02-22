export interface VectorRecord {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface QueryResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface UpsertOptions {
  namespace?: string;
}

export interface QueryOptions {
  namespace?: string;
  topK?: number;
  filter?: Record<string, unknown>;
  includeMetadata?: boolean;
}

export interface DeleteOptions {
  namespace?: string;
}

export interface VectorProvider {
  upsert(records: VectorRecord[], options?: UpsertOptions): Promise<void>;
  query(
    vector: number[],
    options?: QueryOptions,
  ): Promise<QueryResult[]>;
  delete(ids: string[], options?: DeleteOptions): Promise<void>;
  healthCheck(): Promise<{ status: string; latency: number }>;
}

export const VECTOR_PROVIDER = Symbol('VECTOR_PROVIDER');
