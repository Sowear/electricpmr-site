import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
  itemClassName?: string;
}

const FaqAccordion = ({ items, className, itemClassName }: FaqAccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div 
          key={index} 
          className={cn(
            "border rounded-xl overflow-hidden transition-all duration-200",
            "hover:shadow-sm",
            itemClassName
          )}
        >
          <button
            className="w-full flex justify-between items-center gap-4 p-4 text-left"
            onClick={() => toggleItem(index)}
            aria-expanded={openIndex === index}
            aria-controls={`faq-answer-${index}`}
          >
            <span className="font-medium text-foreground">{item.question}</span>
            {openIndex === index ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
          </button>
          
          <div
            id={`faq-answer-${index}`}
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}
            aria-hidden={openIndex !== index}
          >
            <div className="p-4 pt-0 text-muted-foreground border-t">
              {item.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FaqAccordion;