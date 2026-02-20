import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Loader2,
  History,
  Shield
} from "lucide-react";
import { 
  Estimate, 
  EstimateStatus, 
  ESTIMATE_STATUSES, 
  EDITABLE_STATUSES 
} from "@/types/estimator";
import { 
  getAvailableTransitions, 
  validateTransition, 
  useChangeEstimateStatus,
  useEstimateHistory
} from "@/hooks/useEstimateWorkflow";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EstimateStatusWorkflowProps {
  estimate: Estimate;
  canChangeStatus: boolean;
}

const EstimateStatusWorkflow = ({ estimate, canChangeStatus }: EstimateStatusWorkflowProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<EstimateStatus | "">("");
  const [comment, setComment] = useState("");

  const changeStatus = useChangeEstimateStatus();
  const { data: history } = useEstimateHistory(estimate.id);

  const availableTransitions = useMemo(
    () => getAvailableTransitions(estimate),
    [estimate.status, estimate.deposit_pct, estimate.prepayment_confirmed, estimate.payment_method, estimate.payment_recipient]
  );

  const currentStatusInfo = ESTIMATE_STATUSES.find(s => s.value === estimate.status);
  const isLocked = !EDITABLE_STATUSES.includes(estimate.status as EstimateStatus);

  const handleStatusChange = () => {
    if (!selectedStatus) return;

    const validation = validateTransition(estimate, selectedStatus as EstimateStatus);
    if (!validation.valid) {
      return;
    }

    changeStatus.mutate({
      estimateId: estimate.id,
      newStatus: selectedStatus as EstimateStatus,
      comment: comment || undefined,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setSelectedStatus("");
        setComment("");
      }
    });
  };

  const validationResult = selectedStatus 
    ? validateTransition(estimate, selectedStatus as EstimateStatus) 
    : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Current Status Badge */}
      <Badge className={`${currentStatusInfo?.color || 'bg-muted text-muted-foreground'} text-xs`}>
        {currentStatusInfo?.label || estimate.status}
      </Badge>

      {/* Lock indicator */}
      {isLocked && (
        <Badge variant="outline" className="text-xs gap-1">
          <Shield className="h-3 w-3" />
          Заблокировано
        </Badge>
      )}

      {/* Change Status Button */}
      {canChangeStatus && availableTransitions.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setDialogOpen(true)}
        >
          <ArrowRight className="h-3 w-3" />
          Сменить статус
        </Button>
      )}

      {/* History Button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => setHistoryOpen(true)}
      >
        <History className="h-3 w-3" />
        <span className="hidden sm:inline">Журнал</span>
      </Button>

      {/* Status Change Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Сменить статус сметы</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Текущий:</span>
              <Badge className={currentStatusInfo?.color}>
                {currentStatusInfo?.label}
              </Badge>
            </div>

            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as EstimateStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите новый статус..." />
              </SelectTrigger>
              <SelectContent>
                {availableTransitions.map((status) => {
                  const info = ESTIMATE_STATUSES.find(s => s.value === status);
                  return (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${info?.dotColor || 'bg-muted-foreground'}`} />
                        {info?.label || status}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Validation result */}
            {validationResult && !validationResult.valid && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{validationResult.reason}</AlertDescription>
              </Alert>
            )}

            {validationResult && validationResult.valid && selectedStatus && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Переход разрешён
                </AlertDescription>
              </Alert>
            )}

            <Textarea
              placeholder="Комментарий (необязательно)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={
                !selectedStatus || 
                changeStatus.isPending || 
                (validationResult ? !validationResult.valid : true)
              }
            >
              {changeStatus.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Журнал изменений</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            {history && history.length > 0 ? (
              <div className="space-y-3 pr-4">
                {history.map((entry: any) => (
                  <div key={entry.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {format(new Date(entry.changed_at), "d MMM yyyy, HH:mm", { locale: ru })}
                      </span>
                    </div>
                    <p className="font-medium">
                      {entry.action === 'status_change' && (
                        <>
                          Статус: {' '}
                          <span className="text-muted-foreground">
                            {ESTIMATE_STATUSES.find(s => s.value === entry.old_values?.status)?.label || entry.old_values?.status}
                          </span>
                          {' → '}
                          <span className="text-foreground">
                            {ESTIMATE_STATUSES.find(s => s.value === entry.new_values?.status)?.label || entry.new_values?.status}
                          </span>
                        </>
                      )}
                      {entry.action === 'prepayment_confirmed' && 'Предоплата подтверждена'}
                      {entry.action !== 'status_change' && entry.action !== 'prepayment_confirmed' && entry.action}
                    </p>
                    {entry.new_values?.comment && (
                      <p className="text-muted-foreground mt-1 text-xs italic">
                        «{entry.new_values.comment}»
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Нет записей
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EstimateStatusWorkflow;
