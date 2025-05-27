
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
import { Eye, EyeOff } from "lucide-react";
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" style={{ zIndex: 10, position: "relative" }}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">{t?.email || '이메일'}</FormLabel>
              <FormControl>
                <Input 
                  placeholder="email@company.com" 
                  {...field} 
                  autoComplete="email"
                  disabled={false}
                  className="border-gray-200 focus-visible:ring-primary/50 h-11 rounded-lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">{t?.password || '비밀번호'}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    {...field} 
                    autoComplete="current-password"
                    disabled={false}
                    className="border-gray-200 focus-visible:ring-primary/50 h-11 rounded-lg pr-10" 
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    onClick={toggleShowPassword}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={false}
                    id="rememberMe"
                  />
                </FormControl>
                <FormLabel htmlFor="rememberMe" className="text-sm font-normal cursor-pointer text-gray-600">
                  {t?.rememberMe || '로그인 상태 유지'}
                </FormLabel>
              </FormItem>
            )}
          />
          <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium z-10">
            {t?.forgotPassword || '비밀번호 찾기'}
          </Link>
        </div>
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 h-12 rounded-lg font-medium text-base" 
          disabled={false}
        >
          {isLoading ? t?.processing || '로그인 중...' : t?.login || '로그인'}
        </Button>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">{t?.or || '또는 새 계정 등록'}</span>
          </div>
        </div>

        <div className="text-center">
          <Link to="/register" className="text-primary hover:underline text-sm font-medium z-10 relative">
            {t?.registerAccount || '새 계정 등록하기'}
          </Link>
        </div>
      </form>
    </Form>
  );
}
