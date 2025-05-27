import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "../ThemeToggle";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
import LanguageSelector from "../LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

export default function Header() {
  const { translations } = useLanguage();
  
  return (
    <header className="border-b bg-white dark:bg-slate-950 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <div className="flex items-center max-w-md border rounded-md focus-within:ring-1 focus-within:ring-ring">
            <Search className="h-4 w-4 text-muted-foreground ml-3" />
            <Input placeholder={translations.global?.searchPlaceholder || "검색..."} className="border-0 focus-visible:ring-0 h-9" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          <ThemeToggle />
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}
