-- =====================================================
-- 개발/테스트용: work_journals RLS 임시 비활성화
-- ⚠️ 주의: 프로덕션 환경에서는 사용하지 마세요!
-- =====================================================

-- RLS 비활성화 (모든 사용자가 모든 데이터에 접근 가능)
ALTER TABLE public.work_journals DISABLE ROW LEVEL SECURITY;

-- 현재 RLS 상태 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'work_journals';

-- 테스트용 데이터 삽입 시도
INSERT INTO public.work_journals (
    title, 
    content, 
    date, 
    user_id, 
    author_id, 
    author_name, 
    status
) VALUES (
    'Test Journal',
    'This is a test journal entry',
    CURRENT_DATE,
    '1',
    '1',
    'Test User',
    'completed'
);

-- 삽입된 데이터 확인
SELECT * FROM public.work_journals 
ORDER BY created_at DESC 
LIMIT 1; 