-- 📋 파일 업로드 테이블 및 설정 확인 스크립트
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. Storage 버킷 확인
-- =============================================
SELECT 
    '📦 Storage 버킷 상태' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ project-files 버킷 존재'
        ELSE '❌ project-files 버킷 없음'
    END as status,
    COALESCE(MAX(name), 'N/A') as bucket_name,
    COALESCE(MAX(public::text), 'N/A') as is_public,
    COALESCE(MAX(file_size_limit), 0) as size_limit_bytes,
    COALESCE(MAX(file_size_limit) / 1024 / 1024, 0) as size_limit_mb
FROM storage.buckets 
WHERE id = 'project-files';

-- =============================================
-- 2. files 테이블 확인
-- =============================================
SELECT 
    '📁 files 테이블 상태' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files' AND table_schema = 'public') 
        THEN '✅ files 테이블 존재'
        ELSE '❌ files 테이블 없음'
    END as status;

-- files 테이블 구조 확인 (존재하는 경우)
SELECT 
    '📁 files 테이블 구조' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'files' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 3. project_attachments 테이블 확인
-- =============================================
SELECT 
    '🔗 project_attachments 테이블 상태' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_attachments' AND table_schema = 'public') 
        THEN '✅ project_attachments 테이블 존재'
        ELSE '❌ project_attachments 테이블 없음'
    END as status;

-- project_attachments 테이블 구조 확인 (존재하는 경우)
SELECT 
    '🔗 project_attachments 테이블 구조' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_attachments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- 4. 외래키 제약 조건 확인
-- =============================================
SELECT 
    '🔗 외래키 제약 조건' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('files', 'project_attachments');

-- =============================================
-- 5. Storage 정책 확인
-- =============================================
SELECT 
    '🔐 Storage 정책 상태' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('✅ ', COUNT(*), '개 정책 존재')
        ELSE '❌ Storage 정책 없음'
    END as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%project_files%';

-- Storage 정책 상세 정보
SELECT 
    '🔐 Storage 정책 상세' as info,
    policyname,
    cmd as permission_type,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 파일 조회'
        WHEN cmd = 'INSERT' THEN '📤 파일 업로드'
        WHEN cmd = 'UPDATE' THEN '✏️ 파일 수정'
        WHEN cmd = 'DELETE' THEN '🗑️ 파일 삭제'
        ELSE cmd
    END as operation_description
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%project_files%'
ORDER BY cmd;

-- =============================================
-- 6. 인덱스 확인
-- =============================================
SELECT 
    '📊 인덱스 상태' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('files', 'project_attachments')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================
-- 7. 테이블 데이터 샘플 확인
-- =============================================

-- files 테이블 데이터 개수
SELECT 
    '📁 files 테이블 데이터' as info,
    COUNT(*) as total_files,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as files_last_7_days
FROM files;

-- project_attachments 테이블 데이터 개수
SELECT 
    '🔗 project_attachments 테이블 데이터' as info,
    COUNT(*) as total_attachments,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as attachments_last_7_days
FROM project_attachments;

-- 최근 파일 업로드 샘플 (최대 5개)
SELECT 
    '📄 최근 업로드 파일 샘플' as info,
    f.original_filename,
    f.content_type,
    f.file_size,
    f.created_at,
    pa.project_id
FROM files f
LEFT JOIN project_attachments pa ON f.id = pa.file_id
ORDER BY f.created_at DESC
LIMIT 5;

-- =============================================
-- 8. 종합 상태 요약
-- =============================================
SELECT 
    '📋 파일 업로드 시스템 종합 상태' as summary,
    CASE 
        WHEN (SELECT COUNT(*) FROM storage.buckets WHERE id = 'project-files') > 0
        AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'files' AND table_schema = 'public') > 0
        AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'project_attachments' AND table_schema = 'public') > 0
        AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%project_files%') > 0
        THEN '✅ 파일 업로드 시스템 완전 구성됨'
        ELSE '❌ 파일 업로드 시스템 설정 불완전'
    END as overall_status,
    CONCAT(
        '버킷: ', (SELECT COUNT(*) FROM storage.buckets WHERE id = 'project-files'),
        ', 테이블: ', 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('files', 'project_attachments') AND table_schema = 'public'),
        ', 정책: ',
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%project_files%')
    ) as component_counts;

-- =============================================
-- 9. 누락된 구성 요소 확인 및 권장사항
-- =============================================
SELECT 
    '🚨 누락된 구성 요소 및 권장사항' as recommendations,
    CASE 
        WHEN (SELECT COUNT(*) FROM storage.buckets WHERE id = 'project-files') = 0
        THEN '1. project-files Storage 버킷 생성 필요'
        ELSE ''
    END as bucket_recommendation,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'files' AND table_schema = 'public') = 0
        THEN '2. files 테이블 생성 필요'
        ELSE ''
    END as files_table_recommendation,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'project_attachments' AND table_schema = 'public') = 0
        THEN '3. project_attachments 테이블 생성 필요'
        ELSE ''
    END as attachments_table_recommendation,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%project_files%') = 0
        THEN '4. Storage 정책 설정 필요'
        ELSE ''
    END as policies_recommendation; 