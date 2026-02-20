import { Link } from "react-router-dom";
import { Home, Building, Construction, Cable, Zap, Plug, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Home,
    title: "Электромонтаж в квартирах",
    description: "Полный комплекс работ по электрике в квартирах любой планировки",
  },
  {
    icon: Building,
    title: "Электромонтаж в домах",
    description: "Электрификация частных домов и коттеджей под ключ",
  },
  {
    icon: Construction,
    title: "Монтаж в новостройках",
    description: "Разводка электрики с нуля в новых зданиях",
  },
  {
    icon: Cable,
    title: "Замена проводки",
    description: "Полная или частичная замена устаревшей проводки",
  },
  {
    icon: Zap,
    title: "Установка щитков",
    description: "Монтаж и сборка электрощитов любой сложности",
  },
  {
    icon: Plug,
    title: "Подключение техники",
    description: "Установка розеток, выключателей, подключение бытовой техники",
  },
];

const ServicesSection = () => {
  return (
    <section className="section-padding">
      <div className="container-main">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Наши услуги
          </h2>
          <p className="text-muted-foreground text-lg">
            Полный спектр электромонтажных работ для жилых и коммерческих объектов
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="card-industrial p-6 group cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <service.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button variant="outline" size="lg" asChild>
            <Link to="/features" className="group">
              Все услуги
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;