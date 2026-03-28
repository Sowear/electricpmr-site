import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Info, Loader2, Plus, UserPlus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import {
  useAssignEstimateParticipants,
  useEstimateParticipants,
  usePrefillEstimateParticipantsFromObject,
  useRemoveEstimateParticipant,
} from "@/hooks/useEstimateParticipants";
import { useProjectMembers } from "@/hooks/useProjects";

type PayoutType = "percent_profit" | "percent_revenue" | "fixed" | "hybrid";
type MemberRole = "manager" | "technician" | "organizer";

interface EstimateParticipantsPanelProps {
  estimateId: string;
  projectId?: string;
  objectId?: string | null;
  readOnly?: boolean;
}

const SYSTEM_ROLE_LABELS: Record<string, string> = {
  super_admin: "Супер-админ",
  admin: "Админ",
  manager: "Менеджер",
  technician: "Электрик",
  organizer: "Организатор",
  user: "Пользователь",
  guest: "Гость",
};

const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  manager: "Менеджер",
  technician: "Электрик",
  organizer: "Организатор",
};

const PAYOUT_TYPE_OPTIONS: Array<{ value: PayoutType; label: string; hint: string }> = [
  {
    value: "percent_profit",
    label: "Процент от прибыли",
    hint: "Процент от прибыли — рассчитывается после вычета расходов проекта.",
  },
  {
    value: "percent_revenue",
    label: "Процент от выручки",
    hint: "Процент от выручки — рассчитывается от всех подтвержденных доходов объекта.",
  },
  {
    value: "fixed",
    label: "Фиксированная сумма",
    hint: "Фикс — выплачивается независимо от прибыли или выручки.",
  },
  {
    value: "hybrid",
    label: "Гибрид",
    hint: "Гибрид = фиксированная сумма + процент от прибыли.",
  },
];

const EstimateParticipantsPanel = ({
  estimateId,
  projectId,
  objectId,
  readOnly,
}: EstimateParticipantsPanelProps) => {
  const { data: participants } = useEstimateParticipants(estimateId);
  const { data: projectMembers } = useProjectMembers(projectId, objectId || undefined);
  const assignParticipant = useAssignEstimateParticipants();
  const removeParticipant = useRemoveEstimateParticipant();
  const prefillFromObject = usePrefillEstimateParticipantsFromObject();

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState<MemberRole>("technician");
  const [payoutType, setPayoutType] = useState<PayoutType>("percent_profit");
  const [percentShare, setPercentShare] = useState<string>("");
  const [fixedAmount, setFixedAmount] = useState<string>("");

  const { data: profileRows } = useQuery({
    queryKey: ["participant-profiles"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, name")
        .order("name", { ascending: true });
      if (profilesError) throw profilesError;

      const userIds = (profiles || []).map((p: any) => p.user_id);
      const { data: rolesData } = userIds.length
        ? await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("user_id", userIds)
        : { data: [] as any[] };

      const priority: Record<string, number> = {
        super_admin: 6,
        admin: 5,
        manager: 4,
        technician: 3,
        organizer: 2,
        user: 1,
        guest: 0,
      };

      const topRoleByUser: Record<string, string> = {};
      (rolesData || []).forEach((r: any) => {
        const current = topRoleByUser[r.user_id];
        if (!current || (priority[r.role] || 0) > (priority[current] || 0)) {
          topRoleByUser[r.user_id] = r.role;
        }
      });

      return (profiles || []).map((p: any) => ({
        user_id: p.user_id,
        name: p.name || "Без имени",
        role: topRoleByUser[p.user_id] || "user",
      }));
    },
  });

  const profileByUserId = useMemo(() => {
    const map: Record<string, { user_id: string; name: string; role: string }> = {};
    (profileRows || []).forEach((p) => {
      map[p.user_id] = p;
    });
    return map;
  }, [profileRows]);

  const existingUserIds = useMemo(() => {
    return new Set((participants || []).map((p) => p.user_id));
  }, [participants]);

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (profileRows || []).filter((p) => {
      if (existingUserIds.has(p.user_id)) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q);
    });
  }, [profileRows, search, existingUserIds]);

  const availableProjectMembers = useMemo(() => {
    return (projectMembers || []).filter((m) => !existingUserIds.has(m.user_id));
  }, [projectMembers, existingUserIds]);

  const totalPercent = useMemo(() => {
    return (participants || []).reduce((sum, p) => sum + Number(p.percent_share || 0), 0);
  }, [participants]);

  const selectedPayoutInfo = PAYOUT_TYPE_OPTIONS.find((x) => x.value === payoutType);
  const showPercentField = payoutType === "percent_profit" || payoutType === "percent_revenue" || payoutType === "hybrid";
  const showFixedField = payoutType === "fixed" || payoutType === "hybrid";

  const handleAddParticipant = async () => {
    if (!selectedUserId) return;
    await assignParticipant.mutateAsync({
      estimateId,
      participants: [
        {
          user_id: selectedUserId,
          role,
          payout_type: payoutType,
          percent_share: showPercentField ? Number(percentShare || 0) : 0,
          fixed_amount: showFixedField ? Number(fixedAmount || 0) : 0,
          object_id: objectId || null,
        },
      ],
    });

    setSelectedUserId("");
    setPercentShare("");
    setFixedAmount("");
  };

  return (
    <div className="border rounded-lg p-3 lg:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm">Участники объекта</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                      Сотрудники, участвующие в работе по объекту проекта, с указанием их роли и условий оплаты
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
        <Badge variant="outline" className="text-xs">{(participants || []).length}</Badge>
      </div>

      {projectId && !readOnly && (
        <div className="flex items-center justify-between gap-2 bg-muted/30 border rounded-md px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Подтянуть участников из объекта проекта
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => prefillFromObject.mutate({ estimateId })}
            disabled={prefillFromObject.isPending || !objectId}
          >
            {prefillFromObject.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <UserPlus className="h-3.5 w-3.5 mr-1" />}
            Подтянуть
          </Button>
        </div>
      )}

      {!readOnly && (
          <div className="space-y-3 border rounded-md p-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Добавить участника</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                      <Info className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                    Назначьте сотрудника на работу по объекту и укажите условия оплаты
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground">Поиск сотрудника</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                        Начните вводить имя или роль сотрудника для поиска
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  placeholder="Введите имя или роль"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground">Сотрудник</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                        Выберите сотрудника из списка найденных по критериям выше
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Выберите сотрудника" />
                  </SelectTrigger>
                  <SelectContent className="z-[220] bg-popover">
                    {filteredProfiles.map((p) => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.name} — {SYSTEM_ROLE_LABELS[p.role] || p.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          {availableProjectMembers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Быстро добавить из участников проекта:</p>
              <div className="flex flex-wrap gap-1.5">
                {availableProjectMembers.slice(0, 8).map((m) => {
                  const profile = profileByUserId[m.user_id];
                  return (
                    <Button
                      key={m.id}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        assignParticipant.mutate({
                          estimateId,
                          participants: [{
                            user_id: m.user_id,
                            role: m.role as MemberRole,
                            payout_type: m.payout_type as PayoutType,
                            percent_share: Number(m.percent_share || 0),
                            fixed_amount: Number(m.fixed_amount || 0),
                            object_id: objectId || null,
                          }],
                        });
                      }}
                    >
                      {profile?.name || "Без имени"} ({MEMBER_ROLE_LABELS[m.role as MemberRole] || m.role})
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground">Роль</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                      Определите роль сотрудника в проекте: электрик, менеджер или организатор
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[220] bg-popover">
                  <SelectItem value="technician">Электрик</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="organizer">Организатор</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <label className="text-xs text-muted-foreground">Тип расчета оплаты</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                      Выберите способ расчета оплаты: процент от прибыли, фиксированная сумма, гибрид и другие
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={payoutType} onValueChange={(v) => setPayoutType(v as PayoutType)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[220] bg-popover">
                  {PAYOUT_TYPE_OPTIONS.map((x) => (
                    <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPayoutInfo && (
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">{selectedPayoutInfo.hint}</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                      <Info className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                    Объяснение выбранного типа расчета оплаты
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {showPercentField && (
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground">Процент (%)</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                        Процент от прибыли или выручки, который получит сотрудник
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  className="h-9"
                  placeholder="Например: 10"
                  value={percentShare}
                  onChange={(e) => setPercentShare(e.target.value)}
                />
              </div>
            )}
            
            {showFixedField && (
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground">Фиксированная сумма</label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                        Фиксированная сумма, которую получит сотрудник вне зависимости от прибыли
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  min="0"
                  className="h-9"
                  placeholder="Например: 2000"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                className="h-9"
                onClick={handleAddParticipant}
                disabled={!selectedUserId || assignParticipant.isPending}
              >
                {assignParticipant.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                Добавить участника
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                      <Info className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                    Добавить выбранного участника с указанными условиями оплаты к этой смете
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      )}

      {totalPercent > 100 && (
        <div className="border border-amber-300 bg-amber-50 rounded-md px-3 py-2 text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          Сумма процентов превышает 100%.
        </div>
      )}

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-2.5">
                <div className="flex items-center gap-1">
                  Имя
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                        Имя сотрудника, участвующего в работе по объекту
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="text-left p-2.5">
                <div className="flex items-center gap-1">
                  Роль
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                        Роль сотрудника: менеджер, электрик или организатор
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="text-left p-2.5">
                <div className="flex items-center gap-1">
                  Тип оплаты
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                        Способ расчета оплаты: процент от прибыли, фиксированная сумма или гибрид
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="text-left p-2.5">
                <div className="flex items-center gap-1">
                  Процент
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                        Процент от прибыли или выручки, который получит сотрудник
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              <th className="text-left p-2.5">
                <div className="flex items-center gap-1">
                  Фикс
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                        Фиксированная сумма, которую получит сотрудник независимо от прибыли
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>
              {!readOnly && <th className="text-left p-2.5">
                <div className="flex items-center gap-1">
                  Действия
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                        Возможные действия с участником: удаление, редактирование
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </th>}
            </tr>
          </thead>
          <tbody>
            {(participants || []).length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={readOnly ? 5 : 6}>
                  Нет назначенных участников.
                </td>
              </tr>
            ) : (
              (participants || []).map((p) => {
                const profile = profileByUserId[p.user_id];
                const showPercent = p.payout_type === "percent_profit" || p.payout_type === "percent_revenue" || p.payout_type === "hybrid";
                const showFixed = p.payout_type === "fixed" || p.payout_type === "hybrid";
                return (
                <tr key={p.id} className="border-t">
                  <td className="p-2.5">
                    <div className="flex items-center gap-1">
                      {profile?.name || p.user_id}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                            Имя или идентификатор участника
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-1">
                      {MEMBER_ROLE_LABELS[p.role as MemberRole] || p.role}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                            Роль участника в проекте: менеджер, электрик или организатор
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-1">
                      {PAYOUT_TYPE_OPTIONS.find((x) => x.value === p.payout_type)?.label || p.payout_type}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                            Тип расчета оплаты: процент от прибыли, процента от выручки, фиксированная сумма или гибрид
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-1">
                      {showPercent ? `${Number(p.percent_share || 0)}%` : "—"}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                            Процент от прибыли или выручки, который получит сотрудник
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                  <td className="p-2.5">
                    <div className="flex items-center gap-1">
                      {showFixed ? Number(p.fixed_amount || 0).toLocaleString("ru-RU") : "—"}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                            Фиксированная сумма, которую получит сотрудник
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                  {!readOnly && (
                    <td className="p-2.5">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => removeParticipant.mutate({ participantId: p.id, estimateId })}
                        >
                          Удалить
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                <Info className="h-3.5 w-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                              Удалить участника из сметы
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                  )}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EstimateParticipantsPanel;
