// ============================================================
// ElectricPMR — Cloud Persistence (Supabase)
// ============================================================
//
// Handles cloud save/load/sync for projects via Supabase.
// Falls back to localStorage when offline or unauthenticated.
// ============================================================

import { supabase } from "../../integrations/supabase/client"
import type { ProjectState } from "../../stores/projectStore"

type PersistedProject = Pick<ProjectState,
  "id" | "name" | "description" | "type" | "phase" | "status" | "scene" | "electrical" | "validation" | "aiState"
>

export interface CloudProjectMeta {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface SyncResult {
  success: boolean
  conflict?: boolean
  serverVersion?: PersistedProject
  error?: string
}

const TABLE = "projects"

// ============================================================
// CRUD Operations
// ============================================================

export async function saveToCloud(state: PersistedProject): Promise<{ id: string; error: string | null }> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session) {
    return { id: state.id, error: "Необходима авторизация для сохранения в облако" }
  }

  const userId = session.session.user.id
  const now = new Date().toISOString()

  const record = {
    id: state.id || `project_${Date.now()}`,
    user_id: userId,
    name: state.name || "Новый проект",
    description: state.description || "",
    data: JSON.stringify(state),
    created_at: now,
    updated_at: now,
  }

  const { error } = await supabase
    .from(TABLE)
    .upsert(record, { onConflict: "id" })

  if (error) {
    return { id: record.id, error: error.message }
  }

  return { id: record.id, error: null }
}

export async function loadFromCloud(id: string): Promise<{ data: PersistedProject | null; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("id", id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data?.data) {
    return { data: null, error: "Проект не найден" }
  }

  try {
    const parsed = JSON.parse(data.data) as PersistedProject
    return { data: parsed, error: null }
  } catch {
    return { data: null, error: "Ошибка парсинга данных проекта" }
  }
}

export async function listCloudProjects(): Promise<{ data: CloudProjectMeta[]; error: string | null }> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, description, created_at, updated_at, user_id")
    .order("updated_at", { ascending: false })

  if (error) {
    return { data: [], error: error.message }
  }

  return {
    data: (data || []) as CloudProjectMeta[],
    error: null,
  }
}

export async function deleteFromCloud(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)

  return { error: error?.message ?? null }
}

export async function duplicateInCloud(id: string, newName?: string): Promise<{ id: string | null; error: string | null }> {
  const { data: original, error: loadError } = await loadFromCloud(id)
  if (loadError || !original) {
    return { id: null, error: loadError ?? "Проект не найден" }
  }

  const newId = `project_${Date.now()}`
  const duplicated: PersistedProject = {
    ...original,
    id: newId,
    name: newName ?? `${original.name} копия`,
  }

  const result = await saveToCloud(duplicated)
  return { id: result.id, error: result.error }
}

// ============================================================
// Sync (with conflict detection)
// ============================================================

export async function syncToCloud(
  state: PersistedProject,
  lastSyncedAt?: string
): Promise<SyncResult> {
  const { data: session } = await supabase.auth.getSession()
  if (!session?.session) {
    return { success: false, error: "Не авторизован" }
  }

  if (lastSyncedAt) {
    const { data: existing } = await supabase
      .from(TABLE)
      .select("updated_at, data")
      .eq("id", state.id)
      .single()

    if (existing?.updated_at && existing.updated_at > lastSyncedAt) {
      try {
        const serverVersion = JSON.parse(existing.data) as PersistedProject
        return { success: false, conflict: true, serverVersion }
      } catch {
        return { success: false, error: "Конфликт версий" }
      }
    }
  }

  const result = await saveToCloud(state)
  return { success: !result.error, error: result.error ?? undefined }
}
