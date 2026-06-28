// ============================================================
// ElectricPMR — Benchmark Suite
// ============================================================
//
// Автоматические тесты производительности.
// Не для оптимизации сегодня, а чтобы видеть деградацию
// производительности в будущем.
// ============================================================

import { EngineFacade } from "../facade/engineFacade"
import { ComponentStore } from "../core/ecs"
import { RelationshipSystem } from "../core/relationshipSystem"

// ============================================================
// BENCHMARK INTERFACE
// ============================================================

interface Benchmark {
  name: string
  description: string
  setup?: () => void
  run: () => void
  iterations: number
}

interface BenchmarkResult {
  name: string
  description: string
  iterations: number
  totalTime: number // мс
  avgTime: number // мс
  opsPerSecond: number
  memoryDelta?: number // байт
}

// ============================================================
// BENCHMARKS
// ============================================================

export const BENCHMARKS: Benchmark[] = [
  // --- Создание 10 000 объектов ---
  {
    name: "create_10000_entities",
    description: "Создание 10 000 сущностей с компонентами",
    iterations: 100,
    run: () => {
      for (let i = 0; i < 10000; i++) {
        EngineFacade.createEntity({
          identity: {
            name: `Object ${i}`,
            type: "outlet",
            version: 1,
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
          geometry: {
            x: Math.random() * 10000,
            y: Math.random() * 10000,
            rotation: 0,
            width: 72,
            height: 72,
          },
          electrical: {
            power: 100,
            voltage: 220,
            current: 0.45,
          },
        })
      }
    },
  },

  // --- Перемещение 1 000 объектов ---
  {
    name: "move_1000_entities",
    description: "Перемещение 1 000 объектов",
    setup: () => {
      // Создаём объекты
      for (let i = 0; i < 1000; i++) {
        EngineFacade.createEntity({
          identity: {
            name: `Object ${i}`,
            type: "outlet",
            version: 1,
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
          geometry: {
            x: i * 100,
            y: i * 100,
            rotation: 0,
            width: 72,
            height: 72,
          },
        })
      }
    },
    iterations: 100,
    run: () => {
      const entities = ComponentStore.queryByComponent("geometry")
      for (const entity of entities.slice(0, 1000)) {
        EngineFacade.moveEntity(entity.entityId, entity.data.x + 10, entity.data.y + 10)
      }
    },
  },

  // --- Пересчёт 100 групп ---
  {
    name: "recalculate_100_groups",
    description: "Пересчёт 100 электрических групп",
    setup: () => {
      const panel = EngineFacade.createPanel(200, 100)

      for (let g = 0; g < 100; g++) {
        const breaker = EngineFacade.createBreaker(panel, { rating: 16 })

        for (let i = 0; i < 8; i++) {
          const outlet = EngineFacade.createOutlet(500 + g * 200, 300 + i * 100)
          EngineFacade.addRelationship(outlet, breaker, "poweredBy")
        }
      }
    },
    iterations: 50,
    run: () => {
      // Пересчитываем нагрузки
      const entities = ComponentStore.queryByComponent("electrical")
      let totalPower = 0
      for (const entity of entities) {
        if (entity.data.power) {
          totalPower += entity.data.power
        }
      }
    },
  },

  // --- Undo 5 000 операций ---
  {
    name: "undo_5000_operations",
    description: "Откат 5 000 операций",
    setup: () => {
      // Создаём 5000 объектов через транзакции
      for (let i = 0; i < 5000; i++) {
        EngineFacade.createEntity({
          identity: {
            name: `Object ${i}`,
            type: "outlet",
            version: 1,
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
          geometry: {
            x: i * 10,
            y: i * 10,
            rotation: 0,
            width: 72,
            height: 72,
          },
        })
      }
    },
    iterations: 1,
    run: () => {
      // Откатываем
      for (let i = 0; i < 5000; i++) {
        // В реальном продукте здесь будет TransactionEngine.undo()
        // Пока просто удаляем
        const entities = ComponentStore.getAllEntities()
        if (entities.length > 0) {
          ComponentStore.destroyEntity(entities[entities.length - 1])
        }
      }
    },
  },

  // --- Поиск объектов ---
  {
    name: "search_10000_entities",
    description: "Поиск среди 10 000 объектов",
    setup: () => {
      for (let i = 0; i < 10000; i++) {
        EngineFacade.createEntity({
          identity: {
            name: `Object ${i % 100}`,
            type: i % 2 === 0 ? "outlet" : "light_ceiling",
            version: 1,
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
          metadata: {
            tags: ["test", i % 10 === 0 ? "special" : "common"],
            custom: {},
          },
        })
      }
    },
    iterations: 100,
    run: () => {
      ComponentStore.queryByComponent("identity")
    },
  },

  // --- Сериализация/десериализация ---
  {
    name: "serialize_deserialize",
    description: "Сериализация и десериализация проекта с 5 000 объектов",
    setup: () => {
      for (let i = 0; i < 5000; i++) {
        EngineFacade.createEntity({
          identity: {
            name: `Object ${i}`,
            type: "outlet",
            version: 1,
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
          geometry: {
            x: i * 10,
            y: i * 10,
            rotation: 0,
            width: 72,
            height: 72,
          },
          electrical: {
            power: 100,
            voltage: 220,
            current: 0.45,
          },
        })
      }
    },
    iterations: 10,
    run: () => {
      const json = EngineFacade.exportJSON()
      EngineFacade.clear()
      EngineFacade.importJSON(json)
    },
  },
]

// ============================================================
// RUNNER
// ============================================================

export function runBenchmark(benchmark: Benchmark): BenchmarkResult {
  // Очищаем перед каждым запуском
  EngineFacade.clear()

  // Setup
  benchmark.setup?.()

  // Прогрев
  benchmark.run()

  // Замер
  const start = performance.now()
  for (let i = 0; i < benchmark.iterations; i++) {
    benchmark.run()
  }
  const totalTime = performance.now() - start

  const avgTime = totalTime / benchmark.iterations
  const opsPerSecond = (benchmark.iterations / totalTime) * 1000

  return {
    name: benchmark.name,
    description: benchmark.description,
    iterations: benchmark.iterations,
    totalTime,
    avgTime,
    opsPerSecond,
  }
}

export function runAllBenchmarks(): BenchmarkResult[] {
  return BENCHMARKS.map(runBenchmark)
}

export function formatBenchmarkResult(result: BenchmarkResult): string {
  return [
    `${result.name}:`,
    `  ${result.description}`,
    `  Iterations: ${result.iterations}`,
    `  Total: ${result.totalTime.toFixed(2)}ms`,
    `  Avg: ${result.avgTime.toFixed(4)}ms`,
    `  Ops/sec: ${result.opsPerSecond.toFixed(0)}`,
  ].join("\n")
}
