# 🚀 Supabase 이메일 인증 설정 가이드

## 📧 1. 이메일 제한 해제 방법

### Supabase 대시보드 설정:
1. **Supabase Dashboard** → **Settings** → **API**
2. **Rate Limits** 섹션에서:
   - **Auth requests per hour**: `1000` (기본값: 100)
   - **Email requests per hour**: `200` (기본값: 30)

### Authentication 설정:
1. **Authentication** → **Settings**
2. **Email auth** 섹션에서:
   - ✅ **Enable email confirmations** (체크 유지)
   - ✅ **Enable secure email change** (체크 유지)
   - **Site URL**: `http://localhost:8082` (개발용)
   - **Redirect URLs**: `http://localhost:8082/login` 추가

## 📮 2. 커스텀 SMTP 설정 (권장)

### Gmail SMTP 사용:
1. **Authentication** → **Settings** → **SMTP Settings**
2. 다음 정보 입력:
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: your-app-password
   Sender name: Coilmaster
   Sender email: your-email@gmail.com
   ```

### Gmail 앱 비밀번호 생성:
1. Google 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 생성 → "메일" 선택
3. 생성된 16자리 비밀번호를 Supabase에 입력

## 🔄 3. 개발 환경 우회 설정

### 로컬 개발용 이메일 확인 우회:
```sql
-- Supabase SQL Editor에서 실행
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'joon@coilmaster.com';
```

## ⚡ 4. 즉시 해결 방법

### 잠시 기다린 후 재시도:
- **5-10분 대기** 후 회원가입 재시도
- Rate limit이 초기화되면 정상 작동

### 다른 이메일로 테스트:
- 임시로 다른 이메일 주소 사용
- 예: `test1@coilmaster.com`, `test2@coilmaster.com`

## 🛠️ 5. 고급 설정

### 이메일 템플릿 커스터마이징:
1. **Authentication** → **Email Templates**
2. **Confirm signup** 템플릿 수정:
```html
<h2>코일마스터 가입을 환영합니다!</h2>
<p>아래 링크를 클릭하여 이메일을 인증해주세요:</p>
<a href="{{ .ConfirmationURL }}">이메일 인증하기</a>
```

### 리다이렉트 URL 설정:
```javascript
// Register.tsx에서 수정
emailRedirectTo: `${window.location.origin}/auth/callback`
```

## ✅ 검증 방법

### 이메일 전송 확인:
1. Supabase Dashboard → Authentication → Users
2. 새 사용자의 `email_confirmed_at` 값 확인
3. 값이 `null`이면 이메일 미인증 상태

### 로그 확인:
1. Dashboard → Settings → Logs
2. Auth 로그에서 이메일 전송 상태 확인

---

> **💡 팁**: 개발 단계에서는 SMTP 설정을 하는 것이 가장 안정적입니다! 