import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import LoginHeader from "@/components/auth/LoginHeader";
import LoginForm from "@/components/auth/LoginForm";
import LoginFooter from "@/components/auth/LoginFooter";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { 
  Database, 
  Cpu, 
  Brain, 
  Shield, 
  Sparkles, 
  ArrowLeft,
  Zap,
  Lock,
  User
} from "lucide-react";

export default function Login() {
  const { translations, language } = useLanguage();
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const t = translations.login;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  
  // Local loading state with a maximum duration
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
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
      console.log("User is already authenticated, redirecting to projects");
      navigate('/projects', { replace: true });
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

  // 사이보그 애니메이션 컴포넌트 (간소화 버전)
  const CyborgLoginAnimation = () => (
    <div className="relative w-full h-full">
      {/* 메인 원형 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-32 h-32">
          {/* 외부 링 */}
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-spin-slow">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* 내부 코어 */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-600 animate-pulse-slow flex items-center justify-center">
            <Lock className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* 마우스 추적 효과 */}
      <div 
        className="absolute w-20 h-20 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 rounded-full blur-xl pointer-events-none transition-all duration-300"
        style={{
          left: mousePosition.x / 20,
          top: mousePosition.y / 20,
        }}
      ></div>
    </div>
  );
  
  // Show normal login form when not loading or if loading timed out
  if (!loading || isTimedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        {/* 배경 애니메이션 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-spin-very-slow"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/5 border-b border-white/10">
          <Link to="/intro" className="flex items-center space-x-3 text-white hover:text-cyan-400 transition-colors">
            <div className="relative">
              <Cpu className="h-6 w-6 text-cyan-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              Coilmaster Notion
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <Link to="/intro">
              <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">{language === "ko" ? "홈으로" : "Back"}</span>
              </button>
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto w-full">
            {/* Left Side - Animation */}
            <div className={`hidden lg:block relative h-96 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <CyborgLoginAnimation />
              
              {/* Floating Elements */}
              <div className="absolute top-10 left-10 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 animate-float">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="absolute bottom-10 right-10 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 animate-float" style={{animationDelay: '1s'}}>
                <User className="w-6 h-6 text-purple-400" />
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
                
                {/* Main Card */}
                <Card className="relative border-0 bg-white/10 backdrop-blur-md shadow-2xl rounded-3xl border border-white/20">
                  <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500">
                          <Lock className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <h1 className="text-3xl font-bold mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
                          {language === "ko" ? "로그인" : "Sign In"}
                        </span>
                      </h1>
                      <p className="text-gray-300">
                        {language === "ko" 
                          ? "AI 기반 기업 관리 플랫폼에 접속하세요" 
                          : "Access your AI-powered enterprise platform"}
                      </p>
                    </div>

                    {/* Login Form */}
                    <CardContent className="p-0">
                      <LoginForm 
                        translations={t || {}} 
                        language={language} 
                      />
                    </CardContent>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                      <div className="flex items-center justify-center space-x-2 text-gray-300">
                        <span>{language === "ko" ? "계정이 없으신가요?" : "Don't have an account?"}</span>
                        <Link 
                          to="/register" 
                          className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                        >
                          {language === "ko" ? "회원가입" : "Sign Up"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* 커스텀 CSS 애니메이션 */}
        <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes spin-very-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
          .animate-spin-very-slow {
            animation: spin-very-slow 20s linear infinite;
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }
  
  // Show loading indicator with cyborg style
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* 배경 애니메이션 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6">
          {/* Loading Animation */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-cyan-500/30 animate-spin mx-auto">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-3 h-3 bg-cyan-500 rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              {language === "ko" ? "시스템 초기화 중..." : "Initializing System..."}
            </h2>
            <p className="text-gray-300">
              {language === "ko" ? "인증 상태를 확인하는 중입니다." : "Verifying authentication status."}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
