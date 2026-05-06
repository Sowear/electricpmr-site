import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Terminal, ShieldCheck } from "lucide-react";

const diagnosticLogs = [
  "> Инициализация системы проверки сети... OK",
  "> Калибровка измерительного оборудования... OK",
  "> Проверка сопротивления изоляции (R > 500 МОм)... ПРОЙДЕНО",
  "> Тест срабатывания УЗО... 30мА / 24мс... OK",
  "> Нагрузочный тест выделенных линий (25A)... СТАБИЛЬНО",
  "> Проверка контура заземления... R < 4 Ом... OK",
  "> Маркировка распределительного щита... ВЫПОЛНЕНА",
  "> Формирование паспорта качества... ГОТОВО",
  " ",
  "СИСТЕМА ДОПУЩЕНА К ЭКСПЛУАТАЦИИ. [SYS_STATUS: SECURE]",
];

const successLabels = ["OK", "ПРОЙДЕНО", "СТАБИЛЬНО", "ВЫПОЛНЕНА", "ГОТОВО"];

export default function QualityPassportSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-20% 0px" });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!isInView) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex >= diagnosticLogs.length) {
        clearInterval(interval);
        return;
      }

      const nextLog = diagnosticLogs[currentIndex];
      currentIndex += 1;

      if (typeof nextLog === "string") {
        setLogs((prev) => [...prev, nextLog]);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isInView]);

  const renderLog = (log: string) => {
    const successLabel = successLabels.find((label) => log.includes(label));

    if (successLabel) {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: log.replace(successLabel, `<span class="text-success">${successLabel}</span>`),
          }}
        />
      );
    }

    if (log.includes("SECURE")) {
      return (
        <span className="text-white font-bold bg-success/20 px-2 py-0.5 rounded flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-success" />
          {log}
        </span>
      );
    }

    return <span>{log}</span>;
  };

  return (
    <section ref={sectionRef} className="section-padding bg-secondary/35">
      <div className="container-main">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <span className="technical-label">Паспорт качества</span>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight md:text-4xl">
              В итоге видно не только как красиво, но и как правильно
            </h2>
            <p className="mt-5 mb-8 text-base leading-relaxed text-muted-foreground md:text-lg">
              Показываем не только финал, но и порядок внутри системы: как разведены линии, как подписан щит,
              как проверена защита и кто отвечает за результат. Мы выдаём паспорт качества на каждый объект.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="hud-corner relative bg-card p-4 border border-border shadow-sm">
                <div className="mb-1 font-mono text-xl font-bold text-primary">100%</div>
                <div className="text-xs text-muted-foreground">Соответствие ПУЭ</div>
              </div>
              <div className="hud-corner relative bg-card p-4 border border-border shadow-sm">
                <div className="mb-1 font-mono text-xl font-bold text-primary">5 лет</div>
                <div className="text-xs text-muted-foreground">Официальной гарантии</div>
              </div>
            </div>
          </div>

          <div className="relative flex aspect-[4/3] max-h-[500px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0c10] font-mono text-sm shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Terminal className="w-4 h-4" />
                <span>DIAGNOSTIC_TERMINAL_V2.4</span>
              </div>
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <div className="h-2.5 w-2.5 rounded-full bg-primary/80 animate-pulse" />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 top-[40px] opacity-[0.15]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />

              <svg className="h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="none">
                <path
                  d="M 0 200 Q 100 50, 200 200 T 400 200 T 600 200 T 800 200"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="800"
                  strokeDashoffset="800"
                  className="animate-[dash_3s_linear_infinite]"
                >
                  <animate
                    attributeName="d"
                    values="M 0 200 Q 100 50, 200 200 T 400 200 T 600 200 T 800 200; M 0 200 Q 100 350, 200 200 T 400 200 T 600 200 T 800 200; M 0 200 Q 100 50, 200 200 T 400 200 T 600 200 T 800 200"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </path>
                <path d="M 0 200 L 800 200" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M 400 0 L 400 400" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            </div>

            <div className="relative flex flex-1 flex-col gap-2 overflow-y-auto p-5 text-primary/90">
              {logs.map((log, index) => (
                <div key={index} className="flex opacity-0 animate-fade-in">
                  {renderLog(log)}
                </div>
              ))}

              {logs.length < diagnosticLogs.length && <div className="mt-1 h-4 w-2.5 bg-primary animate-pulse" />}
            </div>

            <div className="absolute bottom-2 right-2 text-[10px] text-white/30">SCAN_FREQ: 50Hz</div>
            <div className="absolute bottom-2 left-2 text-[10px] text-white/30">MEM: 0x8F2A</div>
          </div>
        </div>
      </div>
    </section>
  );
}
