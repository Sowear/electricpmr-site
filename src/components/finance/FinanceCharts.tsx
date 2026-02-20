import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceEntry } from "@/hooks/useFinance";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ru } from "date-fns/locale";
import { TrendingUp, Receipt } from "lucide-react";

interface FinanceChartsProps {
  entries: FinanceEntry[];
}

const FinanceCharts = ({ entries }: FinanceChartsProps) => {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(now, 11 - i);
      return {
        month: format(date, "MMM yy", { locale: ru }),
        start: startOfMonth(date),
        end: endOfMonth(date),
        income: 0,
        expense: 0,
        count: 0,
      };
    });

    entries.forEach((entry) => {
      const entryDate = new Date(entry.created_at);
      const bucket = months.find((m) =>
        isWithinInterval(entryDate, { start: m.start, end: m.end })
      );
      if (!bucket) return;
      if (entry.type === "income") {
        bucket.income += entry.amount;
        bucket.count++;
      } else {
        bucket.expense += entry.amount;
      }
    });

    return months.map((m) => ({
      month: m.month,
      income: Math.round(m.income),
      expense: Math.round(m.expense),
      profit: Math.round(m.income - m.expense),
      count: m.count,
    }));
  }, [entries]);

  const avgCheck = useMemo(() => {
    const incomeEntries = entries.filter((e) => e.type === "income");
    if (incomeEntries.length === 0) return 0;
    const total = incomeEntries.reduce((s, e) => s + e.amount, 0);
    return Math.round(total / incomeEntries.length);
  }, [entries]);

  const totalIncome = useMemo(
    () => entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0),
    [entries]
  );

  return (
    <div className="space-y-4">
      {/* Metric cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Средний чек</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgCheck.toLocaleString("ru-RU")} ₽</p>
            <p className="text-xs text-muted-foreground mt-1">
              На основе {entries.filter((e) => e.type === "income").length} платежей
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Выручка за 12 мес.</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{Math.round(totalIncome).toLocaleString("ru-RU")} ₽</p>
            <p className="text-xs text-muted-foreground mt-1">
              {monthlyData.filter((m) => m.income > 0).length} активных месяцев
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Доходы и расходы по месяцам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString("ru-RU")} ₽`,
                    name === "income" ? "Доход" : name === "expense" ? "Расход" : "Прибыль",
                  ]}
                  labelFormatter={(label) => label}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="income" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="income" />
                <Bar dataKey="expense" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceCharts;
