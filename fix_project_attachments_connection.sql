-- 🔧 project_attachments 테이블을 활용한 파일 업로드 시스템 완전 구성
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. 현재 project_attachments 테이블 구조 확인
-- =============================================
SELECT 
    '📋 기존 project_attachments 테이블 구조' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_attachments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 2. project-files Storage 버킷 생성 (필수)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-files',
    'project-files', 
    true,
    52428800, -- 50MB
    ARRAY[
        'image/*', 
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 
        'application/zip',
        'application/x-rar-compressed',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- 3. files 테이블 생성 (project_attachments와 연결용)
-- =============================================
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    content_type VARCHAR,
    file_size BIGINT,
    file_path VARCHAR NOT NULL,
    uploaded_by UUID,
    bucket_id VARCHAR DEFAULT 'project-files',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. project_attachments 테이블 수정/보완
-- =============================================

-- file_id 컬럼이 없으면 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_attachments' 
          AND column_name = 'file_id'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.project_attachments 
        ADD COLUMN file_id UUID REFERENCES public.files(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ file_id 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ file_id 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- description 컬럼이 없으면 추가
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
        
        RAISE NOTICE '✅ description 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ description 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- file_name 컬럼이 없으면 추가 (직접 파일명 저장용)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_attachments' 
          AND column_name = 'file_name'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.project_attachments 
        ADD COLUMN file_name VARCHAR;
        
        RAISE NOTICE '✅ file_name 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ file_name 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- file_url 컬럼이 없으면 추가 (Storage URL 저장용)
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
        
        RAISE NOTICE '✅ file_url 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ file_url 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- file_size 컬럼이 없으면 추가
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
        
        RAISE NOTICE '✅ file_size 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ file_size 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- =============================================
-- 5. Storage 정책 생성 (인증 없이도 접근 가능하도록)
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "project_files_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "project_files_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "project_files_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "project_files_delete_policy" ON storage.objects;

-- 새 정책 생성 (더 관대한 권한)
CREATE POLICY "project_files_select_policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'project-files');

CREATE POLICY "project_files_insert_policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "project_files_update_policy" ON storage.objects
    FOR UPDATE USING (bucket_id = 'project-files');

CREATE POLICY "project_files_delete_policy" ON storage.objects
    FOR DELETE USING (bucket_id = 'project-files');

-- =============================================
-- 6. 인덱스 생성 (성능 최적화)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON public.project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_file_id ON public.project_attachments(file_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_bucket_id ON public.files(bucket_id);
CREATE INDEX IF NOT EXISTS idx_files_file_path ON public.files(file_path);

-- =============================================
-- 7. 파일 업로드를 위한 헬퍼 함수 생성
-- =============================================

-- 파일 URL 생성 함수
CREATE OR REPLACE FUNCTION get_file_url(file_path TEXT, bucket_name TEXT DEFAULT 'project-files')
RETURNS TEXT AS $$
DECLARE
    base_url TEXT;
BEGIN
    -- Supabase Storage URL 형식
    SELECT 
        CONCAT(
            current_setting('app.settings.supabase_url', true),
            '/storage/v1/object/public/',
            bucket_name,
            '/',
            file_path
        ) INTO base_url;
    
    RETURN base_url;
EXCEPTION
    WHEN OTHERS THEN
        -- 설정이 없으면 상대 경로 반환
        RETURN CONCAT('/storage/v1/object/public/', bucket_name, '/', file_path);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. 수정된 테이블 구조 확인
-- =============================================
SELECT 
    '✅ 수정된 project_attachments 테이블 구조' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_attachments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 9. 설정 완료 확인
-- =============================================
SELECT 
    '🎉 파일 업로드 시스템 설정 완료' as status,
    CONCAT(
        'Storage 버킷: ', (SELECT COUNT(*) FROM storage.buckets WHERE id = 'project-files'),
        ', files 테이블: ', (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') THEN 1 ELSE 0 END),
        ', project_attachments 테이블: ', (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_attachments') THEN 1 ELSE 0 END),
        ', Storage 정책: ', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND policyname LIKE '%project_files%')
    ) as component_status;

-- 버킷 최종 확인
SELECT 
    '📦 버킷 정보' as info,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE id = 'project-files';

-- 정책 최종 확인
SELECT 
    '🔐 정책 정보' as info,
    policyname,
    cmd as permission_type
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%project_files%'
ORDER BY cmd; 