
import { Link } from "react-router-dom";
import { CardFooter } from "@/components/ui/card";

interface LoginFooterProps {
  noAccountText?: string;
  registerText?: string;
}

export default function LoginFooter({ noAccountText, registerText }: LoginFooterProps) {
  return (
    <CardFooter className="pb-8 pt-0">
      <div className="text-center w-full" style={{ position: "relative", zIndex: 10 }}>
        <p className="text-gray-600 text-sm mb-2">{noAccountText}</p>
        <Link 
          to="/register" 
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {registerText}
        </Link>
      </div>
    </CardFooter>
  );
}
