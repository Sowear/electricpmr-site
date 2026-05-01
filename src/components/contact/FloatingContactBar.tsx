import { Phone, MessageCircle, Send } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 150);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 md:hidden transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-foreground/95 px-2 py-1.5 shadow-[0_18px_50px_-22px_rgba(0,0,0,0.75)] backdrop-blur-md">
        {contacts.map((contact) => (
          <a
            key={contact.name}
            href={contact.href}
            target={contact.href.startsWith("http") ? "_blank" : undefined}
            rel={contact.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className={`flex items-center justify-center w-10 h-10 rounded-full ${contact.color} text-white transition-transform hover:scale-110 active:scale-95`}
            aria-label={contact.name}
          >
            <contact.icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default FloatingContactBar;
