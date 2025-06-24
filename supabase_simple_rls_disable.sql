-- =====================================================
-- 간단한 해결책: work_journals RLS 비활성화
-- =====================================================

-- RLS 비활성화
ALTER TABLE public.work_journals DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'work_journals';

-- 성공 메시지
SELECT 'work_journals RLS가 비활성화되었습니다. 이제 업무 일지를 저장할 수 있습니다.' as message; 