-- tasks 테이블 스키마 확인 및 수정
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. tasks 테이블 현재 구조 확인
-- =============================================
SELECT 
    '📋 현재 tasks 테이블 구조' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 2. 누락된 컬럼 추가 (안전한 방식)
-- =============================================

-- start_date 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
          AND column_name = 'start_date'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN start_date DATE;
        RAISE NOTICE '✅ start_date 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⚠️ start_date 컬럼이 이미 존재함';
    END IF;
END $$;

-- due_date 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
          AND column_name = 'due_date'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN due_date DATE;
        RAISE NOTICE '✅ due_date 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⚠️ due_date 컬럼이 이미 존재함';
    END IF;
END $$;

-- department 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
          AND column_name = 'department'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN department VARCHAR(100);
        RAISE NOTICE '✅ department 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⚠️ department 컬럼이 이미 존재함';
    END IF;
END $$;

-- task_phase 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
          AND column_name = 'task_phase'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN task_phase UUID;
        RAISE NOTICE '✅ task_phase 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⚠️ task_phase 컬럼이 이미 존재함';
    END IF;
END $$;

-- parent_task_id 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
          AND column_name = 'parent_task_id'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ parent_task_id 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⚠️ parent_task_id 컬럼이 이미 존재함';
    END IF;
END $$;

-- assigned_to 컬럼 추가 (없을 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
          AND column_name = 'assigned_to'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN assigned_to UUID;
        RAISE NOTICE '✅ assigned_to 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⚠️ assigned_to 컬럼이 이미 존재함';
    END IF;
END $$;

-- project_id 컬럼 추가 (없을 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
          AND column_name = 'project_id'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ project_id 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⚠️ project_id 컬럼이 이미 존재함';
    END IF;
END $$;

-- =============================================
-- 3. 제약 조건 확인 및 수정
-- =============================================

-- status 컬럼의 CHECK 제약 조건 확인
SELECT 
    '📋 status 컬럼 제약 조건' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.tasks'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%status%';

-- priority 컬럼의 CHECK 제약 조건 확인
SELECT 
    '📋 priority 컬럼 제약 조건' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.tasks'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%priority%';

-- =============================================
-- 4. 제약 조건 제거 (한국어 상태 허용)
-- =============================================

-- status CHECK 제약 조건 제거
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- status 관련 CHECK 제약 조건 찾기
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.tasks'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.tasks DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE '✅ status CHECK 제약 조건 제거됨: %', constraint_name;
    END IF;
END $$;

-- priority CHECK 제약 조건 제거
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- priority 관련 CHECK 제약 조건 찾기
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.tasks'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%priority%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.tasks DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE '✅ priority CHECK 제약 조건 제거됨: %', constraint_name;
    END IF;
END $$;

-- =============================================
-- 5. 기본값 설정
-- =============================================

-- status 기본값 설정
ALTER TABLE public.tasks ALTER COLUMN status SET DEFAULT '할 일';

-- priority 기본값 설정
ALTER TABLE public.tasks ALTER COLUMN priority SET DEFAULT '보통';

-- =============================================
-- 6. 수정된 테이블 구조 확인
-- =============================================
SELECT 
    '✅ 수정된 tasks 테이블 구조' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 7. 테스트 (프로젝트가 있는 경우에만)
-- =============================================
DO $$
DECLARE
    test_project_id UUID;
BEGIN
    -- 첫 번째 프로젝트 ID 가져오기
    SELECT id INTO test_project_id FROM public.projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- 테스트용 업무 생성
        INSERT INTO public.tasks (
            title,
            description,
            status,
            priority,
            progress,
            start_date,
            due_date,
            project_id,
            department,
            created_at,
            updated_at
        ) VALUES (
            '테스트 업무',
            '스키마 테스트용 업무',
            '진행중',
            '높음',
            50,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '7 days',
            test_project_id,
            '개발',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ 테스트 업무가 생성되었습니다';
        
        -- 생성된 테스트 업무 확인
        PERFORM * FROM public.tasks WHERE title = '테스트 업무' LIMIT 1;
        
        -- 테스트 업무 삭제
        DELETE FROM public.tasks WHERE title = '테스트 업무';
        RAISE NOTICE '✅ 테스트 업무가 삭제되었습니다';
    ELSE
        RAISE NOTICE '⚠️ 프로젝트가 없어서 테스트를 건너뜁니다';
    END IF;
END $$;

-- =============================================
-- 8. 최종 확인
-- =============================================
SELECT 
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name IN ('title', 'description', 'status', 'priority', 'progress', 
                                     'start_date', 'due_date', 'project_id', 'assigned_to', 
                                     'department', 'task_phase', 'parent_task_id', 
                                     'created_at', 'updated_at') THEN 1 END) as required_columns
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND table_schema = 'public';

-- 완료 메시지
SELECT '✅ tasks 테이블 스키마 확인 및 수정 완료!' as message; 