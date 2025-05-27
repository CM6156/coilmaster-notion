import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface FilterOption {
  id: string;
  name: string;
}

interface JournalFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  groupBy: "none" | "user" | "date" | "department";
  onGroupByChange: (value: "none" | "user" | "date" | "department") => void;
  filterBy: string;
  onFilterByChange: (value: string) => void;
  filterOptions: FilterOption[];
}

export default function JournalFilters({
  searchTerm,
  onSearchChange,
  groupBy,
  onGroupByChange,
  filterBy,
  onFilterByChange,
  filterOptions
}: JournalFiltersProps) {
  const { translations } = useLanguage();
  const globalT = translations.global;
  const dashboardT = translations.dashboard;
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="업무일지 검색..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select 
              value={groupBy} 
              onValueChange={(value: "none" | "user" | "date" | "department") => {
                onGroupByChange(value);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="그룹화 기준" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">그룹화 없음</SelectItem>
                <SelectItem value="user">사용자별</SelectItem>
                <SelectItem value="department">{dashboardT?.byDepartment || "부서별"}</SelectItem>
                <SelectItem value="date">날짜별</SelectItem>
              </SelectContent>
            </Select>
            
            {groupBy !== "none" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1">
                    필터 
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => onFilterByChange("")}
                    className={!filterBy ? "bg-slate-100" : ""}
                  >
                    모두 보기
                  </DropdownMenuItem>
                  {filterOptions.map(option => (
                    <DropdownMenuItem 
                      key={option.id}
                      onClick={() => onFilterByChange(option.id)}
                      className={filterBy === option.id ? "bg-slate-100" : ""}
                    >
                      {option.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
