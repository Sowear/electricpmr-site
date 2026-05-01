import { Camera, CheckCircle2, ClipboardCheck, FileText, Gauge, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const passportCards = [
  {
    icon: FileText,
    title: "Смета до старта",
    text: "Фиксируем объём работ, материалы и этапы до выхода на объект.",
  },
  {
    icon: ClipboardCheck,
    title: "Маркировка линий",
    text: "Подписываем группы, автоматы и ключевые точки, чтобы систему было легко обслуживать.",
  },
  {
    icon: Gauge,
    title: "Проверка защиты",
    text: "После монтажа проверяем подключение, нагрузку и работу защитной автоматики.",
  },
  {
    icon: Camera,
    title: "Фотоотчёт",
    text: "Показываем результат и скрытые этапы, если объект требует поэтапного контроля.",
  },
];

const checklist = [
  "Понятная схема работ",
  "Аккуратный монтаж без хаоса в щите",
  "Гарантия и ответственность по договорённости",
  "Контакт с мастером на каждом этапе",
];

export default function QualityPassportSection() {
  return (
    <section className="relative overflow-hidden bg-industrial-dark py-14 text-white md:py-20">
      {/* The Wire Tracker Transition */}
      <div className="absolute top-0 left-0 w-full h-32 z-20 pointer-events-none flex justify-center">
        {/* Subtle horizontal separator */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <svg width="240" height="128" viewBox="0 0 240 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
          {/* Faint track */}
          <path d="M120,0 L120,24 L160,24 L160,64 L80,64 L80,104 L120,104 L120,128" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinejoin="bevel" />
          
          {/* Animated current (wire) */}
          <motion.path 
            d="M120,0 L120,24 L160,24 L160,64 L80,64 L80,104 L120,104 L120,128" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinejoin="bevel" 
            className="text-primary"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.2, 0.8, 1] }}
          />
          
          {/* Static glowing nodes at corners */}
          <circle cx="120" cy="24" r="2" fill="currentColor" className="text-primary/70" />
          <circle cx="160" cy="24" r="2" fill="currentColor" className="text-primary/70" />
          <circle cx="160" cy="64" r="2" fill="currentColor" className="text-primary/70" />
          <circle cx="80" cy="64" r="2" fill="currentColor" className="text-primary/70" />
          <circle cx="80" cy="104" r="2" fill="currentColor" className="text-primary/70" />
          <circle cx="120" cy="104" r="2" fill="currentColor" className="text-primary/70" />
          
          {/* End connection node */}
          <circle cx="120" cy="128" r="3" fill="currentColor" className="text-primary" />
          <circle cx="120" cy="128" r="6" fill="currentColor" className="text-primary opacity-20 animate-ping" />
        </svg>
      </div>
      
      {/* Bottom diffusion to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-10 md:h-12 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      {/* Glow divider line */}
      <div className="absolute right-0 bottom-0 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent z-20" />

      <div className="container-main relative z-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="technical-label mb-5">Паспорт качества</span>
            <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              Инженерная аккуратность, которую видно в каждой детали
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/[0.68] md:text-lg">
              Мы показываем не только красивый финал, но и порядок внутри системы: как разведены линии,
              как подписан щит, как проверена защита и за что именно отвечает мастер.
            </p>

            <div className="mt-8 rounded-xl border border-white/[0.12] bg-white/[0.06] p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Контрольный лист объекта</div>
                  <div className="text-xs text-white/50">перед сдачей работ</div>
                </div>
              </div>
              <div className="grid gap-2">
                {checklist.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2 text-sm text-white/[0.78]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {passportCards.map((card, index) => (
              <div key={card.title} className="group relative min-h-[190px] overflow-hidden rounded-xl border border-white/[0.12] bg-white/[0.07] p-5 backdrop-blur-sm transition-colors hover:border-primary/55 hover:bg-white/[0.09]">
                <div className="absolute right-4 top-4 text-xs font-semibold text-white/20 transition-colors group-hover:text-primary/70">
                  0{index + 1}
                </div>
                <card.icon className="mb-6 h-7 w-7 text-primary" />
                <h3 className="font-display text-xl font-semibold">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/[0.62]">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
