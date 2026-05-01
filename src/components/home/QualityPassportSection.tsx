import { Camera, CheckCircle2, ClipboardCheck, FileText, Gauge, ShieldCheck } from "lucide-react";

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
      <div className="tech-grid absolute inset-0 text-white/[0.08] [background-size:48px_48px]" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      
      {/* Geometric Step Divider (Architectural Transition) */}
      <div className="absolute top-0 left-0 w-full h-10 md:h-16 z-20 pointer-events-none">
        {/* Left top line */}
        <div className="absolute top-0 left-0 w-[15%] md:w-[30%] h-px bg-gradient-to-r from-transparent to-primary/60" />
        
        {/* Vertical step */}
        <div className="absolute top-0 left-[15%] md:left-[30%] w-px h-full bg-primary/60 shadow-[0_0_12px_rgba(234,179,8,0.6)]" />
        
        {/* Top corner dot */}
        <div className="absolute top-0 left-[15%] md:left-[30%] w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
        
        {/* Bottom corner dot */}
        <div className="absolute bottom-0 left-[15%] md:left-[30%] w-1.5 h-1.5 -translate-x-1/2 translate-y-1/2 bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
        
        {/* Right bottom line */}
        <div className="absolute bottom-0 left-[15%] md:left-[30%] right-0 h-px bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
        
        {/* Depth shadow - darkens the sunken right part */}
        <div className="absolute top-0 left-[15%] md:left-[30%] right-0 h-full bg-black/30" />
        
        {/* Engineering CAD hatching pattern inside the sunken part */}
        <div 
          className="absolute top-0 left-[15%] md:left-[30%] right-0 h-full opacity-[0.15]"
          style={{ 
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.4) 4px, rgba(255,255,255,0.4) 5px)' 
          }}
        />
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
