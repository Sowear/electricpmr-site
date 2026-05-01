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
      <div className="absolute right-0 bottom-0 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

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
