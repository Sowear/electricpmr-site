import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProtectedEstimator from "@/components/estimator/ProtectedEstimator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { useProjectPayouts, useMarkPayoutPaid, useBatchMarkPayoutsPaid, exportPayoutsCSV } from "@/hooks/usePayouts";
import { useCompanyAccounts } from "@/hooks/useCompanyAccounts";
import { useUserRole } from "@/hooks/useUserRole";

const ProjectPayouts = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { isTechnician } = useUserRole();
  const { data: payouts, isLoading } = useProjectPayouts(projectId);
  const { data: accounts } = useCompanyAccounts();
  const markPaid = useMarkPayoutPaid();
  const batchPaid = useBatchMarkPayoutsPaid();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [accountId, setAccountId] = useState("");

  const pendingPayouts = useMemo(
    () => (payouts || []).filter((p) => p.status === "pending"),
    [payouts]
  );

  if (isTechnician) {
    return (
      <Layout>
        <ProtectedEstimator>
          <div className="container-main py-8">
            <div className="border rounded-lg p-8 text-center text-muted-foreground">
              Доступ к выплатам запрещён для роли technician (403)
            </div>
          </div>
        </ProtectedEstimator>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProtectedEstimator>
        <div className="container-main py-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Выплаты сотрудников</h1>
              <p className="text-sm text-muted-foreground">Проект: {projectId}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => payouts && exportPayoutsCSV(payouts)}>
                <Download className="h-4 w-4 mr-2" /> CSV
              </Button>
              <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>Назад к проекту</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Счёт для выплат" />
              </SelectTrigger>
              <SelectContent>
                {(accounts || []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.type})</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => batchPaid.mutate({ payoutIds: selectedIds, accountId })}
              disabled={!accountId || selectedIds.length === 0 || batchPaid.isPending}
            >
              {batchPaid.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Batch: Выплачено ({selectedIds.length})
            </Button>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Сотрудник</th>
                  <th className="text-left p-3">Проект</th>
                  <th className="text-left p-3">Объект</th>
                  <th className="text-left p-3">Сумма</th>
                  <th className="text-left p-3">Статус</th>
                  <th className="text-left p-3">Действие</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="p-4" colSpan={7}>Загрузка...</td></tr>
                ) : (payouts || []).length === 0 ? (
                  <tr><td className="p-4 text-muted-foreground" colSpan={7}>Нет выплат</td></tr>
                ) : (
                  (payouts || []).map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.includes(p.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds((prev) => checked ? [...prev, p.id] : prev.filter((id) => id !== p.id));
                          }}
                          disabled={p.status === "paid"}
                        />
                      </td>
                      <td className="p-3">{p.user_id}</td>
                      <td className="p-3">{p.project_id || "-"}</td>
                      <td className="p-3">{p.object_id || "-"}</td>
                      <td className="p-3 font-medium">{Number(p.amount).toLocaleString("ru-RU")}</td>
                      <td className="p-3">
                        <Badge variant={p.status === "paid" ? "default" : "outline"}>{p.status}</Badge>
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={p.status === "paid" || !accountId || markPaid.isPending}
                          onClick={() => markPaid.mutate({ payoutId: p.id, accountId })}
                        >
                          Выплачено
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-muted-foreground">
            Pending: {pendingPayouts.length} / Всего: {(payouts || []).length}
          </div>
        </div>
      </ProtectedEstimator>
    </Layout>
  );
};

export default ProjectPayouts;
