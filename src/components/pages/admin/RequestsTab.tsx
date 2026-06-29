import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Filter, Phone, Trash2, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  type Request, type RequestStatus, type StaffMember,
  statusConfig, STATUS_ORDER,
} from "./adminTypes";

const UNASSIGNED = "__unassigned__";

interface RequestsTabProps {
  requests: Request[];
  staff: StaffMember[];
  staffNameById: Map<string, string>;
  onUpdateStatus: (id: string, status: RequestStatus) => void;
  onAssign: (id: string, userId: string | null) => void;
  onDelete: (id: string) => void;
}

export default function RequestsTab({ requests, staff, staffNameById, onUpdateStatus, onAssign, onDelete }: RequestsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Request | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(searchQuery) ||
        r.service_type.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  // Keep the selected card in sync with the latest data (status/assignment changes).
  const selected = selectedId ? requests.find((r) => r.id === selectedId) ?? null : null;

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по имени, телефону, услуге..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="new">Новые</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="done">Выполненные</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 card-industrial"><p className="text-muted-foreground">Заявок не найдено</p></div>
          ) : (
            filtered.map((request) => {
              const status = statusConfig[request.status];
              const StatusIcon = status.icon;
              const assignedName = request.assigned_to ? staffNameById.get(request.assigned_to) : null;
              return (
                <div key={request.id} className={`card-industrial p-4 cursor-pointer ${selectedId === request.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedId(request.id)}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold truncate">{request.name}</h3>
                        <span className={`badge-status ${status.class} flex-shrink-0`}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</span>
                        {assignedName && <Badge variant="outline" className="text-xs"><UserCheck className="h-3 w-3 mr-1" />{assignedName}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{request.service_type} • {request.phone}</p>
                      {request.source && <Badge variant="outline" className="text-xs mt-1">{request.source}</Badge>}
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(request.created_at), "d MMM yyyy, HH:mm", { locale: ru })}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div>
          {selected ? (
            <div className="card-industrial p-6 sticky top-24 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">Детали заявки</h3>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setPendingDelete(selected)} aria-label="Удалить заявку">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Имя</p><p className="font-medium">{selected.name}</p></div>
                <div>
                  <p className="text-muted-foreground">Телефон</p>
                  <a href={`tel:${selected.phone}`} className="font-medium text-primary inline-flex items-center gap-1 hover:underline">
                    <Phone className="h-3 w-3" />{selected.phone}
                  </a>
                </div>
                <div className="col-span-2"><p className="text-muted-foreground">Услуга</p><p className="font-medium">{selected.service_type}</p></div>
                {selected.address && <div className="col-span-2"><p className="text-muted-foreground">Адрес</p><p>{selected.address}</p></div>}
                {selected.description && <div className="col-span-2"><p className="text-muted-foreground">Комментарий</p><p>{selected.description}</p></div>}
                <div className="col-span-2"><p className="text-muted-foreground">Дата создания</p><p>{format(new Date(selected.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}</p></div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Изменить статус</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ORDER.map((s) => (
                    <Button key={s} size="sm" variant={selected.status === s ? "default" : "outline"} onClick={() => onUpdateStatus(selected.id, s)}>
                      {statusConfig[s].label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Исполнитель</p>
                <Select
                  value={selected.assigned_to ?? UNASSIGNED}
                  onValueChange={(value) => onAssign(selected.id, value === UNASSIGNED ? null : value)}
                >
                  <SelectTrigger><SelectValue placeholder="Не назначен" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Не назначен</SelectItem>
                    {staff.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="card-industrial p-6 text-center text-muted-foreground"><p>Выберите заявку</p></div>
          )}
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Заявка «{pendingDelete?.name}» ({pendingDelete?.service_type}) будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) {
                  if (selectedId === pendingDelete.id) setSelectedId(null);
                  onDelete(pendingDelete.id);
                }
                setPendingDelete(null);
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
