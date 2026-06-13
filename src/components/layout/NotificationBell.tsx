import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from "@/hooks/useNotifications";
// react-router-dom removed
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const NOTIFICATION_ICONS: Record<string, string> = {
  status_change: "📋",
  payment_confirmed: "💰",
  estimate_sent: "📧",
  new_version_created: "📄",
  info: "ℹ️",
};

const NotificationBell = () => {
  const { data: notifications, unreadCount } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();
  // useNavigate removed

  const handleClick = (notification: any) => {
    if (notification.status === "unread") {
      markRead.mutate(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `Уведомления: ${unreadCount} непрочитанных` : "Уведомления"}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge aria-hidden="true" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Уведомления</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3 w-3" />
              Прочитать все
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                    n.status === "unread" ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex gap-2">
                    <span className="text-sm shrink-0">
                      {NOTIFICATION_ICONS[n.type] || "📌"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.status === "unread" ? "font-medium" : ""}`}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {n.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ru })}
                      </p>
                    </div>
                    {n.link && (
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Нет уведомлений
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
