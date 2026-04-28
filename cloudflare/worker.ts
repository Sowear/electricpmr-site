type QueryFilter =
  | { op: "eq" | "gte" | "lte"; column: string; value: unknown }
  | { op: "in"; column: string; value: unknown[] }
  | { op: "or"; expression: string };

type QueryOrder = {
  column: string;
  ascending?: boolean;
};

type DbAction = "select" | "insert" | "update" | "delete" | "upsert";

type SessionUser = {
  id: string;
  email: string;
  phone?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
};

type SessionContext = {
  user: SessionUser;
  roles: string[];
};

type Env = {
  DB: D1Database;
  WORK_EXAMPLES_BUCKET?: R2Bucket;
  APP_BASE_URL?: string;
  REQUEST_EMAIL_WEBHOOK_URL?: string;
  REQUEST_EMAIL_WEBHOOK_TOKEN?: string;
  ESTIMATE_EMAIL_WEBHOOK_URL?: string;
  ESTIMATE_EMAIL_WEBHOOK_TOKEN?: string;
  SESSION_TTL_DAYS?: string;
  SUPER_ADMIN_EMAIL?: string;
};

const APP_TABLES = new Set([
  "profiles",
  "user_roles",
  "services",
  "requests",
  "rate_limits",
  "projects",
  "project_objects",
  "project_members",
  "company_accounts",
  "estimates",
  "estimate_line_items",
  "catalog_items",
  "estimate_history",
  "estimate_send_log",
  "notes",
  "payments",
  "finance_entries",
  "notifications",
  "profit_snapshots",
  "employee_payouts",
  "estimate_participants",
  "finance_settings",
  "work_examples",
]);

const JSON_COLUMNS: Record<string, string[]> = {
  catalog_items: ["tags", "synonyms"],
  estimate_history: ["old_values", "new_values"],
  finance_entries: ["tags_json"],
  notifications: ["payload_json"],
  work_examples: ["tags"],
};

const BOOLEAN_COLUMNS: Record<string, string[]> = {
  catalog_items: ["is_hidden"],
  estimates: ["locked", "prepayment_confirmed"],
  finance_entries: ["requires_approval"],
  finance_settings: ["id", "auto_lock_snapshot", "auto_create_payouts"],
  notifications: [],
  payments: ["verified"],
  profit_snapshots: ["locked"],
  user_roles: ["immutable"],
  work_examples: ["is_published"],
};

const TABLES_WITH_UPDATED_AT = new Set([
  "app_users",
  "profiles",
  "requests",
  "projects",
  "project_objects",
  "estimates",
  "estimate_line_items",
  "catalog_items",
  "payments",
  "finance_entries",
  "finance_settings",
  "work_examples",
]);

const PUBLIC_SELECT_TABLES = new Set(["services", "work_examples"]);
const WORKSPACE_READ_TABLES = new Set([
  "projects",
  "project_objects",
  "project_members",
  "estimates",
  "estimate_line_items",
  "catalog_items",
  "estimate_history",
  "estimate_participants",
  "notes",
  "notifications",
]);
const MANAGER_WRITE_TABLES = new Set([
  "projects",
  "project_objects",
  "project_members",
  "company_accounts",
  "estimates",
  "estimate_line_items",
  "catalog_items",
  "estimate_history",
  "estimate_send_log",
  "notes",
  "payments",
  "finance_entries",
  "notifications",
  "employee_payouts",
  "estimate_participants",
  "work_examples",
]);
const ADMIN_ONLY_WRITE_TABLES = new Set(["user_roles", "profiles", "finance_settings"]);

const encoder = new TextEncoder();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

const nowIso = () => new Date().toISOString();
const roundMoney = (value: number) => Math.round(value * 100) / 100;
const createId = () => crypto.randomUUID();
const createToken = () => crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });

const textError = (message: string, status = 400) =>
  json({ error: message }, status);

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const derivePasswordHash = async (password: string, salt: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 120000,
      hash: "SHA-256",
    },
    key,
    256,
  );

  return toBase64(new Uint8Array(bits));
};

const parseJsonBody = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

const parseJsonString = (value: unknown) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeBoolean = (value: unknown) => value === 1 || value === true;

const normalizeRow = (table: string, row: Record<string, unknown>) => {
  const normalized = { ...row };

  for (const column of JSON_COLUMNS[table] || []) {
    normalized[column] = parseJsonString(normalized[column]);
  }

  for (const column of BOOLEAN_COLUMNS[table] || []) {
    normalized[column] = normalizeBoolean(normalized[column]);
  }

  return normalized;
};

const normalizeRows = (table: string, rows: Record<string, unknown>[] = []) =>
  rows.map((row) => normalizeRow(table, row));

const assertTable = (table: unknown) => {
  if (typeof table !== "string" || !APP_TABLES.has(table)) {
    throw new Error("Unknown table");
  }
  return table;
};

const assertIdentifier = (value: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid identifier: ${value}`);
  }
  return value;
};

const parseColumnList = (value: unknown) => {
  if (!value || value === "*") return "*";
  if (typeof value !== "string") throw new Error("Columns must be a string");

  const columns = value
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean)
    .map(assertIdentifier);

  return columns.join(", ");
};

const serializeValue = (table: string, column: string, value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if ((JSON_COLUMNS[table] || []).includes(column)) {
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  if ((BOOLEAN_COLUMNS[table] || []).includes(column)) {
    return value ? 1 : 0;
  }

  return value;
};

const buildWhere = (table: string, filters: QueryFilter[] = []) => {
  const clauses: string[] = [];
  const params: unknown[] = [];

  for (const filter of filters) {
    if (filter.op === "or") {
      const parts = filter.expression
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

      const orClauses = parts.map((part) => {
        const [column, operator, ...rest] = part.split(".");
        assertIdentifier(column);
        const rawValue = rest.join(".");

        if (operator === "eq") {
          params.push(rawValue);
          return `${column} = ?`;
        }

        if (operator === "is" && rawValue === "null") {
          return `${column} IS NULL`;
        }

        throw new Error(`Unsupported OR filter: ${part}`);
      });

      clauses.push(`(${orClauses.join(" OR ")})`);
      continue;
    }

    assertIdentifier(filter.column);

    if (filter.op === "in") {
      const values = Array.isArray(filter.value) ? filter.value : [];
      if (!values.length) {
        clauses.push("1 = 0");
        continue;
      }

      clauses.push(`${filter.column} IN (${values.map(() => "?").join(", ")})`);
      params.push(...values.map((value) => serializeValue(table, filter.column, value)));
      continue;
    }

    const operator = filter.op === "eq" ? "=" : filter.op === "gte" ? ">=" : "<=";
    clauses.push(`${filter.column} ${operator} ?`);
    params.push(serializeValue(table, filter.column, filter.value));
  }

  return {
    sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
};

const buildOrder = (orderBy: QueryOrder[] = []) => {
  if (!Array.isArray(orderBy) || !orderBy.length) return "";

  const chunks = orderBy.map((order) => {
    assertIdentifier(order.column);
    return `${order.column} ${order.ascending === false ? "DESC" : "ASC"}`;
  });

  return ` ORDER BY ${chunks.join(", ")}`;
};

const fetchUserRoles = async (env: Env, userId: string) => {
  const result = await env.DB.prepare(
    "SELECT role FROM user_roles WHERE user_id = ? ORDER BY role ASC",
  )
    .bind(userId)
    .all<{ role: string }>();

  return (result.results || []).map((row) => row.role);
};

const getSessionContext = async (request: Request, env: Env): Promise<SessionContext | null> => {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const tokenHash = await sha256Hex(token);
  const result = await env.DB.prepare(
    `
      SELECT
        user_sessions.user_id,
        user_sessions.expires_at,
        app_users.email,
        app_users.phone,
        app_users.created_at,
        app_users.name
      FROM user_sessions
      INNER JOIN app_users ON app_users.id = user_sessions.user_id
      WHERE user_sessions.token_hash = ?
      LIMIT 1
    `,
  )
    .bind(tokenHash)
    .first<Record<string, unknown>>();

  if (!result?.user_id || typeof result.expires_at !== "string") return null;
  if (new Date(result.expires_at).getTime() <= Date.now()) {
    await env.DB.prepare("DELETE FROM user_sessions WHERE token_hash = ?").bind(tokenHash).run();
    return null;
  }

  await env.DB.prepare(
    "UPDATE user_sessions SET last_seen_at = ? WHERE token_hash = ?",
  )
    .bind(nowIso(), tokenHash)
    .run();

  const roles = await fetchUserRoles(env, String(result.user_id));

  return {
    user: {
      id: String(result.user_id),
      email: String(result.email),
      phone: typeof result.phone === "string" ? result.phone : null,
      created_at: typeof result.created_at === "string" ? result.created_at : undefined,
      user_metadata: {
        name: typeof result.name === "string" ? result.name : "",
        phone: typeof result.phone === "string" ? result.phone : "",
      },
    },
    roles,
  };
};

const hasAnyRole = (session: SessionContext | null, roles: string[]) =>
  !!session && roles.some((role) => session.roles.includes(role));

const canManageWorkspace = (session: SessionContext | null) =>
  hasAnyRole(session, ["manager", "admin", "super_admin"]);

const canAdmin = (session: SessionContext | null) =>
  hasAnyRole(session, ["admin", "super_admin"]);

const isTechnician = (session: SessionContext | null) =>
  hasAnyRole(session, ["technician"]);

const authorizeTable = (action: DbAction, table: string, session: SessionContext | null) => {
  if (action === "select" && PUBLIC_SELECT_TABLES.has(table)) {
    return { allowed: true as const, scopeUserId: null as string | null };
  }

  if (table === "requests") {
    if (action === "insert") {
      return { allowed: true as const, scopeUserId: null as string | null };
    }
    if (canManageWorkspace(session) || isTechnician(session)) {
      return { allowed: true as const, scopeUserId: null as string | null };
    }
    return session
      ? { allowed: true as const, scopeUserId: session.user.id }
      : { allowed: false as const, scopeUserId: null };
  }

  if (table === "profiles") {
    if (canAdmin(session)) {
      return { allowed: true as const, scopeUserId: null as string | null };
    }
    return session && (action === "select" || action === "update")
      ? { allowed: true as const, scopeUserId: session.user.id }
      : { allowed: false as const, scopeUserId: null };
  }

  if (table === "user_roles") {
    if (canAdmin(session)) {
      return { allowed: true as const, scopeUserId: null as string | null };
    }
    return session && action === "select"
      ? { allowed: true as const, scopeUserId: session.user.id }
      : { allowed: false as const, scopeUserId: null };
  }

  if (table === "notifications") {
    if (canManageWorkspace(session)) {
      return { allowed: true as const, scopeUserId: null as string | null };
    }
    return session
      ? { allowed: true as const, scopeUserId: session.user.id }
      : { allowed: false as const, scopeUserId: null };
  }

  if (table === "finance_settings") {
    if (action === "select" && hasAnyRole(session, ["manager", "admin", "super_admin"])) {
      return { allowed: true as const, scopeUserId: null as string | null };
    }
    return canAdmin(session)
      ? { allowed: true as const, scopeUserId: null as string | null }
      : { allowed: false as const, scopeUserId: null };
  }

  if (WORKSPACE_READ_TABLES.has(table) || table === "estimate_send_log" || table === "company_accounts" || table === "payments" || table === "finance_entries" || table === "employee_payouts" || table === "profit_snapshots" || table === "project_members") {
    if (action === "select" && (canManageWorkspace(session) || isTechnician(session))) {
      return { allowed: true as const, scopeUserId: null as string | null };
    }
  }

  if (MANAGER_WRITE_TABLES.has(table)) {
    return canManageWorkspace(session)
      ? { allowed: true as const, scopeUserId: null as string | null }
      : { allowed: false as const, scopeUserId: null };
  }

  if (ADMIN_ONLY_WRITE_TABLES.has(table)) {
    return canAdmin(session)
      ? { allowed: true as const, scopeUserId: null as string | null }
      : { allowed: false as const, scopeUserId: null };
  }

  if (table === "services") {
    return action === "select" || canManageWorkspace(session)
      ? { allowed: true as const, scopeUserId: null as string | null }
      : { allowed: false as const, scopeUserId: null };
  }

  return { allowed: false as const, scopeUserId: null };
};

const applyScope = (table: string, filters: QueryFilter[], scopeUserId: string | null) => {
  if (!scopeUserId) return filters;
  if (!["profiles", "user_roles", "requests", "notifications"].includes(table)) {
    return filters;
  }

  return [...filters, { op: "eq", column: "user_id", value: scopeUserId }];
};

const calculateLineTotal = (item: Record<string, unknown>) => {
  const quantity = Number(item.quantity || 0);
  const unitPrice = Number(item.unit_price || 0);
  const laborHours = Number(item.labor_hours || 0);
  const laborRate = Number(item.labor_rate || 0);
  const markupPct = Number(item.markup_pct || 0);
  const discountPct = Number(item.discount_pct || 0);
  const taxPct = Number(item.tax_pct || 0);

  const lineNet = quantity * unitPrice;
  const laborCost = laborHours * laborRate;
  const lineSubtotal = lineNet + laborCost;
  const markupAmount = lineSubtotal * (markupPct / 100);
  const discountAmount = (lineSubtotal + markupAmount) * (discountPct / 100);
  const taxAmount = (lineSubtotal + markupAmount - discountAmount) * (taxPct / 100);

  return roundMoney(lineSubtotal + markupAmount - discountAmount + taxAmount);
};

const calculateEstimateTotals = (estimate: Record<string, unknown>, lineItems: Record<string, unknown>[]) => {
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  const globalDiscountPct = Number(estimate.global_discount_pct || 0);
  const globalDiscountAmount = Number(estimate.global_discount_amount || 0);
  const globalTaxPct = Number(estimate.global_tax_pct || 0);
  const extraFees = Number(estimate.extra_fees || 0);
  const depositPct = Number(estimate.deposit_pct || 0);
  const depositAmount = Number(estimate.deposit_amount || 0);

  const globalDiscount = Math.max(subtotal * (globalDiscountPct / 100), globalDiscountAmount);
  const taxBase = subtotal - globalDiscount;
  const taxAmount = taxBase * (globalTaxPct / 100);
  const total = taxBase + taxAmount + extraFees;
  const deposit = Math.max(total * (depositPct / 100), depositAmount);
  const balanceDue = total - deposit;

  return {
    subtotal: roundMoney(subtotal),
    tax_amount: roundMoney(taxAmount),
    total: roundMoney(total),
    deposit_amount: roundMoney(deposit),
    balance_due: roundMoney(balanceDue),
  };
};

const fetchRows = async (
  env: Env,
  table: string,
  filters: QueryFilter[] = [],
  options: { columns?: string; orderBy?: QueryOrder[]; limit?: number | null } = {},
) => {
  const columnsSql = parseColumnList(options.columns || "*");
  const where = buildWhere(table, filters);
  const order = buildOrder(options.orderBy || []);
  const limit =
    typeof options.limit === "number" && Number.isFinite(options.limit)
      ? ` LIMIT ${Math.max(0, Math.trunc(options.limit))}`
      : "";

  const sql = `SELECT ${columnsSql} FROM ${table}${where.sql}${order}${limit}`;
  const result = await env.DB.prepare(sql).bind(...where.params).all<Record<string, unknown>>();
  return normalizeRows(table, result.results || []);
};

const fetchRowById = async (env: Env, table: string, id: string) => {
  const rows = await fetchRows(env, table, [{ op: "eq", column: "id", value: id }], { limit: 1 });
  return rows[0] || null;
};

const recalculatePaidAmount = async (env: Env, estimateId: string) => {
  const result = await env.DB.prepare(
    `
      SELECT COALESCE(SUM(amount), 0) AS paid_amount
      FROM payments
      WHERE estimate_id = ? AND status = 'confirmed'
    `,
  )
    .bind(estimateId)
    .first<{ paid_amount: number }>();

  await env.DB.prepare(
    "UPDATE estimates SET paid_amount = ?, updated_at = ? WHERE id = ?",
  )
    .bind(Number(result?.paid_amount || 0), nowIso(), estimateId)
    .run();
};

const recalculateEstimate = async (env: Env, estimateId: string) => {
  const estimate = await fetchRowById(env, "estimates", estimateId);
  if (!estimate) return;

  const lineItems = await fetchRows(
    env,
    "estimate_line_items",
    [{ op: "eq", column: "estimate_id", value: estimateId }],
    { orderBy: [{ column: "position", ascending: true }] },
  );

  for (const lineItem of lineItems) {
    const nextLineTotal = calculateLineTotal(lineItem);
    if (Number(lineItem.line_total || 0) !== nextLineTotal) {
      await env.DB.prepare(
        "UPDATE estimate_line_items SET line_total = ?, updated_at = ? WHERE id = ?",
      )
        .bind(nextLineTotal, nowIso(), lineItem.id)
        .run();
      lineItem.line_total = nextLineTotal;
    }
  }

  const totals = calculateEstimateTotals(estimate, lineItems);

  await env.DB.prepare(
    `
      UPDATE estimates
      SET subtotal = ?, tax_amount = ?, total = ?, deposit_amount = ?, balance_due = ?, updated_at = ?
      WHERE id = ?
    `,
  )
    .bind(
      totals.subtotal,
      totals.tax_amount,
      totals.total,
      totals.deposit_amount,
      totals.balance_due,
      nowIso(),
      estimateId,
    )
    .run();

  await recalculatePaidAmount(env, estimateId);
};

const prepareInsertRecord = async (
  table: string,
  values: Record<string, unknown>,
  session: SessionContext | null,
  env: Env,
) => {
  const nextRecord: Record<string, unknown> = {
    ...values,
  };

  if (!nextRecord.id) nextRecord.id = createId();
  if (TABLES_WITH_UPDATED_AT.has(table)) nextRecord.updated_at = nowIso();
  if (!nextRecord.created_at) nextRecord.created_at = nowIso();

  if (table === "requests") {
    nextRecord.status = nextRecord.status || "new";
    nextRecord.source = nextRecord.source || "website";
    if (!nextRecord.user_id && session?.user.id) {
      nextRecord.user_id = session.user.id;
    }
  }

  if (table === "projects") {
    nextRecord.source = nextRecord.source || "website";
    nextRecord.status = nextRecord.status || "new";
    if (!nextRecord.created_by && session?.user.id) {
      nextRecord.created_by = session.user.id;
    }
  }

  if (table === "user_roles") {
    nextRecord.immutable = nextRecord.immutable ?? false;
    nextRecord.assigned_at = nextRecord.assigned_at || nowIso();
  }

  if (table === "catalog_items") {
    nextRecord.tags = Array.isArray(nextRecord.tags) ? nextRecord.tags : [];
    nextRecord.synonyms = Array.isArray(nextRecord.synonyms) ? nextRecord.synonyms : [];
    nextRecord.is_hidden = nextRecord.is_hidden ?? false;
    nextRecord.base_price = Number(nextRecord.base_price || 0);
    nextRecord.popularity_score = Number(nextRecord.popularity_score || 0);
  }

  if (table === "work_examples") {
    nextRecord.tags = Array.isArray(nextRecord.tags) ? nextRecord.tags : nextRecord.tags || null;
    nextRecord.is_published = nextRecord.is_published ?? true;
    nextRecord.display_order = Number(nextRecord.display_order || 0);
    if (!nextRecord.created_by && session?.user.id) {
      nextRecord.created_by = session.user.id;
    }
  }

  if (table === "estimates") {
    const estimateSuffix = `${Date.now()}`.slice(-6);
    nextRecord.estimate_number = nextRecord.estimate_number || `EST-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${estimateSuffix}`;
    nextRecord.public_token = nextRecord.public_token || createToken().slice(0, 24);
    nextRecord.status = nextRecord.status || "draft";
    nextRecord.version = Number(nextRecord.version || 1);
    nextRecord.currency = nextRecord.currency || "RUB_PMR";
    nextRecord.exchange_rate = Number(nextRecord.exchange_rate || 1);
    nextRecord.global_discount_pct = Number(nextRecord.global_discount_pct || 0);
    nextRecord.global_discount_amount = Number(nextRecord.global_discount_amount || 0);
    nextRecord.global_tax_pct = Number(nextRecord.global_tax_pct || 0);
    nextRecord.extra_fees = Number(nextRecord.extra_fees || 0);
    nextRecord.deposit_pct = Number(nextRecord.deposit_pct || 0);
    nextRecord.deposit_amount = Number(nextRecord.deposit_amount || 0);
    nextRecord.locked = nextRecord.locked ?? false;
    nextRecord.prepayment_confirmed = nextRecord.prepayment_confirmed ?? false;
    nextRecord.paid_amount = Number(nextRecord.paid_amount || 0);
    nextRecord.snapshot_threshold_rule = nextRecord.snapshot_threshold_rule || "deposit";
    if (!nextRecord.created_by && session?.user.id) {
      nextRecord.created_by = session.user.id;
    }
  }

  if (table === "estimate_line_items") {
    nextRecord.position = Number(nextRecord.position || 0);
    nextRecord.item_type = nextRecord.item_type || "service";
    nextRecord.unit = nextRecord.unit || "pcs";
    nextRecord.quantity = Number(nextRecord.quantity || 0);
    nextRecord.unit_price = Number(nextRecord.unit_price || 0);
    nextRecord.labor_hours = Number(nextRecord.labor_hours || 0);
    nextRecord.labor_rate = Number(nextRecord.labor_rate || 0);
    nextRecord.cost_price = Number(nextRecord.cost_price || 0);
    nextRecord.markup_pct = Number(nextRecord.markup_pct || 0);
    nextRecord.discount_pct = Number(nextRecord.discount_pct || 0);
    nextRecord.tax_pct = Number(nextRecord.tax_pct || 0);
    nextRecord.line_total = calculateLineTotal(nextRecord);
  }

  if (table === "payments") {
    const amount = Number(nextRecord.amount || 0);
    const fees = Number(nextRecord.fees || 0);
    nextRecord.currency = nextRecord.currency || "RUB_PMR";
    nextRecord.status = nextRecord.status || "pending";
    nextRecord.verified = nextRecord.verified ?? false;
    nextRecord.gross_amount = Number(nextRecord.gross_amount ?? amount);
    nextRecord.net_amount = Number(nextRecord.net_amount ?? amount - fees);
    nextRecord.fees = fees;
    if (!nextRecord.created_by && session?.user.id) {
      nextRecord.created_by = session.user.id;
    }
  }

  if (table === "finance_entries") {
    const amount = Number(nextRecord.amount || 0);
    const fees = Number(nextRecord.fees || 0);
    nextRecord.currency = nextRecord.currency || "RUB_PMR";
    nextRecord.source = nextRecord.source || "manual";
    nextRecord.gross_amount = Number(nextRecord.gross_amount ?? amount);
    nextRecord.net_amount = Number(nextRecord.net_amount ?? amount - fees);
    nextRecord.fees = fees;
    nextRecord.tags_json = nextRecord.tags_json || [];
    nextRecord.requires_approval = nextRecord.requires_approval ?? false;
    if (!nextRecord.created_by && session?.user.id) {
      nextRecord.created_by = session.user.id;
    }
  }

  if (table === "notifications") {
    nextRecord.type = nextRecord.type || "info";
    nextRecord.payload_json = nextRecord.payload_json || {};
    nextRecord.status = nextRecord.status || "unread";
  }

  if (table === "finance_settings") {
    nextRecord.id = true;
    nextRecord.reserve_percent = Number(nextRecord.reserve_percent || 10);
    nextRecord.auto_lock_snapshot = nextRecord.auto_lock_snapshot ?? true;
    nextRecord.auto_create_payouts = nextRecord.auto_create_payouts ?? true;
  }

  if (table === "estimate_participants") {
    nextRecord.percent_share = Number(nextRecord.percent_share || 0);
    nextRecord.fixed_amount = Number(nextRecord.fixed_amount || 0);
  }

  if (table === "project_members") {
    nextRecord.fixed_amount = Number(nextRecord.fixed_amount || 0);
    nextRecord.percent_share = Number(nextRecord.percent_share || 0);
  }

  if (table === "company_accounts") {
    nextRecord.balance = Number(nextRecord.balance || 0);
    nextRecord.currency = nextRecord.currency || "RUB_PMR";
  }

  if (table === "employee_payouts") {
    nextRecord.amount = Number(nextRecord.amount || 0);
    nextRecord.status = nextRecord.status || "pending";
  }

  if (table === "profit_snapshots") {
    nextRecord.revenue = Number(nextRecord.revenue || 0);
    nextRecord.expenses = Number(nextRecord.expenses || 0);
    nextRecord.net_profit = Number(nextRecord.net_profit || 0);
    nextRecord.reserve_amount = Number(nextRecord.reserve_amount || 0);
    nextRecord.distributable_amount = Number(nextRecord.distributable_amount || 0);
    nextRecord.locked = nextRecord.locked ?? true;
  }

  if (table === "app_users") {
    nextRecord.updated_at = nowIso();
  }

  const entries = Object.entries(nextRecord)
    .filter(([, value]) => value !== undefined)
    .map(([column, value]) => [assertIdentifier(column), serializeValue(table, column, value)] as const);

  return Object.fromEntries(entries);
};

const prepareUpdateRecord = async (
  table: string,
  values: Record<string, unknown>,
  existingRows: Record<string, unknown>[],
) => {
  const nextRecord: Record<string, unknown> = {
    ...values,
  };

  if (TABLES_WITH_UPDATED_AT.has(table)) {
    nextRecord.updated_at = nowIso();
  }

  if (table === "estimate_line_items" && existingRows[0]) {
    const merged = { ...existingRows[0], ...nextRecord };
    nextRecord.line_total = calculateLineTotal(merged);
  }

  if (table === "payments") {
    const base = existingRows[0] || {};
    const amount = Number(nextRecord.amount ?? base.amount ?? 0);
    const fees = Number(nextRecord.fees ?? base.fees ?? 0);
    if (nextRecord.amount !== undefined || nextRecord.fees !== undefined) {
      nextRecord.gross_amount = Number(nextRecord.gross_amount ?? base.gross_amount ?? amount);
      nextRecord.net_amount = Number(nextRecord.net_amount ?? base.net_amount ?? amount - fees);
      nextRecord.fees = fees;
    }
  }

  if (table === "finance_entries") {
    const base = existingRows[0] || {};
    const amount = Number(nextRecord.amount ?? base.amount ?? 0);
    const fees = Number(nextRecord.fees ?? base.fees ?? 0);
    if (nextRecord.amount !== undefined || nextRecord.fees !== undefined) {
      nextRecord.gross_amount = Number(nextRecord.gross_amount ?? base.gross_amount ?? amount);
      nextRecord.net_amount = Number(nextRecord.net_amount ?? base.net_amount ?? amount - fees);
      nextRecord.fees = fees;
    }
  }

  const entries = Object.entries(nextRecord)
    .filter(([, value]) => value !== undefined)
    .map(([column, value]) => [assertIdentifier(column), serializeValue(table, column, value)] as const);

  return Object.fromEntries(entries);
};

const afterMutation = async (
  env: Env,
  table: string,
  rows: Record<string, unknown>[],
) => {
  if (table === "estimate_line_items") {
    const estimateIds = [...new Set(rows.map((row) => String(row.estimate_id || "")).filter(Boolean))];
    for (const estimateId of estimateIds) {
      await recalculateEstimate(env, estimateId);
    }
  }

  if (table === "estimates") {
    const estimateIds = [...new Set(rows.map((row) => String(row.id || "")).filter(Boolean))];
    for (const estimateId of estimateIds) {
      await recalculateEstimate(env, estimateId);
    }
  }

  if (table === "payments") {
    const estimateIds = [...new Set(rows.map((row) => String(row.estimate_id || "")).filter(Boolean))];
    for (const estimateId of estimateIds) {
      await recalculatePaidAmount(env, estimateId);
    }
  }
};

const runInsert = async (
  env: Env,
  table: string,
  values: unknown,
  returning: string | null,
  session: SessionContext | null,
) => {
  const items = Array.isArray(values) ? values : [values];
  const resultRows: Record<string, unknown>[] = [];
  const touchedRows: Record<string, unknown>[] = [];
  const returningSql = returning ? ` RETURNING ${parseColumnList(returning)}` : "";

  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw new Error("Insert payload must be an object");
    }

    const prepared = await prepareInsertRecord(table, item as Record<string, unknown>, session, env);
    touchedRows.push(prepared);

    const entries = Object.entries(prepared);
    const columns = entries.map(([column]) => column);
    const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})${returningSql}`;
    const statement = env.DB.prepare(sql).bind(...entries.map(([, value]) => value));

    if (returning) {
      const inserted = await statement.all<Record<string, unknown>>();
      resultRows.push(...normalizeRows(table, inserted.results || []));
    } else {
      await statement.run();
    }
  }

  await afterMutation(env, table, touchedRows);

  if (!returning) return null;
  return resultRows;
};

const runUpdate = async (
  env: Env,
  table: string,
  values: unknown,
  filters: QueryFilter[],
  returning: string | null,
) => {
  if (!values || typeof values !== "object") {
    throw new Error("Update payload must be an object");
  }

  const existingRows = await fetchRows(env, table, filters, { columns: "*" });
  if (!existingRows.length) return returning ? [] : null;

  const prepared = await prepareUpdateRecord(table, values as Record<string, unknown>, existingRows);
  const entries = Object.entries(prepared);
  if (!entries.length) return returning ? existingRows : null;

  const where = buildWhere(table, filters);
  const returningSql = returning ? ` RETURNING ${parseColumnList(returning)}` : "";
  const sql = `UPDATE ${table} SET ${entries.map(([column]) => `${column} = ?`).join(", ")}${where.sql}${returningSql}`;
  const statement = env.DB.prepare(sql).bind(
    ...entries.map(([, value]) => value),
    ...where.params,
  );

  let rows: Record<string, unknown>[] = [];
  if (returning) {
    const updated = await statement.all<Record<string, unknown>>();
    rows = normalizeRows(table, updated.results || []);
  } else {
    await statement.run();
  }

  await afterMutation(env, table, existingRows);

  if (!returning) return null;

  if (table === "estimate_line_items") {
    const refreshedRows = await Promise.all(
      existingRows.map((row) => fetchRowById(env, table, String(row.id))),
    );
    return refreshedRows.filter(Boolean) as Record<string, unknown>[];
  }

  if (table === "estimates") {
    const refreshedRows = await Promise.all(
      existingRows.map((row) => fetchRowById(env, table, String(row.id))),
    );
    return refreshedRows.filter(Boolean) as Record<string, unknown>[];
  }

  return rows;
};

const runDelete = async (
  env: Env,
  table: string,
  filters: QueryFilter[],
) => {
  const existingRows = await fetchRows(env, table, filters, { columns: "*" });
  if (!existingRows.length) return null;

  const where = buildWhere(table, filters);
  await env.DB.prepare(`DELETE FROM ${table}${where.sql}`).bind(...where.params).run();
  await afterMutation(env, table, existingRows);

  return null;
};

const runUpsert = async (
  env: Env,
  table: string,
  values: unknown,
  returning: string | null,
  conflictColumns: string[],
  session: SessionContext | null,
) => {
  if (!conflictColumns.length) {
    throw new Error("Upsert requires onConflict columns");
  }

  const items = Array.isArray(values) ? values : [values];
  const resultRows: Record<string, unknown>[] = [];
  const touchedRows: Record<string, unknown>[] = [];
  const returningSql = returning ? ` RETURNING ${parseColumnList(returning)}` : "";

  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw new Error("Upsert payload must be an object");
    }

    const prepared = await prepareInsertRecord(table, item as Record<string, unknown>, session, env);
    touchedRows.push(prepared);

    const entries = Object.entries(prepared);
    const columns = entries.map(([column]) => column);
    const updateColumns = columns.filter(
      (column) => column !== "id" && column !== "created_at" && !conflictColumns.includes(column),
    );

    const sql = `
      INSERT INTO ${table} (${columns.join(", ")})
      VALUES (${columns.map(() => "?").join(", ")})
      ON CONFLICT (${conflictColumns.map(assertIdentifier).join(", ")})
      DO UPDATE SET ${updateColumns.map((column) => `${column} = excluded.${column}`).join(", ")}
      ${returningSql}
    `;

    const statement = env.DB.prepare(sql).bind(...entries.map(([, value]) => value));
    if (returning) {
      const rows = await statement.all<Record<string, unknown>>();
      resultRows.push(...normalizeRows(table, rows.results || []));
    } else {
      await statement.run();
    }
  }

  await afterMutation(env, table, touchedRows);

  if (!returning) return null;
  return resultRows;
};

const issueSession = async (env: Env, user: SessionUser) => {
  const token = createToken();
  const tokenHash = await sha256Hex(token);
  const ttlDays = Math.max(1, Number(env.SESSION_TTL_DAYS || 30));
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    `
      INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(createId(), user.id, tokenHash, expiresAt, nowIso(), nowIso())
    .run();

  return {
    access_token: token,
    expires_at: expiresAt,
    user,
  };
};

const signup = async (request: Request, env: Env) => {
  const payload = await parseJsonBody(request);
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const metadata =
    payload.options && typeof payload.options === "object" && payload.options.data && typeof payload.options.data === "object"
      ? (payload.options.data as Record<string, unknown>)
      : {};

  if (!email || !password) {
    return textError("Email and password are required", 400);
  }

  const existing = await env.DB.prepare("SELECT id FROM app_users WHERE email = ? LIMIT 1")
    .bind(email)
    .first();
  if (existing) {
    return textError("User with this email already exists", 409);
  }

  const userId = createId();
  const salt = createId();
  const passwordHash = await derivePasswordHash(password, salt);
  const name = typeof metadata.name === "string" ? metadata.name.trim() : "";
  const phone = typeof metadata.phone === "string" ? metadata.phone.trim() : "";
  const currentTimestamp = nowIso();

  await env.DB.prepare(
    `
      INSERT INTO app_users (id, email, password_hash, password_salt, name, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(userId, email, passwordHash, salt, name || null, phone || null, currentTimestamp, currentTimestamp)
    .run();

  await env.DB.prepare(
    `
      INSERT INTO profiles (id, user_id, name, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(createId(), userId, name || null, phone || null, currentTimestamp, currentTimestamp)
    .run();

  const userCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM app_users")
    .first<{ count: number }>();
  const isFirstUser = Number(userCount?.count || 0) === 1;
  const isEnvSuperAdmin =
    !!env.SUPER_ADMIN_EMAIL && env.SUPER_ADMIN_EMAIL.trim().toLowerCase() === email;

  const roles = isFirstUser || isEnvSuperAdmin ? ["user", "super_admin"] : ["user"];
  for (const role of roles) {
    await env.DB.prepare(
      `
        INSERT INTO user_roles (id, user_id, role, immutable, assigned_at)
        VALUES (?, ?, ?, ?, ?)
      `,
    )
      .bind(createId(), userId, role, role === "super_admin" ? 1 : 0, currentTimestamp)
      .run();
  }

  const session = await issueSession(env, {
    id: userId,
    email,
    phone: phone || null,
    created_at: currentTimestamp,
    user_metadata: {
      name,
      phone,
    },
  });

  return json({ data: session });
};

const signin = async (request: Request, env: Env) => {
  const payload = await parseJsonBody(request);
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");

  if (!email || !password) {
    return textError("Email and password are required", 400);
  }

  const user = await env.DB.prepare(
    `
      SELECT id, email, phone, created_at, name, password_hash, password_salt
      FROM app_users
      WHERE email = ?
      LIMIT 1
    `,
  )
    .bind(email)
    .first<Record<string, unknown>>();

  if (!user?.id || typeof user.password_hash !== "string" || typeof user.password_salt !== "string") {
    return textError("Invalid login credentials", 401);
  }

  const calculatedHash = await derivePasswordHash(password, user.password_salt);
  if (calculatedHash !== user.password_hash) {
    return textError("Invalid login credentials", 401);
  }

  const session = await issueSession(env, {
    id: String(user.id),
    email: String(user.email),
    phone: typeof user.phone === "string" ? user.phone : null,
    created_at: typeof user.created_at === "string" ? user.created_at : undefined,
    user_metadata: {
      name: typeof user.name === "string" ? user.name : "",
      phone: typeof user.phone === "string" ? user.phone : "",
    },
  });

  return json({ data: session });
};

const getSession = async (request: Request, env: Env) => {
  const session = await getSessionContext(request, env);
  if (!session) {
    return textError("Unauthorized", 401);
  }

  return json({
    data: {
      access_token: request.headers.get("Authorization")?.replace("Bearer ", "") || "",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      user: session.user,
    },
  });
};

const signout = async (request: Request, env: Env) => {
  const authorization = request.headers.get("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM user_sessions WHERE token_hash = ?").bind(tokenHash).run();
  }

  return json({ data: true });
};

const handleDbSelect = async (request: Request, env: Env, session: SessionContext | null) => {
  const body = await parseJsonBody(request);
  const table = assertTable(body.table);
  const auth = authorizeTable("select", table, session);
  if (!auth.allowed) {
    return textError("Forbidden", session ? 403 : 401);
  }

  const filters = applyScope(table, Array.isArray(body.filters) ? body.filters : [], auth.scopeUserId);
  const rows = body.head
    ? null
    : await fetchRows(env, table, filters, {
        columns: typeof body.columns === "string" ? body.columns : "*",
        orderBy: Array.isArray(body.orderBy) ? body.orderBy : [],
        limit: typeof body.limit === "number" ? body.limit : null,
      });

  let count: number | null = null;
  if (body.count === "exact") {
    const where = buildWhere(table, filters);
    const result = await env.DB.prepare(`SELECT COUNT(*) AS count FROM ${table}${where.sql}`)
      .bind(...where.params)
      .first<{ count: number }>();
    count = Number(result?.count || 0);
  }

  return json({
    data: rows,
    count,
  });
};

const handleDbMutation = async (
  request: Request,
  env: Env,
  session: SessionContext | null,
  action: DbAction,
) => {
  const body = await parseJsonBody(request);
  const table = assertTable(body.table);
  const auth = authorizeTable(action, table, session);
  if (!auth.allowed) {
    return textError("Forbidden", session ? 403 : 401);
  }

  const filters = applyScope(table, Array.isArray(body.filters) ? body.filters : [], auth.scopeUserId);
  const returning = typeof body.returning === "string" ? body.returning : null;

  let data: Record<string, unknown>[] | null = null;

  if (action === "insert") {
    data = await runInsert(env, table, body.values, returning, session);
  } else if (action === "update") {
    data = await runUpdate(env, table, body.values, filters, returning);
  } else if (action === "delete") {
    await runDelete(env, table, filters);
  } else if (action === "upsert") {
    data = await runUpsert(
      env,
      table,
      body.values,
      returning,
      Array.isArray(body.onConflict) ? body.onConflict.map(String) : [],
      session,
    );
  }

  return json({ data });
};

const upsertEstimateParticipants = async (
  env: Env,
  estimateId: string,
  participants: Array<Record<string, unknown>>,
  replace: boolean,
) => {
  if (replace) {
    await env.DB.prepare("DELETE FROM estimate_participants WHERE estimate_id = ?")
      .bind(estimateId)
      .run();
  }

  for (const participant of participants) {
    const prepared = await prepareInsertRecord(
      "estimate_participants",
      {
        estimate_id: estimateId,
        project_member_id: participant.project_member_id || null,
        user_id: participant.user_id,
        object_id: participant.object_id || null,
        role: participant.role,
        payout_type: participant.payout_type,
        percent_share: participant.percent_share || 0,
        fixed_amount: participant.fixed_amount || 0,
      },
      null,
      env,
    );

    const entries = Object.entries(prepared);
    await env.DB.prepare(
      `
        INSERT INTO estimate_participants (${entries.map(([column]) => column).join(", ")})
        VALUES (${entries.map(() => "?").join(", ")})
        ON CONFLICT (estimate_id, user_id, role)
        DO UPDATE SET
          project_member_id = excluded.project_member_id,
          object_id = excluded.object_id,
          payout_type = excluded.payout_type,
          percent_share = excluded.percent_share,
          fixed_amount = excluded.fixed_amount
      `,
    )
      .bind(...entries.map(([, value]) => value))
      .run();
  }

  return participants.length;
};

const handleRpc = async (request: Request, env: Env, session: SessionContext | null, name: string) => {
  if (!canManageWorkspace(session)) {
    return textError("Forbidden", session ? 403 : 401);
  }

  const body = await parseJsonBody(request);

  if (name === "assign_estimate_participants") {
    const estimateId = String(body.p_estimate_id || "");
    const payload = Array.isArray(body.p_payload) ? body.p_payload : [];
    const count = await upsertEstimateParticipants(env, estimateId, payload, !!body.p_replace);
    return json({ data: count });
  }

  if (name === "sync_estimate_participants_from_object") {
    const estimateId = String(body.p_estimate_id || "");
    const estimate = await fetchRowById(env, "estimates", estimateId);
    if (!estimate) return textError("Estimate not found", 404);
    if (!estimate.object_id) return json({ data: 0 });

    const projectMembers = await fetchRows(
      env,
      "project_members",
      [
        { op: "eq", column: "project_id", value: estimate.project_id },
        { op: "or", expression: `object_id.eq.${estimate.object_id},object_id.is.null` },
      ],
      { orderBy: [{ column: "created_at", ascending: true }] },
    );

    const payload = projectMembers.map((member) => ({
      project_member_id: member.id,
      user_id: member.user_id,
      object_id: estimate.object_id,
      role: member.role,
      payout_type: member.payout_type,
      percent_share: member.percent_share,
      fixed_amount: member.fixed_amount,
    }));

    const count = await upsertEstimateParticipants(env, estimateId, payload, true);
    return json({ data: count });
  }

  if (name === "confirm_payment_and_generate_finance") {
    const paymentId = String(body.p_payment_id || "");
    const payment = await fetchRowById(env, "payments", paymentId);
    if (!payment) return textError("Payment not found", 404);

    const actorId = session?.user.id || null;
    const confirmedAt = nowIso();
    await env.DB.prepare(
      `
        UPDATE payments
        SET status = 'confirmed',
            confirmed_at = ?,
            confirmed_by = ?,
            verified = 1,
            verified_by = ?,
            updated_at = ?
        WHERE id = ?
      `,
    )
      .bind(confirmedAt, actorId, actorId, confirmedAt, paymentId)
      .run();

    const paymentAmount = Number(payment.amount || 0);
    const paymentFees = Number(payment.fees || 0);
    await env.DB.prepare(
      `
        INSERT INTO finance_entries (
          id, type, amount, currency, source, description, estimate_id, payment_id, project_id, object_id,
          gross_amount, fees, net_amount, created_by, created_at, updated_at
        )
        VALUES (?, 'income', ?, ?, 'estimate_payment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
      .bind(
        createId(),
        paymentAmount,
        payment.currency || "RUB_PMR",
        `Payment confirmed: ${payment.reference || payment.id}`,
        payment.estimate_id,
        payment.id,
        payment.project_id || null,
        payment.object_id || null,
        Number(payment.gross_amount || paymentAmount),
        paymentFees,
        Number(payment.net_amount || paymentAmount - paymentFees),
        actorId,
        confirmedAt,
        confirmedAt,
      )
      .run();

    if (payment.account_id) {
      await env.DB.prepare(
        "UPDATE company_accounts SET balance = balance + ? WHERE id = ?",
      )
        .bind(Number(payment.net_amount || paymentAmount - paymentFees), payment.account_id)
        .run();
    }

    await env.DB.prepare(
      `
        INSERT INTO estimate_history (id, estimate_id, action, changed_by, changed_at, old_values, new_values)
        VALUES (?, ?, 'payment_confirmed', ?, ?, ?, ?)
      `,
    )
      .bind(
        createId(),
        payment.estimate_id,
        actorId,
        confirmedAt,
        JSON.stringify({ status: payment.status }),
        JSON.stringify({ status: "confirmed", amount: payment.amount }),
      )
      .run();

    await recalculatePaidAmount(env, String(payment.estimate_id));
    return json({ data: true });
  }

  if (name === "mark_employee_payout_paid" || name === "batch_mark_employee_payouts_paid") {
    const payoutIds =
      name === "mark_employee_payout_paid"
        ? [String(body.p_payout_id || "")]
        : Array.isArray(body.p_payout_ids)
          ? body.p_payout_ids.map((id: unknown) => String(id))
          : [];

    const accountId = String(body.p_account_id || "");
    const reference = body.p_reference ? String(body.p_reference) : null;
    let changed = 0;

    for (const payoutId of payoutIds.filter(Boolean)) {
      const payout = await fetchRowById(env, "employee_payouts", payoutId);
      if (!payout || payout.status === "paid") continue;

      const paidAt = nowIso();
      await env.DB.prepare(
        "UPDATE employee_payouts SET status = 'paid', paid_at = ?, reference = ? WHERE id = ?",
      )
        .bind(paidAt, reference, payoutId)
        .run();

      await env.DB.prepare(
        `
          INSERT INTO finance_entries (
            id, type, amount, currency, source, description, payout_id, project_id, object_id,
            gross_amount, fees, net_amount, created_by, created_at, updated_at
          )
          VALUES (?, 'expense', ?, 'RUB_PMR', 'system', ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
        `,
      )
        .bind(
          createId(),
          Number(payout.amount || 0),
          `Payout for ${payout.user_id}`,
          payoutId,
          payout.project_id || null,
          payout.object_id || null,
          Number(payout.amount || 0),
          Number(payout.amount || 0),
          session?.user.id || null,
          paidAt,
          paidAt,
        )
        .run();

      if (accountId) {
        await env.DB.prepare(
          "UPDATE company_accounts SET balance = balance - ? WHERE id = ?",
        )
          .bind(Number(payout.amount || 0), accountId)
          .run();
      }

      changed += 1;
    }

    return json({ data: changed });
  }

  return textError("Unknown RPC", 404);
};

const sendWebhook = async (
  url: string | undefined,
  token: string | undefined,
  payload: unknown,
) => {
  if (!url) return { delivered: false };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Webhook failed with status ${response.status}`);
  }

  return { delivered: true };
};

const handleSendRequestNotification = async (request: Request, env: Env) => {
  const payload = await parseJsonBody(request);
  const clientIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const rateCheck = await env.DB.prepare(
    `
      SELECT COUNT(*) AS count
      FROM rate_limits
      WHERE ip_address = ? AND action_type = 'request_form' AND created_at >= ?
    `,
  )
    .bind(clientIp, windowStart)
    .first<{ count: number }>();

  const requestCount = Number(rateCheck?.count || 0);
  if (requestCount >= 3) {
    return json(
      {
        success: false,
        error: "RATE_LIMITED",
      },
      429,
    );
  }

  await env.DB.prepare(
    "INSERT INTO rate_limits (id, ip_address, action_type, created_at) VALUES (?, ?, 'request_form', ?)",
  )
    .bind(createId(), clientIp, nowIso())
    .run();

  await sendWebhook(env.REQUEST_EMAIL_WEBHOOK_URL, env.REQUEST_EMAIL_WEBHOOK_TOKEN, {
    ...payload,
    ip: clientIp,
    received_at: nowIso(),
  });

  return json({
    success: true,
    remaining: Math.max(0, 2 - requestCount),
  });
};

const handleSendEstimateEmail = async (request: Request, env: Env, session: SessionContext | null) => {
  if (!canManageWorkspace(session)) {
    return textError("Forbidden", session ? 403 : 401);
  }

  const payload = await parseJsonBody(request);
  const estimateId = String(payload.estimateId || "");
  if (!estimateId) return textError("estimateId is required", 400);

  const estimate = await fetchRowById(env, "estimates", estimateId);
  if (!estimate) return textError("Estimate not found", 404);

  const lineItems = await fetchRows(
    env,
    "estimate_line_items",
    [{ op: "eq", column: "estimate_id", value: estimateId }],
    { orderBy: [{ column: "position", ascending: true }] },
  );

  await sendWebhook(env.ESTIMATE_EMAIL_WEBHOOK_URL, env.ESTIMATE_EMAIL_WEBHOOK_TOKEN, {
    ...payload,
    estimate,
    line_items: lineItems,
    requested_by: session?.user.id || null,
    requested_at: nowIso(),
  });

  if (estimate.status === "draft") {
    await env.DB.prepare(
      "UPDATE estimates SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?",
    )
      .bind(nowIso(), nowIso(), estimateId)
      .run();
  }

  const recipients = [
    estimate.client_email,
    ...(Array.isArray(payload.customEmails) ? payload.customEmails : []),
  ]
    .filter(Boolean)
    .join(", ");

  await env.DB.prepare(
    `
      INSERT INTO estimate_send_log (id, estimate_id, sent_to_email, sent_at, ip_address, status)
      VALUES (?, ?, ?, ?, ?, 'sent')
    `,
  )
    .bind(
      createId(),
      estimateId,
      recipients || "manual",
      nowIso(),
      request.headers.get("cf-connecting-ip") || "unknown",
    )
    .run();

  return json({
    success: true,
    sentCount: recipients ? recipients.split(",").filter(Boolean).length : 1,
  });
};

const handleFunction = async (
  request: Request,
  env: Env,
  session: SessionContext | null,
  name: string,
) => {
  if (name === "send-request-notification") {
    return handleSendRequestNotification(request, env);
  }

  if (name === "send-estimate-email") {
    return handleSendEstimateEmail(request, env, session);
  }

  return textError("Unknown function", 404);
};

const getBucket = (env: Env, bucket: string) => {
  if (bucket === "work-examples") {
    return env.WORK_EXAMPLES_BUCKET;
  }
  return undefined;
};

const handleStorageUpload = async (
  request: Request,
  env: Env,
  session: SessionContext | null,
  bucketName: string,
) => {
  if (!canManageWorkspace(session)) {
    return textError("Forbidden", session ? 403 : 401);
  }

  const bucket = getBucket(env, bucketName);
  if (!bucket) return textError("Bucket is not configured", 500);

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) return textError("path is required", 400);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return textError("file is required", 400);
  }

  const objectPath = path.replace(/^\/+/, "");
  await bucket.put(objectPath, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
      cacheControl: url.searchParams.get("cacheControl") || "3600",
    },
  });

  return json({ data: { path: objectPath } });
};

const handleStorageRemove = async (
  request: Request,
  env: Env,
  session: SessionContext | null,
  bucketName: string,
) => {
  if (!canManageWorkspace(session)) {
    return textError("Forbidden", session ? 403 : 401);
  }

  const bucket = getBucket(env, bucketName);
  if (!bucket) return textError("Bucket is not configured", 500);

  const body = await parseJsonBody(request);
  const paths = Array.isArray(body.paths) ? body.paths.map((path: unknown) => String(path)) : [];
  await Promise.all(
    paths
      .map((path) => path.replace(/^public\//, "").replace(/^\/+/, ""))
      .filter(Boolean)
      .map((path) => bucket.delete(path)),
  );

  return json({ data: true });
};

const handlePublicFile = async (env: Env, bucketName: string, objectPath: string) => {
  const bucket = getBucket(env, bucketName);
  if (!bucket) return textError("Bucket is not configured", 500);

  const object = await bucket.get(objectPath.replace(/^\/+/, ""));
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=3600");

  return new Response(object.body, { headers });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/+$/, "") || "/";
      const session = await getSessionContext(request, env);

      if (path === "/api/auth/signup" && request.method === "POST") {
        return signup(request, env);
      }

      if (path === "/api/auth/signin" && request.method === "POST") {
        return signin(request, env);
      }

      if (path === "/api/auth/session" && request.method === "GET") {
        return getSession(request, env);
      }

      if (path === "/api/auth/signout" && request.method === "POST") {
        return signout(request, env);
      }

      if (path === "/api/db/select" && request.method === "POST") {
        return handleDbSelect(request, env, session);
      }

      if (path === "/api/db/insert" && request.method === "POST") {
        return handleDbMutation(request, env, session, "insert");
      }

      if (path === "/api/db/update" && request.method === "POST") {
        return handleDbMutation(request, env, session, "update");
      }

      if (path === "/api/db/delete" && request.method === "POST") {
        return handleDbMutation(request, env, session, "delete");
      }

      if (path === "/api/db/upsert" && request.method === "POST") {
        return handleDbMutation(request, env, session, "upsert");
      }

      if (path.startsWith("/api/rpc/") && request.method === "POST") {
        return handleRpc(request, env, session, path.slice("/api/rpc/".length));
      }

      if (path.startsWith("/api/functions/") && request.method === "POST") {
        return handleFunction(request, env, session, path.slice("/api/functions/".length));
      }

      if (path.startsWith("/api/storage/")) {
        const storagePath = path.slice("/api/storage/".length);
        const [bucketName, action] = storagePath.split("/", 2);

        if (action === "upload" && request.method === "POST") {
          return handleStorageUpload(request, env, session, bucketName);
        }

        if (action === "remove" && request.method === "POST") {
          return handleStorageRemove(request, env, session, bucketName);
        }
      }

      if (path.startsWith("/files/") && request.method === "GET") {
        const parts = path.split("/").filter(Boolean);
        const bucketName = parts[1];
        const objectPath = decodeURIComponent(parts.slice(2).join("/"));
        return handlePublicFile(env, bucketName, objectPath);
      }

      return textError("Not found", 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return textError(message, 500);
    }
  },
};
