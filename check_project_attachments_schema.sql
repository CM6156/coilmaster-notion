-- project_attachments 테이블 실제 구조 확인
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. project_attachments 테이블 존재 여부 및 구조 확인
-- =============================================
SELECT 
    '📋 project_attachments 테이블 구조' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_attachments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 2. 테이블이 없는 경우 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.project_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    file_name VARCHAR(500),
    file_url TEXT,
    file_size BIGINT,
    file_path VARCHAR(1000),
    content_type VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. 누락된 컬럼들 추가 (안전한 방식)
-- =============================================

-- file_name 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_attachments' 
          AND column_name = 'file_name'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.project_attachments 
        ADD COLUMN file_name VARCHAR(500);
        RAISE NOTICE '✅ file_name 컬럼 추가됨';
    ELSE
        RAISE NOTICE '✅ file_name 컬럼 이미 존재';
    END IF;
END $$;

-- file_url 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_attachments' 
          AND column_name = 'file_url'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.project_attachments 
        ADD COLUMN file_url TEXT;
        RAISE NOTICE '✅ file_url 컬럼 추가됨';
    ELSE
        RAISE NOTICE '✅ file_url 컬럼 이미 존재';
    END IF;
END $$;

-- file_size 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_attachments' 
          AND column_name = 'file_size'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.project_attachments 
        ADD COLUMN file_size BIGINT;
        RAISE NOTICE '✅ file_size 컬럼 추가됨';
    ELSE
        RAISE NOTICE '✅ file_size 컬럼 이미 존재';
    END IF;
END $$;

-- file_path 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_attachments' 
          AND column_name = 'file_path'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.project_attachments 
        ADD COLUMN file_path VARCHAR(1000);
        RAISE NOTICE '✅ file_path 컬럼 추가됨';
    ELSE
        RAISE NOTICE '✅ file_path 컬럼 이미 존재';
    END IF;
END $$;

-- content_type 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_attachments' 
          AND column_name = 'content_type'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.project_attachments 
        ADD COLUMN content_type VARCHAR(200);
        RAISE NOTICE '✅ content_type 컬럼 추가됨';
    ELSE
        RAISE NOTICE '✅ content_type 컬럼 이미 존재';
    END IF;
END $$;

-- description 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_attachments' 
          AND column_name = 'description'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.project_attachments 
        ADD COLUMN description TEXT;
        RAISE NOTICE '✅ description 컬럼 추가됨';
    ELSE
        RAISE NOTICE '✅ description 컬럼 이미 존재';
    END IF;
END $$;

-- =============================================
-- 4. 인덱스 생성
-- =============================================
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id 
ON public.project_attachments(project_id);

CREATE INDEX IF NOT EXISTS idx_project_attachments_created_at 
ON public.project_attachments(created_at);

-- =============================================
-- 5. 수정된 테이블 구조 재확인
-- =============================================
SELECT 
    '✅ 수정된 project_attachments 테이블 구조' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_attachments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 6. 테스트 쿼리 (실제 삽입 테스트)
-- =============================================
-- 실제 삽입이 가능한지 테스트 (실행하지 말고 확인용)
/*
INSERT INTO public.project_attachments (
    project_id,
    file_name,
    file_url,
    file_size,
    file_path,
    content_type,
    description
) VALUES (
    'test-project-id'::UUID,
    'test.pdf',
    'https://test.com/test.pdf',
    12345,
    'uploads/test.pdf',
    'application/pdf',
    '테스트 파일'
) RETURNING *;
*/ 