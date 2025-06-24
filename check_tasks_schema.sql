-- Supabase 콘솔에서 실행하여 tasks 테이블 스키마 확인
-- SQL Editor > New Query 에서 실행하세요

-- 1. tasks 테이블 존재 여부 확인
SELECT 
  '📋 Tasks 테이블 존재 여부' as info,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks'
  ) as table_exists;

-- 2. tasks 테이블 컬럼 구조 확인
SELECT 
  '📋 Tasks 테이블 컬럼 구조' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- 3. tasks 테이블 제약조건 확인
SELECT 
  '📋 Tasks 테이블 제약조건' as info,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.tasks'::regclass;

-- 4. 현재 tasks 데이터 개수 확인
SELECT 
  '📊 현재 tasks 데이터 개수' as info,
  COUNT(*) as total_tasks
FROM public.tasks;

-- 5. 최근 생성된 tasks 확인 (최대 5개)
SELECT 
  '📝 최근 생성된 Tasks (최대 5개)' as info,
  id,
  title,
  project_id,
  status,
  created_at
FROM public.tasks
ORDER BY created_at DESC
LIMIT 5; 