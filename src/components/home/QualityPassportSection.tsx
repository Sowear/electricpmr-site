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
  "СИСТЕМА ДОПУЩЕНА К ЭКСПЛУАТАЦИИ. [SYS_STATUS: SECURE]"
];

export default function QualityPassportSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-20% 0px" });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!isInView) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < diagnosticLogs.length) {
        setLogs(prev => [...prev, diagnosticLogs[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800); // 800ms delay between logs

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section ref={sectionRef} className="section-padding bg-secondary/35">
      <div className="container-main">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <span className="technical-label">Паспорт качества</span>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight md:text-4xl">
              В итоге видно не только как красиво, но и как правильно
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg mb-8">
              Показываем не только финал, но и порядок внутри системы: как разведены линии, как подписан щит,
              как проверена защита и кто отвечает за результат. Мы выдаем паспорт качества на каждый объект.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="hud-corner relative p-4 bg-card border border-border shadow-sm">
                 <div className="text-primary font-mono text-xl font-bold mb-1">100%</div>
                 <div className="text-xs text-muted-foreground">Соответствие ПУЭ</div>
               </div>
               <div className="hud-corner relative p-4 bg-card border border-border shadow-sm">
                 <div className="text-primary font-mono text-xl font-bold mb-1">5 лет</div>
                 <div className="text-xs text-muted-foreground">Официальной гарантии</div>
               </div>
            </div>
          </div>

          <div className="relative rounded-xl bg-[#0a0c10] border border-white/10 shadow-2xl overflow-hidden aspect-[4/3] max-h-[500px] flex flex-col font-mono text-sm">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Terminal className="w-4 h-4" />
                <span>DIAGNOSTIC_TERMINAL_V2.4</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/80 animate-pulse" />
              </div>
            </div>

            {/* Oscilloscope Background */}
            <div className="absolute inset-0 top-[40px] opacity-[0.15] pointer-events-none">
              {/* Grid */}
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              
              {/* Sine Wave */}
              <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
                <path 
                  d="M 0 200 Q 100 50, 200 200 T 400 200 T 600 200 T 800 200" 
                  fill="none" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="2"
                  strokeDasharray="800"
                  strokeDashoffset="800"
                  className="animate-[dash_3s_linear_infinite]"
                >
                  <animate attributeName="d" values="M 0 200 Q 100 50, 200 200 T 400 200 T 600 200 T 800 200; M 0 200 Q 100 350, 200 200 T 400 200 T 600 200 T 800 200; M 0 200 Q 100 50, 200 200 T 400 200 T 600 200 T 800 200" dur="4s" repeatCount="indefinite" />
                </path>
                <path d="M 0 200 L 800 200" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M 400 0 L 400 400" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
            </div>

            {/* Terminal Content */}
            <div className="relative flex-1 p-5 overflow-y-auto text-primary/90 flex flex-col gap-2">
              {logs.map((log, index) => (
                <div key={index} className="opacity-0 animate-fade-in flex">
                  {log.includes('OK') || log.includes('ПРОЙДЕНО') || log.includes('СТАБИЛЬНО') || log.includes('ВЫПОЛНЕНА') || log.includes('ГОТОВО') ? (
                    <span dangerouslySetInnerHTML={{ __html: log.replace(/OK|ПРОЙДЕНО|СТАБИЛЬНО|ВЫПОЛНЕНА|ГОТОВО/, '<span class="text-success">$&</span>') }} />
                  ) : log.includes('SECURE') ? (
                    <span className="text-white font-bold bg-success/20 px-2 py-0.5 rounded flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-success" />
                      {log}
                    </span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
              
              {/* Blinking Cursor */}
              {logs.length < diagnosticLogs.length && (
                <div className="w-2.5 h-4 bg-primary animate-pulse mt-1" />
              )}
            </div>
            
            {/* HUD Overlays */}
            <div className="absolute bottom-2 right-2 text-[10px] text-white/30">SCAN_FREQ: 50Hz</div>
            <div className="absolute bottom-2 left-2 text-[10px] text-white/30">MEM: 0x8F2A</div>
          </div>
        </div>
      </div>
    </section>
  );
}
