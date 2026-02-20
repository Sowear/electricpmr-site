import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Send } from "lucide-react";

interface EmergencyCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PHONE_NUMBER = "+37377746642";
const PHONE_RAW = "37377746642";

const contactOptions = [
  {
    name: "Позвонить сейчас",
    icon: Phone,
    href: `tel:${PHONE_NUMBER}`,
    color: "bg-success hover:bg-success/90",
    description: "Прямой звонок",
  },
  {
    name: "WhatsApp",
    icon: MessageCircle,
    href: `https://wa.me/${PHONE_RAW}`,
    color: "bg-[#25D366] hover:bg-[#25D366]/90",
    description: "Написать в WhatsApp",
  },
  {
    name: "Viber",
    icon: Phone,
    href: `viber://chat?number=${PHONE_RAW}`,
    color: "bg-[#7360f2] hover:bg-[#7360f2]/90",
    description: "Написать в Viber",
  },
  {
    name: "Telegram",
    icon: Send,
    href: "https://t.me/ElectricPMR",
    color: "bg-[#0088cc] hover:bg-[#0088cc]/90",
    description: "Написать в Telegram",
  },
];

const EmergencyCallDialog = ({ open, onOpenChange }: EmergencyCallDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-display flex items-center justify-center gap-2">
            <span className="animate-pulse text-destructive">⚡</span>
            Аварийный вызов
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Если нет света — звоните немедленно!
            <br />
            <span className="font-semibold text-foreground">Выезд в день обращения</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {contactOptions.map((option) => (
            <Button
              key={option.name}
              asChild
              size="lg"
              className={`w-full h-14 text-lg font-semibold text-white ${option.color}`}
            >
              <a
                href={option.href}
                target={option.href.startsWith("http") ? "_blank" : undefined}
                rel={option.href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                <option.icon className="mr-3 h-6 w-6" />
                {option.name}
              </a>
            </Button>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Работаем 24/7 для аварийных вызовов
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyCallDialog;
