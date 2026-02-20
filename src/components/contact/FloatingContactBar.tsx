import { Phone, MessageCircle, Send } from "lucide-react";

const PHONE_NUMBER = "+37377746642";
const PHONE_RAW = "37377746642";

const contacts = [
  {
    name: "Позвонить",
    icon: Phone,
    href: `tel:${PHONE_NUMBER}`,
    color: "bg-success",
  },
  {
    name: "WhatsApp",
    icon: MessageCircle,
    href: `https://wa.me/${PHONE_RAW}`,
    color: "bg-[#25D366]",
  },
  {
    name: "Telegram",
    icon: Send,
    href: "https://t.me/ElectricPMR",
    color: "bg-[#0088cc]",
  },
];

const FloatingContactBar = () => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
      <div className="flex items-center gap-2 bg-foreground/95 backdrop-blur-sm rounded-full px-2 py-2 shadow-lg">
        {contacts.map((contact) => (
          <a
            key={contact.name}
            href={contact.href}
            target={contact.href.startsWith("http") ? "_blank" : undefined}
            rel={contact.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className={`flex items-center justify-center w-12 h-12 rounded-full ${contact.color} text-white transition-transform hover:scale-110 active:scale-95`}
            aria-label={contact.name}
          >
            <contact.icon className="h-5 w-5" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default FloatingContactBar;
