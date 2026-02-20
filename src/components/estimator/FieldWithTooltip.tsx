import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

interface FieldWithTooltipProps {
  label: string;
  tooltip: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  bold?: boolean;
}

const FieldWithTooltip = ({ label, tooltip, required, children, className, bold }: FieldWithTooltipProps) => {
  const isMobile = useIsMobile();

  const tooltipIcon = (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
      <Info className="h-3.5 w-3.5" />
    </span>
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 mb-1">
        <Label className={`text-xs ${bold ? 'font-bold text-foreground' : ''}`}>
          {label}{required && " *"}
        </Label>
        {isMobile ? (
          <Popover>
            <PopoverTrigger asChild>
              {tooltipIcon}
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              className="w-64 text-xs p-3 z-[300]"
              avoidCollisions
            >
              {tooltip}
            </PopoverContent>
          </Popover>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                {tooltipIcon}
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
    </div>
  );
};

export default FieldWithTooltip;
