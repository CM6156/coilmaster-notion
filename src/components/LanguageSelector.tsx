
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageCode, languages } from "@/translations";
import { useEffect } from "react";

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  
  const handleLanguageChange = (value: string) => {
    // Type assertion to ensure type safety
    const languageCode = value as LanguageCode;
    setLanguage(languageCode);
    
    // Log language change for debugging
    console.log("Language changed to:", languageCode);
  };

  // Debug current language on component mount and updates
  useEffect(() => {
    console.log("Current language in selector:", language);
  }, [language]);

  return (
    <div className="flex items-center space-x-1">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-24 h-8 text-xs bg-transparent border-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0">
          <SelectValue placeholder="언어 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
