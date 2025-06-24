import { LoginTranslations, RegisterTranslations, ForgotPasswordTranslations } from '@/types';

export const authTranslations = {
  login: {
    title: "로그인",
    description: "계정에 로그인하여 계속하세요",
    email: "이메일",
    password: "비밀번호",
    rememberMe: "로그인 상태 유지",
    forgotPassword: "비밀번호를 잊으셨나요?",
    login: "로그인",
    noAccount: "계정이 없으신가요?",
    register: "회원가입",
    processing: "처리 중...",
    or: "또는",
    registerAccount: "계정 등록"
  },
  
  register: {
    title: "회원가입",
    description: "계정을 만들어 시작하세요",
    name: "이름",
    namePlaceholder: "성명을 입력하세요",
    email: "이메일",
    emailPlaceholder: "email@company.com",
    password: "비밀번호",
    passwordPlaceholder: "••••••••",
    confirmPassword: "비밀번호 확인",
    department: "부서",
    departmentPlaceholder: "부서 선택",
    position: "직책",
    positionPlaceholder: "직책 선택",
    terms: "이용약관에 동의합니다",
    register: "가입하기",
    haveAccount: "이미 계정이 있으신가요?",
    alreadyHaveAccount: "이미 계정이 있으신가요?",
    login: "로그인",
    processing: "처리 중...",
    passwordStrength: "비밀번호 강도",
    veryWeak: "매우 약함",
    weak: "약함",
    medium: "보통",
    strong: "강함",
    veryStrong: "매우 강함"
  },
  
  forgotPassword: {
    title: "비밀번호 재설정",
    description: "가입 시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.",
    sendLink: "재설정 링크 보내기",
    processing: "처리 중...",
    backToLogin: "로그인으로 돌아가기",
    successMessage: "재설정 링크가 이메일로 전송되었습니다",
    successDescription: "이메일을 확인하시고 링크를 클릭하여 비밀번호를 재설정하세요.",
    errorMessage: "오류가 발생했습니다"
  }
};
