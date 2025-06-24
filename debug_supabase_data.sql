-- ========================================
-- Supabase 업무일지 데이터 디버깅 스크립트
-- ========================================

-- 1. work_journals 테이블 존재 여부 및 구조 확인
SELECT 'work_journals 테이블 구조:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'work_journals' 
ORDER BY ordinal_position;

-- 2. 실제 저장된 데이터 확인
SELECT '=== 저장된 업무일지 데이터 ===' as info;
SELECT 
    id,
    user_id,
    author_id,
    title,
    LEFT(content, 50) as content_preview,
    date,
    status,
    author_name,
    created_at,
    updated_at
FROM work_journals
ORDER BY created_at DESC
LIMIT 10;

-- 3. 데이터 개수 확인
SELECT 
    COUNT(*) as total_count,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM work_journals;

-- 4. 사용자별 업무일지 개수
SELECT 
    user_id,
    author_id,
    author_name,
    COUNT(*) as journal_count
FROM work_journals
GROUP BY user_id, author_id, author_name
ORDER BY journal_count DESC;

-- 5. 최근 5분 내 생성된 레코드 확인
SELECT 
    '=== 최근 5분 내 생성된 업무일지 ===' as info,
    id,
    title,
    user_id,
    author_name,
    created_at
FROM work_journals
WHERE created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- 6. NULL 값 분석
SELECT 
    'NULL 값 분석:' as info,
    COUNT(CASE WHEN title IS NULL THEN 1 END) as null_title_count,
    COUNT(CASE WHEN content IS NULL THEN 1 END) as null_content_count,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id_count,
    COUNT(CASE WHEN author_id IS NULL THEN 1 END) as null_author_id_count,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status_count
FROM work_journals;

-- 7. RLS 정책 확인
SELECT 
    'RLS 정책 상태:' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'work_journals';

-- 8. RLS 정책 목록
SELECT 
    'work_journals 테이블의 RLS 정책들:' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'work_journals';

-- 9. 현재 인증된 사용자 확인 (Supabase auth.uid())
SELECT 
    'Current auth.uid():' as info,
    auth.uid() as current_user_id; 