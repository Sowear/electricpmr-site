import { Phone, Mail, MapPin, MessageCircle, Send, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

const PHONE_NUMBER = "+37377746642";
const PHONE_RAW = "37377746642";

const contactItems = [
  {
    name: "Телефон",
    value: "+373 777 46642",
    icon: Phone,
    href: `tel:${PHONE_NUMBER}`,
    color: "text-success",
  },
  {
    name: "WhatsApp",
    value: "Написать",
    icon: MessageCircle,
    href: `https://wa.me/${PHONE_RAW}`,
    color: "text-[#25D366]",
  },
  {
    name: "Viber",
    value: "Написать",
    icon: Phone,
    href: `viber://chat?number=${PHONE_RAW}`,
    color: "text-[#7360f2]",
  },
  {
    name: "Telegram",
    value: "@ElectricPMR",
    icon: Send,
    href: "https://t.me/ElectricPMR",
    color: "text-[#0088cc]",
  },
  {
    name: "Instagram",
    value: "@electricpmr",
    icon: Instagram,
    href: "https://instagram.com/electricpmr",
    color: "text-[#E4405F]",
  },
  {
    name: "Email",
    value: "mmxxnon@gmail.com",
    icon: Mail,
    href: "mailto:mmxxnon@gmail.com",
    color: "text-primary",
  },
];

const ContactSection = () => {
  return (
    <section id="contacts" className="section-padding bg-secondary/30">
      <div className="container-main">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Связаться с нами
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Выберите удобный способ связи — мы всегда на связи и готовы помочь
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {contactItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="card-industrial p-4 text-center hover:border-primary/50 transition-colors group"
            >
              <div className={`mx-auto w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-sm mb-1">{item.name}</p>
              <p className="text-xs text-muted-foreground truncate">{item.value}</p>
            </a>
          ))}
        </div>

        {/* Address */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>г. Тирасполь, Приднестровье</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
