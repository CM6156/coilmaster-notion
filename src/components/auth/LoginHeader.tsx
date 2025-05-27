
import { LogIn } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginHeaderProps {
  title?: string;
  description?: string;
}

export default function LoginHeader({ title, description }: LoginHeaderProps) {
  return (
    <CardHeader className="space-y-2 pb-4 text-center">
      <div className="w-full flex justify-center mb-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-primary to-purple-500 p-0.5">
          <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>
      <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
        {title}
      </CardTitle>
      <CardDescription className="text-center">
        {description}
      </CardDescription>
    </CardHeader>
  );
}
