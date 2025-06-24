-- ========================================
-- 직책, 부서, 법인 테이블 RLS 정책 수정
-- ========================================

-- 기존 정책들 삭제 및 새로운 정책 설정

-- Positions 테이블 RLS 정책
DROP POLICY IF EXISTS "Allow authenticated users to read positions" ON public.positions;
DROP POLICY IF EXISTS "Allow admins full access to positions" ON public.positions;

-- 모든 인증된 사용자에게 positions 테이블 전체 권한 부여
CREATE POLICY "Enable all access for authenticated users on positions" 
ON public.positions 
FOR ALL
TO authenticated 
USING (true)
WITH CHECK (true);

-- Departments 테이블 RLS 정책
DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON public.departments;
DROP POLICY IF EXISTS "Allow admins full access to departments" ON public.departments;

-- 모든 인증된 사용자에게 departments 테이블 전체 권한 부여
CREATE POLICY "Enable all access for authenticated users on departments" 
ON public.departments 
FOR ALL
TO authenticated 
USING (true)
WITH CHECK (true);

-- Corporations 테이블 RLS 정책
DROP POLICY IF EXISTS "Allow authenticated users to read corporations" ON public.corporations;
DROP POLICY IF EXISTS "Allow admins full access to corporations" ON public.corporations;

-- 모든 인증된 사용자에게 corporations 테이블 전체 권한 부여
CREATE POLICY "Enable all access for authenticated users on corporations" 
ON public.corporations 
FOR ALL
TO authenticated 
USING (true)
WITH CHECK (true);

-- RLS 활성화 확인
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;

-- 테스트 데이터 삽입 (만약 비어있다면)
INSERT INTO public.positions (name, code, level, description) VALUES
('테스트직책', 'test', 1, '테스트용 직책')
ON CONFLICT (name) DO NOTHING;

-- 권한 확인을 위한 테스트 쿼리
SELECT '✅ RLS 정책 수정 완료!' as message;
SELECT '📋 현재 직책 목록:' as positions_title;
SELECT id, name, code, level FROM public.positions ORDER BY level, name LIMIT 10;

SELECT '🏢 현재 부서 목록:' as departments_title;
SELECT id, name, code FROM public.departments ORDER BY name LIMIT 10;

-- 정책 확인
SELECT '📋 Positions 테이블 정책:' as positions_policies;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'positions';

SELECT '🏢 Departments 테이블 정책:' as departments_policies;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'departments'; 