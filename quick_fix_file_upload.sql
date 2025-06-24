-- 🚨 파일 업로드 문제 즉시 해결 스크립트
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. 현재 상태 진단
-- =============================================
DO $$ 
BEGIN
    RAISE NOTICE '🔍 파일 업로드 문제 진단 시작...';
END $$;

-- Storage 버킷 확인
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ project-files 버킷 존재함'
        ELSE '❌ project-files 버킷 없음'
    END as bucket_status,
    COALESCE(MAX(name), 'N/A') as bucket_name,
    COALESCE(MAX(public::text), 'N/A') as is_public
FROM storage.buckets 
WHERE id = 'project-files';

-- Files 테이블 확인
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') 
        THEN '✅ files 테이블 존재함'
        ELSE '❌ files 테이블 없음'
    END as files_table_status;

-- Project attachments 테이블 확인
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_attachments') 
        THEN '✅ project_attachments 테이블 존재함'
        ELSE '❌ project_attachments 테이블 없음'
    END as attachments_table_status;

-- Storage 정책 확인
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Storage 정책 존재함'
        ELSE '❌ Storage 정책 없음'
    END as policies_status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%project_files%';

-- =============================================
-- 2. 즉시 수정 (버킷이 없는 경우)
-- =============================================

-- project-files 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-files',
    'project-files', 
    true,
    52428800, -- 50MB
    ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- 3. Storage 정책 즉시 생성 (기존 정책 덮어쓰기)
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
-- 4. Files 테이블 생성 (없는 경우)
-- =============================================
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    content_type VARCHAR,
    file_size BIGINT,
    file_path VARCHAR NOT NULL,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. Project attachments 테이블 생성 (없는 경우)
-- =============================================
CREATE TABLE IF NOT EXISTS public.project_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL,
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. 인덱스 생성
-- =============================================
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON public.project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_file_id ON public.project_attachments(file_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);

-- =============================================
-- 7. 최종 확인
-- =============================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ 파일 업로드 수정 완료!';
END $$;

-- 수정 결과 확인
SELECT 
    '🎉 수정 완료 - 상태 확인' as status,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'project-files') as bucket_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND policyname LIKE '%project_files%') as policy_count,
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files') THEN 1 ELSE 0 END) as files_table,
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_attachments') THEN 1 ELSE 0 END) as attachments_table;

-- 버킷 정보 최종 확인
SELECT 
    '📦 버킷 정보' as info,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE id = 'project-files';

-- 정책 정보 최종 확인
SELECT 
    '🔐 정책 정보' as info,
    policyname,
    cmd as permission_type
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%project_files%'
ORDER BY cmd; 