-- 🔍 파일 업로드 디버깅 도구
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. 현재 테이블들 상태 확인
-- =============================================

-- files 테이블 확인
SELECT 
    '📁 files 테이블 현황' as info,
    COUNT(*) as total_files,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as recent_files
FROM files;

-- project_attachments 테이블 확인  
SELECT 
    '🔗 project_attachments 테이블 현황' as info,
    COUNT(*) as total_attachments,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as recent_attachments
FROM project_attachments;

-- Storage 버킷 확인
SELECT 
    '📦 Storage 버킷 확인' as info,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb
FROM storage.buckets 
WHERE id = 'project-files';

-- Storage 정책 확인
SELECT 
    '🔐 Storage 정책 확인' as info,
    policyname,
    cmd as permission_type
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%project_files%'
ORDER BY cmd;

-- =============================================
-- 2. 테스트 데이터 삽입 (수동 테스트)
-- =============================================

-- 테스트용 files 레코드 삽입
INSERT INTO public.files (
    filename,
    original_filename,
    content_type,
    file_size,
    file_path,
    uploaded_by,
    bucket_id
) VALUES (
    'test_file_123.txt',
    'test.txt',
    'text/plain',
    100,
    'test_file_123.txt',
    (SELECT id FROM auth.users LIMIT 1), -- 첫 번째 사용자
    'project-files'
) RETURNING id, filename, original_filename;

-- 테스트용 project_attachments 레코드 삽입
INSERT INTO public.project_attachments (
    project_id,
    file_id,
    file_name,
    file_url,
    file_size,
    description
) VALUES (
    (SELECT id FROM projects LIMIT 1), -- 첫 번째 프로젝트
    (SELECT id FROM files WHERE filename = 'test_file_123.txt'),
    'test.txt',
    'https://example.com/test.txt',
    100,
    '테스트 파일'
) RETURNING id, project_id, file_name;

-- =============================================
-- 3. 삽입 결과 확인
-- =============================================

-- 방금 삽입된 데이터 확인
SELECT 
    '✅ 테스트 삽입 결과' as info,
    f.filename,
    f.original_filename,
    pa.file_name,
    pa.description,
    f.created_at
FROM files f
JOIN project_attachments pa ON f.id = pa.file_id
WHERE f.filename = 'test_file_123.txt';

-- =============================================
-- 4. 권한 및 RLS 정책 확인
-- =============================================

-- 현재 사용자 확인
SELECT 
    '👤 현재 사용자 정보' as info,
    current_user as db_user,
    current_setting('role') as current_role;

-- 테이블 권한 확인
SELECT 
    '🔒 테이블 권한 확인' as info,
    schemaname,
    tablename,
    tableowner,
    hasinserts,
    hasselects,
    hasupdates,
    hasdeletes
FROM pg_tables 
WHERE tablename IN ('files', 'project_attachments');

-- =============================================
-- 5. 정리 (테스트 데이터 삭제)
-- =============================================

-- 테스트 데이터 삭제
DELETE FROM public.project_attachments 
WHERE file_id IN (SELECT id FROM files WHERE filename = 'test_file_123.txt');

DELETE FROM public.files 
WHERE filename = 'test_file_123.txt';

SELECT '🧹 테스트 데이터 정리 완료' as cleanup_status; 