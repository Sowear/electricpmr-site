import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Send, Loader2, Users, Wrench, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SendEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimateId: string;
  clientEmail?: string;
}

const SendEstimateDialog = ({ open, onOpenChange, estimateId, clientEmail }: SendEstimateDialogProps) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const [toClient, setToClient] = useState(true);
  const [toManager, setToManager] = useState(true);
  const [toTechnician, setToTechnician] = useState(false);
  const [includePricesForTech, setIncludePricesForTech] = useState(false);
  const [customEmails, setCustomEmails] = useState("mmxxnon@gmail.com");
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    setSending(true);
    try {
      const emails = customEmails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      const { data, error } = await supabase.functions.invoke("send-estimate-email", {
        body: {
          estimateId,
          toClient,
          toManager,
          toTechnician,
          includePricesForTechnician: includePricesForTech,
          customEmails: emails,
          message: message || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Смета отправлена!",
        description: `Отправлено ${data?.sentCount || 1} получателям`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Ошибка отправки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Отправить смету
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Получатели</h4>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
              <Checkbox checked={toClient} onCheckedChange={(v) => setToClient(!!v)} />
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Клиент</p>
                <p className="text-xs text-muted-foreground">{clientEmail || "Email не указан"}</p>
              </div>
              <Badge variant="outline" className="text-xs">Полная версия</Badge>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
              <Checkbox checked={toManager} onCheckedChange={(v) => setToManager(!!v)} />
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Менеджер</p>
                <p className="text-xs text-muted-foreground">mmxxnon@gmail.com</p>
              </div>
              <Badge variant="outline" className="text-xs">Полная версия</Badge>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
              <Checkbox checked={toTechnician} onCheckedChange={(v) => setToTechnician(!!v)} />
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Электрик</p>
                <p className="text-xs text-muted-foreground">Копия без цен</p>
              </div>
              <Badge variant="secondary" className="text-xs">Без цен</Badge>
            </label>

            {toTechnician && (
              <label className="flex items-center gap-3 pl-10 cursor-pointer">
                <Checkbox checked={includePricesForTech} onCheckedChange={(v) => setIncludePricesForTech(!!v)} />
                <span className="text-xs text-muted-foreground">Включить цены для электрика (не рекомендуется)</span>
              </label>
            )}
          </div>

          {/* Custom emails */}
          <div>
            <label className="text-sm font-medium mb-1 block">Дополнительные email (через запятую)</label>
            <Input
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium mb-1 block">Сообщение (необязательно)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Добавьте сообщение к смете..."
              rows={2}
            />
          </div>

          {!clientEmail && toClient && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Email клиента не указан. Клиент не получит письмо.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendEstimateDialog;
