-- 🔧 files 테이블 bucket_id 컬럼 누락 문제 해결
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. 현재 files 테이블 구조 확인
-- =============================================
SELECT 
    '📋 현재 files 테이블 구조' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'files' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 2. bucket_id 컬럼 존재 여부 확인
-- =============================================
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'files' 
              AND column_name = 'bucket_id'
              AND table_schema = 'public'
        ) 
        THEN '✅ bucket_id 컬럼이 존재합니다'
        ELSE '❌ bucket_id 컬럼이 없습니다'
    END as bucket_id_status;

-- =============================================
-- 3. files 테이블에 누락된 컬럼들 추가
-- =============================================

-- bucket_id 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'files' 
          AND column_name = 'bucket_id'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.files 
        ADD COLUMN bucket_id VARCHAR DEFAULT 'project-files';
        
        RAISE NOTICE '✅ bucket_id 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ bucket_id 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- =============================================
-- 4. 기존 files 레코드의 bucket_id 업데이트
-- =============================================
UPDATE public.files 
SET bucket_id = 'project-files' 
WHERE bucket_id IS NULL OR bucket_id = '';

-- =============================================
-- 5. project-files Storage 버킷 생성 (다시 시도)
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
-- 6. Storage 정책 재생성
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
-- 7. project_attachments 테이블 필수 컬럼 추가
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
        ADD COLUMN file_id UUID;
        
        -- 외래키 제약 조건은 나중에 추가 (데이터 정리 후)
        RAISE NOTICE '✅ file_id 컬럼이 추가되었습니다';
    ELSE
        RAISE NOTICE '✅ file_id 컬럼이 이미 존재합니다';
    END IF;
END $$;

-- file_name 컬럼이 없으면 추가
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

-- file_url 컬럼이 없으면 추가
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

-- =============================================
-- 8. 인덱스 생성
-- =============================================
CREATE INDEX IF NOT EXISTS idx_files_bucket_id ON public.files(bucket_id);
CREATE INDEX IF NOT EXISTS idx_files_file_path ON public.files(file_path);
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON public.project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_file_id ON public.project_attachments(file_id);

-- =============================================
-- 9. 수정된 테이블 구조 확인
-- =============================================
SELECT 
    '✅ 수정된 files 테이블 구조' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'files' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

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
-- 10. 설정 완료 확인
-- =============================================
SELECT 
    '🎉 파일 업로드 시스템 설정 완료' as status,
    CONCAT(
        'Storage 버킷: ', (SELECT COUNT(*) FROM storage.buckets WHERE id = 'project-files'),
        ', files 테이블: ', (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') THEN 1 ELSE 0 END),
        ', project_attachments 테이블: ', (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_attachments') THEN 1 ELSE 0 END),
        ', Storage 정책: ', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND policyname LIKE '%project_files%'),
        ', bucket_id 컬럼: ', (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'files' AND column_name = 'bucket_id') THEN '✅' ELSE '❌' END)
    ) as component_status;

-- 최종 버킷 확인
SELECT 
    '📦 버킷 정보' as info,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE id = 'project-files'; 