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