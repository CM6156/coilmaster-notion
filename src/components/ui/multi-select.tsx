import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "항목을 선택하세요...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const safeOptions = React.useMemo(() => 
    Array.isArray(options) ? options : [], 
    [options]
  );
  
  const safeSelected = React.useMemo(() => 
    Array.isArray(selected) ? selected : [], 
    [selected]
  );

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return safeOptions;
    return safeOptions.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [safeOptions, searchTerm]);

  const handleUnselect = React.useCallback((item: string) => {
    if (onChange) {
      onChange(safeSelected.filter((i) => i !== item));
    }
  }, [safeSelected, onChange]);

  const handleSelect = React.useCallback((item: string) => {
    if (!onChange) return;
    
    if (safeSelected.includes(item)) {
      handleUnselect(item);
    } else {
      onChange([...safeSelected, item]);
    }
  }, [safeSelected, onChange, handleUnselect]);

  const selectedBadges = React.useMemo(() => {
    return safeSelected.map((item) => {
      const option = safeOptions.find((opt) => opt.value === item);
      return (
        <Badge
          variant="secondary"
          key={item}
          className="mr-1 mb-1"
          onClick={(e) => {
            e.stopPropagation();
            handleUnselect(item);
          }}
        >
          {option?.label || item}
          <button
            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUnselect(item);
              }
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleUnselect(item);
            }}
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        </Badge>
      );
    });
  }, [safeSelected, safeOptions, handleUnselect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            className
          )}
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap">
            {safeSelected.length > 0 ? (
              selectedBadges
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="flex flex-col">
          <div className="flex items-center border-b px-3">
            <Input
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          <div className="max-h-64 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                결과가 없습니다.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      safeSelected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.icon && (
                    <option.icon className="mr-2 h-4 w-4" />
                  )}
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 