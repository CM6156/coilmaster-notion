
import { z } from "zod";
import { LanguageCode } from "@/translations";

export const getLoginSchema = (language: LanguageCode) => {
  return z.object({
    email: z.string().email(
      language === "ko" ? "유효한 이메일 주소를 입력하세요" : 
      language === "en" ? "Enter a valid email address" : 
      language === "zh" ? "请输入有效的电子邮件地址" : 
      "กรุณาใส่อีเมลที่ถูกต้อง"
    ),
    password: z.string().min(
      6, 
      language === "ko" ? "비밀번호는 최소 6자 이상이어야 합니다" : 
      language === "en" ? "Password must be at least 6 characters" : 
      language === "zh" ? "密码至少需要6个字符" : 
      "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    ),
    rememberMe: z.boolean().default(false),
  });
};

export type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;
