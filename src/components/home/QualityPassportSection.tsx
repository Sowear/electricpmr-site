import { Camera, CheckCircle2, ClipboardCheck, FileText, Gauge, ShieldCheck } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const passportCards = [
  {
    icon: FileText,
    title: "Смета до старта",
    text: "Фиксируем объём работ, материалы и этапы до выхода на объект.",
  },
  {
    icon: ClipboardCheck,
    title: "Маркировка линий",
    text: "Подписываем группы, автоматы и ключевые точки для понятного обслуживания.",
  },
  {
    icon: Gauge,
    title: "Проверка защиты",
    text: "После монтажа проверяем нагрузку, подключение и работу защитной автоматики.",
  },
  {
    icon: Camera,
    title: "Фотоотчёт",
    text: "Показываем результат и скрытые этапы, если на объекте важен контроль каждой стадии.",
  },
];

const checklist = [
  "Понятная схема работ",
  "Аккуратный монтаж без хаоса в щите",
  "Гарантия и ответственность по договорённости",
  "Контакт с мастером на каждом этапе",
];

export default function QualityPassportSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-20% 0px" });

  return (
    <section ref={sectionRef} className="section-padding bg-secondary/35">
      <div className="container-main">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, x: -26 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -26 }}
            transition={{ duration: 0.75, delay: 0.1 }}
          >
            <span className="technical-label">Паспорт качества</span>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight md:text-4xl">
              В итоге видно не только как красиво, но и как правильно
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Показываем не только финал, но и порядок внутри системы: как разведены линии, как подписан щит,
              как проверена защита и кто отвечает за результат.
            </p>

            <div className="card-engineering mt-8 bg-card p-6 text-foreground md:p-7 shadow-lg border-border/60">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Контрольный лист объекта</div>
                  <div className="text-xs text-muted-foreground">перед сдачей работ</div>
                </div>
              </div>
              <div className="grid gap-2.5">
                {checklist.map((item) => (
                  <div key={item} className="flex items-center gap-2.5 border-b border-border/80 pb-2.5 text-sm text-foreground/80 last:border-none last:pb-0">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
            transition={{ duration: 0.75, delay: 0.22 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {passportCards.map((card, index) => (
              <div key={card.title} className="card-industrial p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10">
                    <card.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-foreground">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
