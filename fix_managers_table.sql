-- managers 테이블에 누락된 컬럼 추가 및 문제 해결

-- 1. managers 테이블에 누락된 컬럼들 추가
ALTER TABLE public.managers 
ADD COLUMN IF NOT EXISTS corporation_id UUID REFERENCES public.corporations(id);

ALTER TABLE public.managers 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

ALTER TABLE public.managers 
ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id);

ALTER TABLE public.managers 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

ALTER TABLE public.managers 
ADD COLUMN IF NOT EXISTS hire_date DATE;

ALTER TABLE public.managers 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 2. employees 테이블에도 동일한 컬럼들 추가
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS corporation_id UUID REFERENCES public.corporations(id);

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id);

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS hire_date DATE;

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 3. clients 테이블에도 필요한 컬럼들 추가
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 4. 기존 데이터에 기본값 설정
-- 기본 법인 ID 가져오기
DO $$
DECLARE
    default_corp_id UUID;
    default_dept_id UUID;
    default_pos_id UUID;
BEGIN
    -- 기본 법인 찾기
    SELECT id INTO default_corp_id FROM public.corporations LIMIT 1;
    
    -- 기본 부서 찾기
    SELECT id INTO default_dept_id FROM public.departments LIMIT 1;
    
    -- 기본 직책 찾기
    SELECT id INTO default_pos_id FROM public.positions LIMIT 1;
    
    -- managers 업데이트
    IF default_corp_id IS NOT NULL THEN
        UPDATE public.managers 
        SET corporation_id = default_corp_id
        WHERE corporation_id IS NULL;
    END IF;
    
    IF default_dept_id IS NOT NULL THEN
        UPDATE public.managers 
        SET department_id = default_dept_id
        WHERE department_id IS NULL;
    END IF;
    
    IF default_pos_id IS NOT NULL THEN
        UPDATE public.managers 
        SET position_id = default_pos_id
        WHERE position_id IS NULL;
    END IF;
    
    -- employees 업데이트
    IF default_corp_id IS NOT NULL THEN
        UPDATE public.employees 
        SET corporation_id = default_corp_id
        WHERE corporation_id IS NULL;
    END IF;
    
    IF default_dept_id IS NOT NULL THEN
        UPDATE public.employees 
        SET department_id = default_dept_id
        WHERE department_id IS NULL;
    END IF;
    
    IF default_pos_id IS NOT NULL THEN
        UPDATE public.employees 
        SET position_id = default_pos_id
        WHERE position_id IS NULL;
    END IF;
END $$;

-- 5. RLS 정책 확인 및 재설정
-- managers 테이블
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_mgr" ON public.managers;
DROP POLICY IF EXISTS "allow_all_managers" ON public.managers;
CREATE POLICY "allow_all_managers" ON public.managers
    FOR ALL USING (true) WITH CHECK (true);

-- employees 테이블
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_emp" ON public.employees;
DROP POLICY IF EXISTS "allow_all_employees" ON public.employees;
CREATE POLICY "allow_all_employees" ON public.employees
    FOR ALL USING (true) WITH CHECK (true);

-- clients 테이블
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_cli" ON public.clients;
DROP POLICY IF EXISTS "allow_all_clients" ON public.clients;
CREATE POLICY "allow_all_clients" ON public.clients
    FOR ALL USING (true) WITH CHECK (true);

-- 6. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_managers_corporation_id ON public.managers(corporation_id);
CREATE INDEX IF NOT EXISTS idx_managers_department_id ON public.managers(department_id);
CREATE INDEX IF NOT EXISTS idx_managers_position_id ON public.managers(position_id);
CREATE INDEX IF NOT EXISTS idx_managers_email ON public.managers(email);

CREATE INDEX IF NOT EXISTS idx_employees_corporation_id ON public.employees(corporation_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position_id ON public.employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);

CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- 7. 현재 데이터 확인
SELECT '=== managers 테이블 데이터 ===' as status;
SELECT id, name, email, corporation_id, department_id, position_id FROM public.managers;

SELECT '=== employees 테이블 데이터 ===' as status;
SELECT id, name, email, corporation_id, department_id, position_id FROM public.employees;

SELECT '=== clients 테이블 데이터 ===' as status;
SELECT id, name, email, phone, contact_person FROM public.clients;

SELECT '✅ managers, employees, clients 테이블 수정 완료!' as message;

-- 1. managers 테이블 현재 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'managers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. managers 테이블이 존재하는지 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'managers';

-- 3. profile_image 컬럼 추가 (IF NOT EXISTS 사용)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'managers' 
        AND column_name = 'profile_image'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.managers ADD COLUMN profile_image TEXT;
        RAISE NOTICE 'profile_image 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'profile_image 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 4. 컬럼 추가 후 다시 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'managers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. 테스트 쿼리 (profile_image 컬럼 포함)
SELECT 
    id, 
    name, 
    email, 
    profile_image
FROM public.managers 
LIMIT 3; 