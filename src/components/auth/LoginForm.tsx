import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageCode } from "@/translations";
import { getLoginSchema, LoginFormValues } from "./login-validation";
import { useLogin } from "./use-login";
import { useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { useState } from "react";

interface LoginFormProps {
  translations: {
    email?: string;
    password?: string;
    rememberMe?: string;
    forgotPassword?: string;
    login?: string;
    processing?: string;
    or?: string;
    registerAccount?: string;
  };
  language: LanguageCode;
}

export default function LoginForm({ translations: t, language }: LoginFormProps) {
  const { isLoading, handleLogin } = useLogin(language);
  const loginSchema = getLoginSchema(language);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Debug
  useEffect(() => {
    console.log("LoginForm rendered with language:", language);
    console.log("Translations:", t);
  }, [language, t]);

  const onSubmit = (data: LoginFormValues) => {
    console.log("Form submitted with:", data);
    handleLogin(data);
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" style={{ zIndex: 10, position: "relative" }}>
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{t?.email || '이메일'}</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="email@company.com" 
                  {...field} 
                  autoComplete="email"
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 h-12 rounded-xl"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>{t?.password || '비밀번호'}</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    {...field} 
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20 h-12 rounded-xl pr-12" 
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    onClick={toggleShowPassword}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                    id="rememberMe"
                    className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                </FormControl>
                <FormLabel htmlFor="rememberMe" className="text-sm font-normal cursor-pointer text-gray-300 hover:text-white transition-colors">
                  {t?.rememberMe || '로그인 상태 유지'}
                </FormLabel>
              </FormItem>
            )}
          />
          <Link 
            to="/forgot-password" 
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
          >
            {t?.forgotPassword || '비밀번호 찾기'}
          </Link>
        </div>

        {/* Login Button */}
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-600 text-white font-semibold h-12 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25" 
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{t?.processing || '로그인 중...'}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <LogIn className="w-5 h-5" />
              <span>{t?.login || '로그인'}</span>
            </div>
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="flex items-center">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="px-4 text-gray-300 text-sm">{t?.or || '또는'}</span>
            <div className="flex-grow border-t border-white/20"></div>
          </div>
        </div>
      </form>
    </Form>
  );
}
