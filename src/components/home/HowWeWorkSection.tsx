import { FileText, Wrench, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Заявка",
    description: "Оставьте заявку на сайте или позвоните нам. Мы свяжемся с вами в течение 24 часов.",
  },
  {
    number: "02",
    icon: Wrench,
    title: "Осмотр и расчёт",
    description: "Специалист выезжает на объект, оценивает объём работ и составляет смету.",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Выполнение работ",
    description: "После согласования приступаем к работе. Сдаём объект с гарантией качества.",
  },
];

const HowWeWorkSection = () => {
  return (
    <section className="section-padding bg-foreground text-background">
      <div className="container-main">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Как мы работаем
          </h2>
          <p className="text-background/70 text-lg">
            Простой и понятный процесс от заявки до результата
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-background/20" />
              )}
              
              <div className="relative text-center">
                {/* Number Badge */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary mb-6">
                  <step.icon className="h-10 w-10 text-primary-foreground" />
                </div>
                
                {/* Step Number */}
                <div className="absolute top-0 right-1/3 -translate-y-2 translate-x-8 bg-background text-foreground text-xs font-bold px-2 py-1 rounded">
                  {step.number}
                </div>

                <h3 className="font-display text-xl font-semibold mb-3">
                  {step.title}
                </h3>
                <p className="text-background/70">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowWeWorkSection;