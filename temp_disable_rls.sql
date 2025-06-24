-- ========================================
-- 임시 RLS 비활성화 (문제 진단용)
-- ========================================

-- 경고: 이 스크립트는 진단 목적으로만 사용하세요
-- 문제 해결 후 다시 RLS를 활성화해야 합니다

-- 1. 현재 RLS 상태 확인
SELECT 
    'RLS 현재 상태:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'work_journals';

-- 2. 현재 정책 목록 확인
SELECT 
    'work_journals 정책 목록:' as info,
    policyname,
    cmd as command_type,
    permissive,
    qual as condition
FROM pg_policies 
WHERE tablename = 'work_journals';

-- 3. 임시로 RLS 비활성화
ALTER TABLE work_journals DISABLE ROW LEVEL SECURITY;

-- 4. RLS 비활성화 후 상태 확인
SELECT 
    'RLS 비활성화 후 상태:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'work_journals';

-- 5. 데이터 조회 테스트
SELECT 
    '=== RLS 비활성화 후 데이터 조회 ===' as info,
    COUNT(*) as total_records
FROM work_journals;

-- 6. 최근 데이터 확인
SELECT 
    id,
    user_id,
    author_id,
    title,
    LEFT(content, 30) as content_preview,
    created_at
FROM work_journals
ORDER BY created_at DESC
LIMIT 5;

-- 주의: 문제 해결 후 다음 명령으로 RLS를 다시 활성화하세요
-- ALTER TABLE work_journals ENABLE ROW LEVEL SECURITY; 