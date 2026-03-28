import { useState } from "react";
import Layout from "@/components/layout/Layout";
import ProtectedEstimator from "@/components/estimator/ProtectedEstimator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFinanceSettings, useUpdateFinanceSettings } from "@/hooks/useFinanceSettings";
import { useCompanyAccounts, useCreateCompanyAccount } from "@/hooks/useCompanyAccounts";
import { useUserRole } from "@/hooks/useUserRole";

const AdminFinanceSettings = () => {
  const { isAdmin, isSuperAdmin } = useUserRole();
  const { data: settings } = useFinanceSettings();
  const updateSettings = useUpdateFinanceSettings();
  const { data: accounts } = useCompanyAccounts();
  const createAccount = useCreateCompanyAccount();

  const [reservePercent, setReservePercent] = useState(10);
  const [autoLock, setAutoLock] = useState(true);
  const [autoPayouts, setAutoPayouts] = useState(true);
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<"cash" | "bank" | "card">("cash");

  if (!isAdmin && !isSuperAdmin) {
    return (
      <Layout>
        <ProtectedEstimator>
          <div className="container-main py-8">
            <div className="border rounded-lg p-8 text-center text-muted-foreground">403</div>
          </div>
        </ProtectedEstimator>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProtectedEstimator>
        <div className="container-main py-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">System Settings → Finance</h1>
            <p className="text-sm text-muted-foreground">Резерв, auto lock, auto payouts, счета компании</p>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div>
              <label className="text-sm font-medium">reserve_percent</label>
              <Input
                type="number"
                value={reservePercent}
                onChange={(e) => setReservePercent(Number(e.target.value || 0))}
                placeholder={String(settings?.reserve_percent ?? 10)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={autoLock} onCheckedChange={(v) => setAutoLock(!!v)} />
              auto_lock_snapshot
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={autoPayouts} onCheckedChange={(v) => setAutoPayouts(!!v)} />
              auto_create_payouts
            </label>
            <Button
              onClick={() => updateSettings.mutate({
                reserve_percent: reservePercent,
                auto_lock_snapshot: autoLock,
                auto_create_payouts: autoPayouts,
              })}
            >
              Сохранить настройки
            </Button>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold">Company accounts</h2>
            <div className="grid md:grid-cols-3 gap-2">
              <Input value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Название счёта" />
              <select
                className="h-10 rounded-md border bg-background px-3"
                value={accType}
                onChange={(e) => setAccType(e.target.value as any)}
              >
                <option value="cash">cash</option>
                <option value="bank">bank</option>
                <option value="card">card</option>
              </select>
              <Button
                onClick={() => createAccount.mutate({ name: accName, type: accType })}
                disabled={!accName}
              >
                Добавить счёт
              </Button>
            </div>

            <div className="space-y-2">
              {(accounts || []).map((a) => (
                <div key={a.id} className="text-sm border rounded-md p-2 flex justify-between">
                  <span>{a.name} ({a.type})</span>
                  <span>{Number(a.balance || 0).toLocaleString("ru-RU")} {a.currency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedEstimator>
    </Layout>
  );
};

export default AdminFinanceSettings;
