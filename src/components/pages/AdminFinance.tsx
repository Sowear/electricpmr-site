import { useState } from "react";
import Layout from "@/components/layout/Layout";
import ProtectedEstimator from "@/components/estimator/ProtectedEstimator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, DollarSign, Download, Filter, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useFinanceEntries, useFinanceSummary, exportFinanceCSV, type FinanceEntry } from "@/hooks/useFinance";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import FinanceCharts from "@/components/finance/FinanceCharts";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminFinance = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const isMobile = useIsMobile();

  const { data: entries, isLoading } = useFinanceEntries({
    from: dateFrom || undefined,
    to: dateTo || undefined,
    type: typeFilter || undefined,
  });
  const { data: summary } = useFinanceSummary(dateFrom || undefined, dateTo || undefined);

  return (
    <Layout showFooter={false}>
      <ProtectedEstimator>
        <div className="container-main py-6 lg:py-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold">Финансы</h1>
              <p className="text-muted-foreground">Доходы, расходы и аналитика</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => entries && exportFinanceCSV(entries)}
              disabled={!entries?.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Экспорт CSV
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-md bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm text-muted-foreground">Доходы</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {(summary?.totalIncome || 0).toLocaleString("ru-RU")} ₽
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-md bg-destructive/10">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <span className="text-sm text-muted-foreground">Расходы</span>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {(summary?.totalExpenses || 0).toLocaleString("ru-RU")} ₽
              </p>
            </div>
            <div className="border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-md bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Чистая прибыль</span>
              </div>
              <p className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                {(summary?.netProfit || 0).toLocaleString("ru-RU")} ₽
              </p>
            </div>
          </div>

          {/* Charts */}
          {entries && entries.length > 0 && (
            <FinanceCharts entries={entries} />
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40 h-9"
              placeholder="От"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40 h-9"
              placeholder="До"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="income">Доходы</SelectItem>
                <SelectItem value="expense">Расходы</SelectItem>
              </SelectContent>
            </Select>
            {(dateFrom || dateTo || typeFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDateFrom(""); setDateTo(""); setTypeFilter(""); }}
              >
                Сбросить
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Дата</TableHead>
                  <TableHead className="w-[80px]">Тип</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead className="w-[100px]">Источник</TableHead>
                  <TableHead className="text-right w-[120px]">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Загрузка...
                    </TableCell>
                  </TableRow>
                ) : entries && entries.length > 0 ? (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">
                        {format(new Date(entry.created_at), "d MMM yy", { locale: ru })}
                      </TableCell>
                      <TableCell>
                        {entry.type === "income" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 text-xs gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            Доход
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/10 text-destructive text-xs gap-1">
                            <ArrowDownRight className="h-3 w-3" />
                            Расход
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.description || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.source === "estimate_payment" ? "Смета" : entry.source === "manual" ? "Вручную" : entry.source}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${entry.type === "income" ? "text-emerald-600" : "text-destructive"}`}>
                        {entry.type === "income" ? "+" : "−"}{entry.amount.toLocaleString("ru-RU")}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Нет записей
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </ProtectedEstimator>
    </Layout>
  );
};

export default AdminFinance;
