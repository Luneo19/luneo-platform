/**
 * Utility Types - Types utilitaires pour remplacer 'any'
 * Fournit des types génériques et sûrs pour remplacer les usages de 'any'
 */

/**
 * Type pour les objets JSON génériques
 * Utilisé pour les métadonnées, configurations, etc.
 */
export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonObject 
  | JsonArray;

export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

/**
 * Type pour les objets avec clés string et valeurs inconnues
 * Plus sûr que 'any' car force la vérification des propriétés
 */
export type RecordString<T = unknown> = Record<string, T>;

/**
 * Type pour les objets partiels (toutes les propriétés optionnelles)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Type pour les objets avec certaines propriétés requises
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Type pour les objets avec certaines propriétés optionnelles
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type pour les fonctions génériques
 */
export type AnyFunction = (...args: unknown[]) => unknown;

/**
 * Type pour les constructeurs génériques
 */
export type AnyConstructor = new (...args: unknown[]) => unknown;

/**
 * Type pour les valeurs primitives
 */
export type Primitive = string | number | boolean | null | undefined;

/**
 * Type pour les valeurs non-null
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Type pour extraire le type de retour d'une fonction
 */
export type ReturnType<T extends AnyFunction> = T extends (...args: unknown[]) => infer R ? R : never;

/**
 * Type pour extraire les paramètres d'une fonction
 */
export type Parameters<T extends AnyFunction> = T extends (...args: infer P) => unknown ? P : never;

/**
 * Type pour les objets avec métadonnées
 */
export interface WithMetadata<T = JsonValue> {
  metadata?: Record<string, T>;
}

/**
 * Type pour les objets avec timestamps
 */
export interface WithTimestamps {
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
}

/**
 * Type pour les objets avec ID
 */
export interface WithId {
  id: string;
}

/**
 * Type pour les objets paginés
 */
export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Type pour les réponses API standardisées
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: JsonObject;
}

/**
 * Type pour les filtres de requête génériques
 */
export interface QueryFilters {
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}

/**
 * Type pour les options de tri
 */
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

/**
 * Type pour les options de pagination
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

/**
 * Type pour les résultats de validation
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

/**
 * Type pour les erreurs structurées
 */
export interface StructuredError {
  code: string;
  message: string;
  field?: string;
  details?: JsonObject;
}

/**
 * Type pour les callbacks génériques
 */
export type Callback<T = unknown> = (data: T) => void | Promise<void>;

/**
 * Type pour les promesses génériques
 */
export type PromiseResult<T, E = Error> = Promise<T> | Promise<{ success: true; data: T } | { success: false; error: E }>;

/**
 * Type helper pour rendre un type nullable
 */
export type Nullable<T> = T | null;

/**
 * Type helper pour rendre un type optionnel
 */
export type Optional<T> = T | undefined;

/**
 * Type helper pour rendre un type nullable et optionnel
 */
export type Maybe<T> = T | null | undefined;

/**
 * Type pour les valeurs d'enum dynamiques
 */
export type EnumValue<T> = T[keyof T];

/**
 * Type pour les clés d'objet
 */
export type ObjectKeys<T> = keyof T;

/**
 * Type pour les valeurs d'objet
 */
export type ObjectValues<T> = T[keyof T];

/**
 * Type pour les entrées d'objet (key-value pairs)
 */
export type ObjectEntries<T> = Array<[keyof T, T[keyof T]]>;

/**
 * Type pour les objets avec des clés spécifiques
 */
export type KeyValuePair<K extends string = string, V = unknown> = {
  key: K;
  value: V;
};

/**
 * Type pour les configurations génériques
 */
export interface Config {
  [key: string]: JsonValue;
}

/**
 * Type pour les options génériques
 */
export interface Options {
  [key: string]: unknown;
}

/**
 * Type pour les métadonnées génériques
 */
export type Metadata = Record<string, JsonValue>;

/**
 * Type pour les paramètres de requête HTTP
 */
export interface HttpQueryParams extends Record<string, string | string[] | undefined> {}

/**
 * Type pour les headers HTTP
 */
export interface HttpHeaders extends Record<string, string | string[] | undefined> {}

/**
 * Type pour les corps de requête HTTP
 */
export type HttpBody = JsonValue | FormData | Blob | ArrayBuffer;

/**
 * Type pour les réponses HTTP
 */
export interface HttpResponse<T = unknown> {
  status: number;
  statusText: string;
  data: T;
  headers: HttpHeaders;
}

/**
 * Type pour les erreurs HTTP
 */
export interface HttpError {
  status: number;
  statusText: string;
  message: string;
  data?: JsonValue;
}

/**
 * Type pour les événements génériques
 */
export interface Event<T = unknown> {
  type: string;
  payload: T;
  timestamp: Date;
  source?: string;
}

/**
 * Type pour les handlers d'événements
 */
export type EventHandler<T = unknown> = (event: Event<T>) => void | Promise<void>;

/**
 * Type pour les transformations de données
 */
export type Transformer<TInput, TOutput> = (input: TInput) => TOutput | Promise<TOutput>;

/**
 * Type pour les validateurs
 */
export type Validator<T = unknown> = (value: T) => boolean | ValidationResult;

/**
 * Type pour les formatters
 */
export type Formatter<T = unknown> = (value: T) => string;

/**
 * Type pour les parsers
 */
export type Parser<TInput = string, TOutput = unknown> = (input: TInput) => TOutput;

/**
 * Type pour les comparateurs
 */
export type Comparator<T = unknown> = (a: T, b: T) => number;

/**
 * Type pour les filtres
 */
export type Filter<T = unknown> = (value: T) => boolean;

/**
 * Type pour les mappers
 */
export type Mapper<TInput, TOutput> = (input: TInput) => TOutput;

/**
 * Type pour les reducers
 */
export type Reducer<TInput, TOutput = TInput> = (accumulator: TOutput, current: TInput) => TOutput;

