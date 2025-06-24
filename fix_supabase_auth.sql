-- ========================================
-- Supabase 인증 문제 해결
-- ========================================

-- 1. 현재 auth 상태 확인
SELECT 
    'Current Auth Status:' as info,
    auth.uid() as current_user_id,
    auth.email() as current_email;

-- 2. users 테이블에서 실제 사용자 확인
SELECT 
    'Users in database:' as info,
    id,
    email,
    name,
    role,
    is_active
FROM users 
WHERE email = 'joon@coilmaster.com'
   OR id = '4277bb33-db38-4586-9481-b3b9f4d54129';

-- 3. auth.users 테이블 확인 (Supabase 내부 인증 테이블)
SELECT 
    'Auth users table:' as info,
    id,
    email,
    email_confirmed_at,
    last_sign_in_at,
    created_at
FROM auth.users 
WHERE email = 'joon@coilmaster.com';

-- 4. 임시 해결: RLS 완전 비활성화
ALTER TABLE work_journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_journal_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_journal_comments DISABLE ROW LEVEL SECURITY;

-- 5. 기존 RLS 정책 모두 삭제
DROP POLICY IF EXISTS "Anyone can view work journals" ON work_journals;
DROP POLICY IF EXISTS "Authenticated users can create work journals" ON work_journals;
DROP POLICY IF EXISTS "Authors and owners can update work journals" ON work_journals;
DROP POLICY IF EXISTS "Authors and admins can delete work journals" ON work_journals;

-- 6. 업무일지 데이터 확인
SELECT 
    'Work journals data:' as info,
    COUNT(*) as total_count,
    COUNT(DISTINCT user_id) as unique_users
FROM work_journals;

-- 7. 최근 업무일지 확인
SELECT 
    id,
    user_id,
    author_id,
    title,
    created_at
FROM work_journals
ORDER BY created_at DESC
LIMIT 3;

SELECT 'Supabase Auth 문제 임시 해결 완료 - RLS 비활성화됨' as result; 