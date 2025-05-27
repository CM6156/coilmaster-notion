
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import LoginHeader from "@/components/auth/LoginHeader";
import LoginForm from "@/components/auth/LoginForm";
import LoginFooter from "@/components/auth/LoginFooter";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Database } from "lucide-react";

export default function Login() {
  const { translations, language } = useLanguage();
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const t = translations.login;
  
  // Local loading state with a maximum duration
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  // Debug logs
  useEffect(() => {
    console.log("Current language in Login:", language);
    console.log("Translations available:", translations);
    console.log("Auth state in Login:", isAuthenticated ? "Authenticated" : "Not authenticated");
    console.log("Loading state in Login:", loading);
  }, [language, translations, isAuthenticated, loading]);

  // Check authentication status and redirect
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is already authenticated, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.log("Forcing loading state to end after timeout");
        setIsTimedOut(true);
      }, 1500); // reduced for quicker response
      
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  // Show normal login form when not loading or if loading timed out
  if (!loading || isTimedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 p-4">
        <div className="absolute top-4 left-4">
          <Link to="/intro" className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
            <Database className="h-5 w-5" />
            <span className="font-bold">Coilmaster Notion</span>
          </Link>
        </div>
        
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        
        <div className="w-full max-w-md">
          <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-sm rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl blur-xl"></div>
            <LoginHeader 
              title={t?.title || "로그인"} 
              description={t?.description || "계정에 로그인하여 계속하세요"} 
            />
            <CardContent>
              <LoginForm 
                translations={t || {}} 
                language={language} 
              />
            </CardContent>
            <LoginFooter 
              noAccountText={t?.noAccount || "계정이 없으신가요?"} 
              registerText={t?.register || "회원가입"} 
            />
          </Card>
        </div>
      </div>
    );
  }
  
  // Show loading indicator
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="text-lg font-medium text-gray-700">
          {t?.login || "로딩 중..."}
        </p>
        <p className="text-sm text-gray-500">
          {t?.rememberMe || "인증 상태를 확인하는 중입니다."}
        </p>
      </div>
    </div>
  );
}
