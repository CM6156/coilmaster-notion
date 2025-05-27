# 프로필 부서 연동 간단 설정 가이드

## 🎯 목표
관리자 패널에서 등록한 부서가 프로필 페이지에서 선택할 수 있도록 연동

## ✅ 필요한 설정

### 1️⃣ Supabase RLS 정책 확인
Supabase Dashboard → Authentication → Policies에서 다음 정책이 있는지 확인:

```sql
-- users 테이블 읽기 권한
CREATE POLICY "Users can read all users" ON public.users
    FOR SELECT USING (true);

-- users 테이블 본인 프로필 수정 권한  
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- departments 테이블 읽기 권한
CREATE POLICY "Anyone can read departments" ON public.departments
    FOR SELECT USING (true);
```

### 2️⃣ 필요한 컬럼 확인
users 테이블에 다음 컬럼들이 있는지 확인:

```sql
-- Supabase SQL Editor에서 실행
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
AND column_name IN ('department_id', 'phone', 'role');
```

컬럼이 없다면 추가:
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
```

### 3️⃣ 부서 데이터 확인
관리자 패널에서 부서를 등록했는지 확인:

```sql
-- departments 테이블 확인
SELECT * FROM public.departments;
```

부서가 없다면 관리자 패널(`/admin` → 부서 관리)에서 부서를 먼저 등록하세요.

## 🚀 사용 방법

### 1. 부서 등록 (관리자)
1. `/admin` 페이지 접속
2. "부서 관리" 탭 선택  
3. "새 부서 등록" 버튼 클릭
4. 부서명, 코드, 설명 입력 후 저장

### 2. 프로필 수정 (사용자)
1. 사이드바 하단 프로필 아이콘 클릭
2. "개인 정보" 탭에서 부서 드롭다운 확인
3. 등록된 부서 선택 후 저장

## 🐛 문제 해결

### 부서 목록이 안 보이는 경우
1. **권한 문제**: RLS 정책 확인
2. **부서 데이터 없음**: 관리자 패널에서 부서 먼저 등록
3. **콘솔 에러 확인**: 브라우저 개발자 도구에서 에러 메시지 확인

### 프로필 수정이 안되는 경우
1. **업데이트 권한**: users 테이블 UPDATE 정책 확인
2. **컬럼 누락**: department_id 컬럼 존재 여부 확인
3. **사용자 ID**: 로그인된 사용자의 UUID 확인

## ✨ 완료!

이제 관리자 패널에서 등록한 부서가 프로필 페이지에서 바로 연동되어 표시됩니다! 🎉 