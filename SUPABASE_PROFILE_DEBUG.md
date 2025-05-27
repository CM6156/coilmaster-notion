# Supabase 프로필 저장 디버깅 가이드 🔍

## 🎯 목표
**프로필 저장 시 Supabase DB에 실제로 저장되도록 문제 해결**

## 📋 체크리스트

### 1️⃣ **Supabase 연결 상태 확인**
브라우저 F12 → Console에서:
```
📝 Supabase users 테이블 업데이트 시작...
업데이트할 데이터: { name: "최용수", email: "joon@...", ... }
대상 사용자 ID: abc123-def456-...
```

### 2️⃣ **업데이트 성공 확인**
```
✅ Supabase 업데이트 성공: { id: "abc123...", name: "최용수", ... }
```

### 3️⃣ **일반적인 오류들**

#### ❌ 사용자 ID 없음
```
❌ 업데이트된 행이 없음. 사용자 ID가 존재하지 않을 수 있습니다.
```
**해결:** 
- 로그아웃 → 재로그인
- 브라우저 캐시 삭제

#### ❌ RLS 정책 오류
```
❌ Supabase 업데이트 실패: {
  message: "new row violates row-level security policy",
  code: "42501"
}
```
**해결:** Supabase Dashboard에서 RLS 정책 확인:
```sql
-- SQL Editor에서 실행
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);
```

#### ❌ 컬럼 없음 오류
```
❌ Supabase 업데이트 실패: {
  message: "column 'department_id' does not exist",
  code: "42703"
}
```
**해결:** 마이그레이션 실행:
```sql
-- SQL Editor에서 실행
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
```

#### ❌ 잘못된 UUID 형식
```
❌ Supabase 업데이트 실패: {
  message: "invalid input syntax for type uuid",
  code: "22P02"
}
```
**해결:** 사용자 ID 형식 확인

## 🛠 수동 해결 방법

### Supabase Dashboard에서 직접 확인
1. **테이블 확인**: Table Editor → users 테이블
2. **사용자 존재 여부**: 현재 로그인한 사용자 ID 검색
3. **컬럼 존재 여부**: department_id, phone 컬럼 확인
4. **RLS 정책**: Authentication → Policies

### 긴급 백업 복원
localStorage에서 수동 복원:
```javascript
// 브라우저 Console에서 실행
const savedProfile = localStorage.getItem("userProfile");
if (savedProfile) {
  console.log("저장된 프로필:", JSON.parse(savedProfile));
}
```

## 📞 추가 도움

문제가 지속되면 다음 정보를 제공해주세요:
1. **Console 전체 로그** (F12 → Console 전체 복사)
2. **Network 탭 에러** (F12 → Network → 실패한 요청)
3. **현재 사용자 ID** (Console에서 `console.log("currentUser:", currentUser)`) 