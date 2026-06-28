// ============================================================
// ElectricPMR — Project Serializer
// ============================================================
//
// Project → DTO → Storage
// Никогда не сохранять внутренние структуры напрямую.
// ============================================================

import type { UUID } from "../types/common"
import type { UniversalObject } from "./universalObject"
import { ObjectRegistry } from "./objectRegistry"
import { RelationshipSystem, type Relationship } from "./relationshipSystem"

// ============================================================
// SERIALIZER
// ============================================================

class ProjectSerializerImpl {
  private currentVersion = 3
  private currentSchemaVersion = "1.0.0"

  // --- Сериализация ---

  serialize(project: ProjectData): SerializedProject {
    const checksum = this.calculateChecksum(project)

    return {
      version: this.currentVersion,
      schemaVersion: this.currentSchemaVersion,
      migrationVersion: 0,
      checksum,
      metadata: {
        name: project.name,
        description: project.description,
        author: project.author,
        createdAt: project.createdAt,
        modifiedAt: new Date(),
        tags: project.tags,
      },
      objects: project.objects,
      relationships: project.relationships,
    }
  }

  // --- Десериализация ---

  deserialize(data: SerializedProject): ProjectData {
    // Проверка версии
    if (data.version > this.currentVersion) {
      throw new Error(`Unsupported version: ${data.version}`)
    }

    // Проверка контрольной суммы
    const { objects, relationships, metadata, ...rest } = data
    const checksumData = { objects, relationships, metadata }
    if (data.checksum !== this.calculateChecksum(checksumData)) {
      console.warn("Checksum mismatch — data may be corrupted")
    }

    return {
      name: metadata.name,
      description: metadata.description,
      author: metadata.author,
      createdAt: new Date(metadata.createdAt),
      tags: metadata.tags,
      objects,
      relationships,
    }
  }

  // --- Восстановление в Registry ---

  restoreToRegistry(data: SerializedProject): void {
    const project = this.deserialize(data)

    // Очищаем текущее состояние
    ObjectRegistry.clear()
    RelationshipSystem.clear()

    // Восстанавливаем объекты
    for (const obj of project.objects) {
      ObjectRegistry.add(obj)
    }

    // Восстанавливаем связи
    for (const rel of project.relationships) {
      try {
        RelationshipSystem.add(rel.from, rel.to, rel.type, rel.metadata)
      } catch (err) {
        console.warn(`Failed to restore relationship ${rel.id}:`, err)
      }
    }
  }

  // --- Экспорт в JSON ---

  toJSON(project: ProjectData): string {
    const serialized = this.serialize(project)
    return JSON.stringify(serialized, null, 2)
  }

  // --- Экспорт в Compressed JSON ---

  toCompressedJSON(project: ProjectData): string {
    const serialized = this.serialize(project)
    // Минифицируем
    return JSON.stringify(serialized)
  }

  // --- Импорт из JSON ---

  fromJSON(json: string): SerializedProject {
    const data = JSON.parse(json) as SerializedProject
    return data
  }

  // --- Проверка совместимости ---

  isCompatible(data: SerializedProject): CompatibilityResult {
    const issues: CompatibilityIssue[] = []

    if (data.version > this.currentVersion) {
      issues.push({
        severity: "error",
        message: `Version ${data.version} is newer than supported ${this.currentVersion}`,
      })
    }

    if (data.version < this.currentVersion) {
      issues.push({
        severity: "info",
        message: `Version ${data.version} will be migrated to ${this.currentVersion}`,
      })
    }

    return {
      compatible: issues.filter(i => i.severity === "error").length === 0,
      issues,
    }
  }

  // --- Информация о формате ---

  getFormatInfo(): FormatInfo {
    return {
      version: this.currentVersion,
      schemaVersion: this.currentSchemaVersion,
      features: [
        "universal_object_model",
        "relationships",
        "dependencies",
        "validation",
        "lifecycle",
      ],
    }
  }

  // --- Приватные методы ---

  private calculateChecksum(data: unknown): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16)
  }
}

// ============================================================
// ТИПЫ
// ============================================================

export interface ProjectData {
  name: string
  description?: string
  author?: string
  createdAt: Date
  tags: string[]
  objects: UniversalObject[]
  relationships: Relationship[]
}

export interface SerializedProject {
  version: number
  schemaVersion: string
  migrationVersion: number
  checksum: string
  metadata: {
    name: string
    description?: string
    author?: string
    createdAt: Date
    modifiedAt: Date
    tags: string[]
  }
  objects: UniversalObject[]
  relationships: Relationship[]
}

export interface CompatibilityResult {
  compatible: boolean
  issues: CompatibilityIssue[]
}

export interface CompatibilityIssue {
  severity: "error" | "warning" | "info"
  message: string
}

export interface FormatInfo {
  version: number
  schemaVersion: string
  features: string[]
}

// ============================================================
// СИНГЛТОН
// ============================================================

export const ProjectSerializer = new ProjectSerializerImpl()
