-- 프로젝트 테이블 스키마 문제 해결 SQL
-- 이 SQL을 Supabase 대시보드 > SQL Editor에서 실행하세요.

-- =============================================
-- 1. 현재 projects 테이블 구조 확인
-- =============================================
SELECT 
  '📋 현재 projects 테이블 컬럼 구조' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 2. department_id 컬럼 존재 여부 확인
-- =============================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'projects' 
        AND column_name = 'department_id'
        AND table_schema = 'public'
    ) 
    THEN '✅ department_id 컬럼이 존재합니다'
    ELSE '❌ department_id 컬럼이 없습니다'
  END as department_id_status;

-- =============================================
-- 3. department_id 컬럼 추가 (없는 경우)
-- =============================================
DO $$ 
BEGIN
    -- department_id 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
          AND column_name = 'department_id'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN department_id UUID;
        
        RAISE NOTICE '✅ department_id 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ department_id 컬럼이 이미 존재합니다';
    END IF;
    
    -- department 컬럼이 없으면 추가 (기존 코드 호환성을 위해)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
          AND column_name = 'department'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN department VARCHAR(255);
        
        RAISE NOTICE '✅ department 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ department 컬럼이 이미 존재합니다';
    END IF;
    
    -- pic_name 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
          AND column_name = 'pic_name'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN pic_name VARCHAR(255);
        
        RAISE NOTICE '✅ pic_name 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ pic_name 컬럼이 이미 존재합니다';
    END IF;
    
    -- current_phase_id 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
          AND column_name = 'current_phase_id'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN current_phase_id UUID;
        
        RAISE NOTICE '✅ current_phase_id 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ current_phase_id 컬럼이 이미 존재합니다';
    END IF;
    
    -- promotion_stage 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
          AND column_name = 'promotion_stage'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN promotion_stage VARCHAR(50) DEFAULT 'Promotion';
        
        RAISE NOTICE '✅ promotion_stage 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ promotion_stage 컬럼이 이미 존재합니다';
    END IF;
    
END $$;

-- =============================================
-- 4. 외래키 제약 조건 추가 (departments 테이블과 연결)
-- =============================================
DO $$
BEGIN
    -- departments 테이블이 존재하는지 확인
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'departments' 
          AND table_schema = 'public'
    ) THEN
        -- 외래키 제약 조건이 없으면 추가
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_projects_department_id'
              AND table_name = 'projects'
              AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.projects 
            ADD CONSTRAINT fk_projects_department_id 
            FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
            
            RAISE NOTICE '✅ departments 외래키 제약 조건이 추가되었습니다';
        ELSE
            RAISE NOTICE '✅ departments 외래키 제약 조건이 이미 존재합니다';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ departments 테이블이 존재하지 않습니다';
    END IF;
    
    -- phases 테이블이 존재하는지 확인
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'phases' 
          AND table_schema = 'public'
    ) THEN
        -- phases 외래키 제약 조건이 없으면 추가
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_projects_current_phase_id'
              AND table_name = 'projects'
              AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.projects 
            ADD CONSTRAINT fk_projects_current_phase_id 
            FOREIGN KEY (current_phase_id) REFERENCES public.phases(id) ON DELETE SET NULL;
            
            RAISE NOTICE '✅ phases 외래키 제약 조건이 추가되었습니다';
        ELSE
            RAISE NOTICE '✅ phases 외래키 제약 조건이 이미 존재합니다';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ phases 테이블이 존재하지 않습니다';
    END IF;
    
END $$;

-- =============================================
-- 5. 인덱스 추가 (성능 최적화)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_projects_department_id ON public.projects(department_id);
CREATE INDEX IF NOT EXISTS idx_projects_current_phase_id ON public.projects(current_phase_id);
CREATE INDEX IF NOT EXISTS idx_projects_promotion_stage ON public.projects(promotion_stage);
CREATE INDEX IF NOT EXISTS idx_projects_pic_name ON public.projects(pic_name);

-- =============================================
-- 6. 수정된 테이블 구조 확인
-- =============================================
SELECT 
  '✅ 수정된 projects 테이블 컬럼 구조' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 7. 외래키 제약 조건 확인
-- =============================================
SELECT 
  '🔗 외래키 제약 조건 확인' as info,
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.referential_constraints rc 
  ON kcu.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage fkcu 
  ON rc.unique_constraint_name = fkcu.constraint_name
WHERE kcu.table_name = 'projects' 
  AND kcu.table_schema = 'public'
ORDER BY constraint_name;

-- =============================================
-- 8. 현재 프로젝트 데이터 확인 (샘플)
-- =============================================
SELECT 
  '📊 현재 프로젝트 데이터 (샘플 3개)' as info,
  id,
  name,
  department,
  department_id,
  pic_name,
  promotion_stage,
  current_phase_id,
  created_at
FROM public.projects 
ORDER BY created_at DESC 
LIMIT 3; 