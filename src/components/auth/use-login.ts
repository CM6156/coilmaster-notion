import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { LanguageCode } from "@/translations";
import { LoginFormValues } from "./login-validation";

export const useLogin = (language: LanguageCode) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setIsAuthenticated } = useAuth();

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    console.log("Login attempt started for:", data.email);
    
    try {
      // Supabase email/password login
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        console.error("Login failed:", error);
        throw error;
      }
      
      if (authData && authData.user) {
        console.log("Login successful, user:", authData.user.email);
        
        // Login successful - set auth state
        localStorage.setItem("isAuthenticated", "true");
        setIsAuthenticated(true);
        
        // Store user profile info
        const userProfile = {
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
          email: authData.user.email,
          loginMethod: 'email',
          provider: 'email',
          department: authData.user.user_metadata?.department || null,
          id: authData.user.id
        };
        
        localStorage.setItem("userProfile", JSON.stringify(userProfile));
        
        // Show success toast
        toast({
          title: language === "ko" ? "로그인 성공" : 
                 language === "en" ? "Login successful" : 
                 language === "zh" ? "登录成功" : "เข้าสู่ระบบสำเร็จ",
          description: language === "ko" ? "환영합니다! Coilmaster Notion에 오신 것을 환영합니다." : 
                       language === "en" ? "Welcome to Coilmaster Notion!" : 
                       language === "zh" ? "欢迎来到 Coilmaster Notion！" : "ยินดีต้อนรับสู่ Coilmaster Notion!",
        });

        // Use replace to prevent history stacking and redirect to projects
        console.log("Redirecting to projects after successful login");
        navigate('/projects', { replace: true });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = language === "ko" ? "이메일 또는 비밀번호가 일치하지 않습니다." : 
                         language === "en" ? "Email or password doesn't match." : 
                         language === "zh" ? "电子邮件或密码不匹配。" : "อีเมลหรือรหัสผ่านไม่ตรงกัน";
      
      if (error.message) {
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = language === "ko" ? "이메일 또는 비밀번호가 일치하지 않습니다." : 
                         language === "en" ? "Email or password doesn't match." : 
                         language === "zh" ? "电子邮件或密码不匹配。" : "อีเมลหรือรหัสผ่านไม่ตรงกัน";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: language === "ko" ? "로그인 실패" : 
               language === "en" ? "Login failed" : 
               language === "zh" ? "登录失败" : "เข้าสู่ระบบล้มเหลว",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleLogin
  };
};
