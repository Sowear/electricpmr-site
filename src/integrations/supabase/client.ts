type JsonRecord = Record<string, unknown>;

export type AuthUser = {
  id: string;
  email: string;
  phone?: string | null;
  created_at?: string;
  user_metadata?: JsonRecord;
};

export type AuthSession = {
  access_token: string;
  expires_at: string;
  user: AuthUser;
};

type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED";

type QueryFilter =
  | { op: "eq" | "gte" | "lte"; column: string; value: unknown }
  | { op: "in"; column: string; value: unknown[] }
  | { op: "or"; expression: string };

type QueryOrder = {
  column: string;
  ascending: boolean;
};

type ApiEnvelope<T> = {
  data: T | null;
  error: ApiError | null;
  count?: number | null;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const SESSION_STORAGE_KEY = "electricpmr.cloudflare.session";
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const authSubscribers = new Set<(event: AuthChangeEvent, session: AuthSession | null) => void>();

const isBrowser = typeof window !== "undefined";

const buildApiUrl = (path: string) => {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
};

const getPublicOrigin = () => {
  if (!isBrowser) return "";
  if (!API_BASE_URL) return window.location.origin;

  const url = new URL(API_BASE_URL, window.location.origin);
  return `${url.protocol}//${url.host}`;
};

const readStoredSession = (): AuthSession | null => {
  if (!isBrowser) return null;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

const persistStoredSession = (session: AuthSession | null) => {
  if (!isBrowser) return;

  if (session) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

const writeStoredSession = (session: AuthSession | null, event: AuthChangeEvent) => {
  persistStoredSession(session);

  authSubscribers.forEach((subscriber) => subscriber(event, session));
};

const parseErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload && typeof payload === "object") {
    const errorPayload = payload as Record<string, unknown>;
    const directMessage = errorPayload.error;
    if (typeof directMessage === "string" && directMessage.trim()) return directMessage;
    const nestedMessage = errorPayload.message;
    if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage;
  }

  return fallback;
};

const request = async <T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {},
): Promise<ApiEnvelope<T>> => {
  const headers = new Headers(init.headers || {});
  const includeAuth = options.auth !== false;
  const session = readStoredSession();

  if (includeAuth && session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && includeAuth && session) {
      writeStoredSession(null, "SIGNED_OUT");
    }

    return {
      data: null,
      error: new ApiError(
        parseErrorMessage(payload, `Request failed with status ${response.status}`),
        response.status,
      ),
    };
  }

  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    const envelope = payload as { data: T | null; count?: number | null };
    return {
      data: envelope.data ?? null,
      error: null,
      count: envelope.count ?? null,
    };
  }

  return {
    data: (payload as T) ?? null,
    error: null,
  };
};

const requestJson = async <T>(
  path: string,
  method: string,
  body?: unknown,
  options: { auth?: boolean } = {},
) => {
  return request<T>(
    path,
    {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    options,
  );
};

const resolveSession = async (): Promise<AuthSession | null> => {
  const storedSession = readStoredSession();
  if (!storedSession?.access_token) return null;

  const { data, error } = await requestJson<AuthSession>("/api/auth/session", "GET");
  if (error || !data) {
    writeStoredSession(null, "SIGNED_OUT");
    return null;
  }

  persistStoredSession(data);
  return data;
};

class QueryBuilder implements PromiseLike<ApiEnvelope<any>> {
  private action: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private selectColumns = "*";
  private selectOptions: { count?: string; head?: boolean } = {};
  private returningColumns: string | null = null;
  private filters: QueryFilter[] = [];
  private orders: QueryOrder[] = [];
  private limitValue: number | null = null;
  private payload: unknown = null;
  private conflictColumns: string[] = [];
  private wantsSingle = false;
  private allowsEmptySingle = false;

  constructor(private readonly table: string) {}

  select(columns = "*", options: { count?: string; head?: boolean } = {}) {
    if (this.action === "select") {
      this.selectColumns = columns;
      this.selectOptions = options;
    } else {
      this.returningColumns = columns;
    }

    return this;
  }

  insert(values: unknown) {
    this.action = "insert";
    this.payload = values;
    return this;
  }

  update(values: unknown) {
    this.action = "update";
    this.payload = values;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  upsert(values: unknown, options: { onConflict?: string } = {}) {
    this.action = "upsert";
    this.payload = values;
    this.conflictColumns = String(options.onConflict || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ op: "eq", column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ op: "gte", column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ op: "lte", column, value });
    return this;
  }

  ["in"](column: string, value: unknown[]) {
    this.filters.push({ op: "in", column, value });
    return this;
  }

  or(expression: string) {
    this.filters.push({ op: "or", expression });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orders.push({ column, ascending: options.ascending !== false });
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.wantsSingle = true;
    this.allowsEmptySingle = false;
    return this;
  }

  maybeSingle() {
    this.wantsSingle = true;
    this.allowsEmptySingle = true;
    return this;
  }

  private finalize(rows: unknown, count?: number | null): ApiEnvelope<any> {
    if (!this.wantsSingle) {
      return {
        data: rows,
        error: null,
        count: count ?? null,
      };
    }

    if (!Array.isArray(rows)) {
      return {
        data: rows,
        error: rows === null && !this.allowsEmptySingle ? new ApiError("Row not found", 404) : null,
        count: count ?? null,
      };
    }

    if (rows.length === 0) {
      return {
        data: null,
        error: this.allowsEmptySingle ? null : new ApiError("Row not found", 404),
        count: count ?? null,
      };
    }

    return {
      data: rows[0],
      error: null,
      count: count ?? null,
    };
  }

  private async executeSelect() {
    const { data, error, count } = await requestJson<any[]>(
      "/api/db/select",
      "POST",
      {
        table: this.table,
        columns: this.selectColumns,
        filters: this.filters,
        orderBy: this.orders,
        limit: this.limitValue,
        count: this.selectOptions.count,
        head: this.selectOptions.head,
      },
    );

    if (error) return { data: null, error, count: count ?? null };
    if (this.selectOptions.head) {
      return { data: null, error: null, count: count ?? null };
    }

    return this.finalize(data || [], count);
  }

  private async executeMutation() {
    const endpointMap = {
      insert: "/api/db/insert",
      update: "/api/db/update",
      delete: "/api/db/delete",
      upsert: "/api/db/upsert",
    } as const;

    const { data, error } = await requestJson<any[]>(
      endpointMap[this.action],
      "POST",
      {
        table: this.table,
        values: this.payload,
        filters: this.filters,
        returning: this.returningColumns,
        onConflict: this.conflictColumns,
      },
    );

    if (error) return { data: null, error, count: null };
    if (!this.returningColumns) {
      return { data: null, error: null, count: null };
    }

    return this.finalize(data || [], null);
  }

  async then<TResult1 = ApiEnvelope<any>, TResult2 = never>(
    onfulfilled?: ((value: ApiEnvelope<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const result =
      this.action === "select" ? await this.executeSelect() : await this.executeMutation();

    if (result.error && onrejected) {
      return Promise.resolve(onrejected(result.error));
    }

    if (onfulfilled) {
      return Promise.resolve(onfulfilled(result));
    }

    return result as TResult1 | TResult2;
  }
}

const auth = {
  async getSession() {
    const session = await resolveSession();
    return {
      data: { session },
      error: null,
    };
  },

  async getUser() {
    const session = await resolveSession();
    return {
      data: { user: session?.user ?? null },
      error: null,
    };
  },

  async signInWithPassword(credentials: { email: string; password: string }) {
    const { data, error } = await requestJson<AuthSession>(
      "/api/auth/signin",
      "POST",
      credentials,
      { auth: false },
    );

    if (!error && data) {
      writeStoredSession(data, "SIGNED_IN");
    }

    return {
      data: data ? { session: data, user: data.user } : { session: null, user: null },
      error,
    };
  },

  async signUp(payload: {
    email: string;
    password: string;
    options?: { data?: JsonRecord };
  }) {
    const { data, error } = await requestJson<AuthSession>(
      "/api/auth/signup",
      "POST",
      payload,
      { auth: false },
    );

    if (!error && data) {
      writeStoredSession(data, "SIGNED_IN");
    }

    return {
      data: data ? { session: data, user: data.user } : { session: null, user: null },
      error,
    };
  },

  async signOut() {
    await requestJson("/api/auth/signout", "POST");
    writeStoredSession(null, "SIGNED_OUT");

    return {
      error: null,
    };
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: AuthSession | null) => void) {
    authSubscribers.add(callback);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authSubscribers.delete(callback);
          },
        },
      },
    };
  },
};

const functions = {
  async invoke<T = any>(name: string, options: { body?: unknown } = {}) {
    const { data, error } = await requestJson<T>(
      `/api/functions/${name}`,
      "POST",
      options.body ?? {},
      { auth: name !== "send-request-notification" },
    );

    return { data, error };
  },
};

const storage = {
  from(bucket: string) {
    return {
      async upload(
        path: string,
        file: File,
        options: { cacheControl?: string; upsert?: boolean } = {},
      ) {
        const formData = new FormData();
        formData.append("file", file);

        const session = readStoredSession();
        const headers = new Headers();
        if (session?.access_token) {
          headers.set("Authorization", `Bearer ${session.access_token}`);
        }

        const response = await fetch(
          buildApiUrl(
            `/api/storage/${bucket}/upload?path=${encodeURIComponent(path)}&upsert=${options.upsert ? "1" : "0"}&cacheControl=${encodeURIComponent(options.cacheControl || "3600")}`,
          ),
          {
            method: "POST",
            body: formData,
            headers,
          },
        );

        if (!response.ok) {
          const payload = response.headers.get("content-type")?.includes("application/json")
            ? await response.json()
            : await response.text();

          return {
            data: null,
            error: new ApiError(
              parseErrorMessage(payload, "Upload failed"),
              response.status,
            ),
          };
        }

        return { data: { path }, error: null };
      },

      getPublicUrl(path: string) {
        return {
          data: {
            publicUrl: `${getPublicOrigin()}/files/${bucket}/${path}`,
          },
        };
      },

      async remove(paths: string[]) {
        const { error } = await requestJson(
          `/api/storage/${bucket}/remove`,
          "POST",
          { paths },
        );

        return { data: null, error };
      },
    };
  },
};

export const supabase = {
  auth,
  functions,
  storage,
  from(table: string) {
    return new QueryBuilder(table);
  },
  async rpc<T = any>(name: string, args: JsonRecord = {}) {
    const { data, error } = await requestJson<T>(`/api/rpc/${name}`, "POST", args);
    return { data, error };
  },
  channel(name: string) {
    return {
      name,
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
    };
  },
  removeChannel() {
    return null;
  },
};

export type User = AuthUser;
