-- projects 테이블에 department 컬럼 추가
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. 현재 projects 테이블 구조 확인
-- =============================================
SELECT 
    '📋 현재 projects 테이블 구조' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 2. department 컬럼 추가 (안전한 방식)
-- =============================================

-- department 컬럼 추가 (부서명 저장)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
          AND column_name = 'department'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN department VARCHAR(100);
        RAISE NOTICE '✅ department 컬럼 추가됨';
    ELSE
        RAISE NOTICE '✅ department 컬럼 이미 존재';
    END IF;
END $$;

-- department_id 컬럼 추가 (부서 ID 저장)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
          AND column_name = 'department_id'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN department_id UUID;
        RAISE NOTICE '✅ department_id 컬럼 추가됨';
    ELSE
        RAISE NOTICE '✅ department_id 컬럼 이미 존재';
    END IF;
END $$;

-- =============================================
-- 3. 외래키 제약 조건 추가 (선택사항)
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_department_id_fkey'
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE public.projects
        ADD CONSTRAINT projects_department_id_fkey 
        FOREIGN KEY (department_id) 
        REFERENCES public.departments(id) 
        ON DELETE SET NULL;
        RAISE NOTICE '✅ department_id 외래키 제약 조건 추가됨';
    ELSE
        RAISE NOTICE '✅ department_id 외래키 제약 조건 이미 존재';
    END IF;
END $$;

-- =============================================
-- 4. 인덱스 생성
-- =============================================
CREATE INDEX IF NOT EXISTS idx_projects_department 
ON public.projects(department);

CREATE INDEX IF NOT EXISTS idx_projects_department_id 
ON public.projects(department_id);

-- =============================================
-- 5. 수정된 테이블 구조 재확인
-- =============================================
SELECT 
    '✅ 수정된 projects 테이블 구조' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 6. 컬럼 추가 결과 확인
-- =============================================
SELECT 
    '✅ 컬럼 추가 완료' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'department') 
        THEN 'department 컬럼 존재 ✓'
        ELSE 'department 컬럼 없음 ✗'
    END as department_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'department_id') 
        THEN 'department_id 컬럼 존재 ✓'
        ELSE 'department_id 컬럼 없음 ✗'
    END as department_id_column;

-- =============================================
-- 7. 샘플 데이터 확인
-- =============================================
SELECT 
    '📊 프로젝트별 부서 분포' as info,
    department,
    COUNT(*) as project_count
FROM public.projects 
WHERE department IS NOT NULL
GROUP BY department
ORDER BY project_count DESC;

-- =============================================
-- 8. 업데이트 결과 확인
-- =============================================
SELECT 
    '✅ 업데이트 완료' as status,
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('총 ', COUNT(*), '개 프로젝트에 부서 정보 설정됨')
        ELSE '프로젝트가 없습니다'
    END as result
FROM public.projects 
WHERE department IS NOT NULL; 