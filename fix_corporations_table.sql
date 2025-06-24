-- corporations 테이블에 누락된 컬럼 추가 및 문제 해결

-- 1. corporations 테이블에 누락된 컬럼들 추가
ALTER TABLE public.corporations 
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

ALTER TABLE public.corporations 
ADD COLUMN IF NOT EXISTS type VARCHAR(50);

ALTER TABLE public.corporations 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.corporations 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.corporations 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

ALTER TABLE public.corporations 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. 기존 데이터에 기본값 설정
UPDATE public.corporations 
SET country = 'Korea'
WHERE country IS NULL;

UPDATE public.corporations 
SET type = 'Corporation'
WHERE type IS NULL;

UPDATE public.corporations 
SET description = name || ' 법인'
WHERE description IS NULL;

-- 3. departments 테이블에도 누락된 컬럼 추가
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS code VARCHAR(50);

ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS description TEXT;

-- departments 기본값 설정
UPDATE public.departments 
SET code = CASE 
    WHEN name = '경영' THEN 'MGT'
    WHEN name = '개발' THEN 'DEV'
    WHEN name = '영업' THEN 'SALES'
    WHEN name = '마케팅' THEN 'MKT'
    WHEN name = '인사' THEN 'HR'
    WHEN name = '재무' THEN 'FIN'
    WHEN name = '총무' THEN 'GA'
    ELSE 'DEPT'
END
WHERE code IS NULL;

UPDATE public.departments 
SET description = name || ' 관련 업무'
WHERE description IS NULL;

-- 4. RLS 정책 설정
-- corporations 테이블
ALTER TABLE public.corporations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_corporations" ON public.corporations;
CREATE POLICY "allow_all_corporations" ON public.corporations
    FOR ALL USING (true) WITH CHECK (true);

-- departments 테이블
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_departments" ON public.departments;
CREATE POLICY "allow_all_departments" ON public.departments
    FOR ALL USING (true) WITH CHECK (true);

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_corporations_name ON public.corporations(name);
CREATE INDEX IF NOT EXISTS idx_corporations_code ON public.corporations(code);
CREATE INDEX IF NOT EXISTS idx_corporations_country ON public.corporations(country);
CREATE INDEX IF NOT EXISTS idx_corporations_type ON public.corporations(type);

CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(code);

-- 6. 현재 데이터 확인
SELECT '=== corporations 테이블 데이터 ===' as status;
SELECT id, name, code, country, type, description FROM public.corporations;

SELECT '=== departments 테이블 데이터 ===' as status;
SELECT id, name, code, description, corporation_id FROM public.departments;

SELECT '✅ corporations 및 departments 테이블 수정 완료!' as message; 