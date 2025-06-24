# 🔧 Supabase 이메일 인증 429 오류 해결 가이드

## 📧 이메일 인증 유지하면서 오류 해결하기

### 1️⃣ Supabase 대시보드 설정 변경

#### A. Authentication 설정
1. Supabase 대시보드 접속
2. **Authentication** → **Settings** 이동
3. **Email Templates** 섹션에서:
   - Rate limiting 설정 확인
   - Custom SMTP 설정 (권장)

#### B. SMTP 설정 (가장 효과적)
```
Settings → Authentication → Email Templates → SMTP Settings

SMTP Host: smtp.gmail.com (Gmail 사용 시)
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password
```

### 2️⃣ 코드에서 재시도 로직 추가

```typescript
// Register.tsx에 재시도 로직 추가
const registerWithRetry = async (data: RegisterFormValues, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            department: data.department,
            position: data.position
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) {
        // 429 오류면 잠시 대기 후 재시도
        if (error.message.includes('rate limit') && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        throw error;
      }
      
      return authData;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};
```

### 3️⃣ 환경별 설정

#### 개발 환경
```env
# .env.local
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_URL=your_url
VITE_ENVIRONMENT=development
```

#### 프로덕션 환경
- Custom SMTP 반드시 설정
- 도메인 인증 완료
- SPF, DKIM, DMARC 레코드 설정

### 4️⃣ 대안 방법들

#### A. 이메일 제공업체 분산
```typescript
const getEmailProvider = (email: string) => {
  const domain = email.split('@')[1];
  switch(domain) {
    case 'gmail.com':
      return 'gmail_smtp';
    case 'naver.com':
      return 'naver_smtp';
    default:
      return 'default_smtp';
  }
};
```

#### B. 큐 시스템 사용
```sql
-- 이메일 큐 테이블 생성
CREATE TABLE email_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  template VARCHAR(100) NOT NULL,
  data JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
```

### 5️⃣ 즉시 해결 방법

#### 방법 1: 시간 대기
```typescript
const onSubmit = async (data: RegisterFormValues) => {
  setIsLoading(true);
  
  try {
    // 현재 시간과 마지막 요청 시간 체크
    const lastRequest = localStorage.getItem('lastSignupRequest');
    const now = Date.now();
    
    if (lastRequest && (now - parseInt(lastRequest)) < 60000) {
      throw new Error('잠시만 기다려주세요. 1분 후 다시 시도해주세요.');
    }
    
    const { data: authData, error } = await supabase.auth.signUp({
      // ... 기존 코드
    });
    
    localStorage.setItem('lastSignupRequest', now.toString());
    
    // ... 성공 처리
  } catch (error) {
    // ... 에러 처리
  } finally {
    setIsLoading(false);
  }
};
```

#### 방법 2: 다른 이메일로 테스트
- 다른 도메인 이메일 사용 (@gmail.com, @naver.com 등)
- 개인 도메인 이메일 사용

### 6️⃣ Supabase 플랜 업그레이드

#### 무료 플랜 제한
- 시간당 이메일 발송 제한
- 일일 인증 요청 제한

#### Pro 플랜 혜택
- 높은 이메일 발송 한도
- Custom SMTP 지원
- 우선 지원

## 🚀 권장 해결 순서

1. **Custom SMTP 설정** (가장 효과적)
2. **재시도 로직 추가**
3. **시간 간격 두고 재시도**
4. **다른 이메일로 테스트**
5. **플랜 업그레이드 고려**

## ⚡ 긴급 해결책

지금 당장 테스트하고 싶다면:

```bash
# 1. 브라우저 캐시 삭제
# 2. 다른 브라우저 사용
# 3. 시크릿 모드 사용
# 4. 10분 정도 대기 후 재시도
```

이 방법들로 이메일 인증을 유지하면서도 429 오류를 해결할 수 있습니다! 