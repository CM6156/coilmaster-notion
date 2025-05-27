# Supabase 수동 설정 가이드 🔧

## 🎯 목표
Supabase Dashboard에서 직접 SQL을 실행하여 프로필 시스템을 설정합니다.

## 📋 설정 단계

### 1단계: Supabase Dashboard 접속
1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **"SQL Editor"** 클릭

### 2단계: 마이그레이션 SQL 실행
아래 SQL 코드를 복사해서 SQL Editor에 붙여넣고 실행하세요:

```sql
-- 간단한 프로필 시스템 설정
-- 관리자 패널에서 등록한 부서를 프로필에서 연동하기 위한 기본 설정

-- users 테이블에 필요한 컬럼 추가 (없는 경우)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- RLS 정책 설정
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can read departments" ON public.departments;

-- users 테이블 읽기 권한 (모든 사용자)
CREATE POLICY "Users can read all users" ON public.users
    FOR SELECT USING (true);

-- users 테이블 본인 프로필 수정 권한
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- departments 테이블 읽기 권한 (모든 사용자)
CREATE POLICY "Anyone can read departments" ON public.departments
    FOR SELECT USING (true);

-- 성공 메시지
SELECT 'Profile system setup complete! 이제 관리자 패널에서 등록한 부서가 프로필 페이지에서 연동됩니다.' as message;
```

### 3단계: 실행 확인
SQL 실행 후 다음 메시지가 나오면 성공:
```
Profile system setup complete! 이제 관리자 패널에서 등록한 부서가 프로필 페이지에서 연동됩니다.
```

### 4단계: 테이블 구조 확인 (선택사항)
테이블이 제대로 설정되었는지 확인하려면:

```sql
-- users 테이블 컬럼 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
AND column_name IN ('department_id', 'phone', 'role', 'updated_at');

-- departments 테이블 확인
SELECT * FROM public.departments LIMIT 5;

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, cmd, permissive, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'departments');
```

## 🚨 문제 해결

### 오류 1: "permission denied for table users"
**해결책**: 프로젝트 소유자 계정으로 로그인했는지 확인

### 오류 2: "relation 'departments' does not exist"
**해결책**: 관리자 패널에서 부서 관리 기능을 먼저 사용해서 departments 테이블 생성

### 오류 3: "policy already exists"
**해결책**: 정상적인 경우입니다. DROP IF EXISTS로 인한 안전한 재생성

## ✅ 설정 완료 후

1. **브라우저 새로고침**: 애플리케이션 페이지 새로고침
2. **로그인**: 정상적인 계정으로 로그인
3. **테스트**: 프로필 페이지 접속해서 부서 선택 확인

## 🎉 다음 단계

설정이 완료되면 [PROFILE_TEST_GUIDE.md](./PROFILE_TEST_GUIDE.md)를 참고해서 테스트하세요!

---

**💡 팁**: 향후 Supabase CLI를 설치하려면:
```bash
npm install -g supabase
# 또는
winget install Supabase.cli
``` 