-- 업무 상태값 확인 SQL
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- =============================================
-- 1. 현재 업무들의 상태값 분포 확인
-- =============================================
SELECT 
    '📊 업무 상태별 분포' as info,
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM public.tasks
GROUP BY status
ORDER BY count DESC;

-- =============================================
-- 2. 상태와 진행률 조합 확인
-- =============================================
SELECT 
    '📈 상태-진행률 조합' as info,
    status,
    progress,
    COUNT(*) as count
FROM public.tasks
GROUP BY status, progress
ORDER BY status, progress;

-- =============================================
-- 3. 프로젝트별 업무 상태 확인
-- =============================================
SELECT 
    '🗂️ 프로젝트별 업무 상태' as info,
    p.name as project_name,
    t.status,
    COUNT(*) as task_count
FROM public.tasks t
LEFT JOIN public.projects p ON t.project_id = p.id
GROUP BY p.name, t.status
ORDER BY p.name, t.status;

-- =============================================
-- 4. 최근 생성된 업무들의 상태 확인
-- =============================================
SELECT 
    '🆕 최근 생성된 업무 (최근 10개)' as info,
    id,
    title,
    status,
    progress,
    created_at
FROM public.tasks
ORDER BY created_at DESC
LIMIT 10;

-- =============================================
-- 5. 상태가 NULL이거나 빈 문자열인 업무 확인
-- =============================================
SELECT 
    '⚠️ 비정상 상태 업무' as info,
    id,
    title,
    status,
    progress,
    CASE 
        WHEN status IS NULL THEN 'NULL'
        WHEN status = '' THEN '빈 문자열'
        ELSE '기타'
    END as status_type
FROM public.tasks
WHERE status IS NULL OR status = '' OR status NOT IN (
    '시작전', '진행중 20%', '진행중 40%', '진행중 60%', '진행중 80%', '완료 100%',
    '할 일', '진행중', '검토중', '완료', '보류', '지연'
);

-- =============================================
-- 6. 상태 업데이트 테스트 (한국어 상태로 변경)
-- =============================================
-- 주의: 아래 쿼리는 실제로 데이터를 변경합니다. 필요한 경우에만 주석을 해제하고 실행하세요.

/*
-- 영어 상태를 한국어로 변경
UPDATE public.tasks
SET status = CASE 
    WHEN status IN ('not-started', 'to-do', 'todo') THEN '시작전'
    WHEN status IN ('in-progress', 'progress', 'doing') THEN '진행중 40%'
    WHEN status IN ('reviewing', 'review', 'pending') THEN '진행중 60%'
    WHEN status IN ('completed', 'done', 'finished') THEN '완료 100%'
    WHEN status IN ('delayed', 'blocked') THEN '진행중 20%'
    WHEN status IN ('on-hold', 'paused') THEN '보류'
    ELSE status
END
WHERE status IN (
    'not-started', 'to-do', 'todo',
    'in-progress', 'progress', 'doing',
    'reviewing', 'review', 'pending',
    'completed', 'done', 'finished',
    'delayed', 'blocked',
    'on-hold', 'paused'
);
*/

-- =============================================
-- 7. 상태별 진행률 일관성 확인
-- =============================================
SELECT 
    '🔍 상태-진행률 불일치 확인' as info,
    status,
    progress,
    COUNT(*) as count,
    CASE 
        WHEN status = '완료 100%' AND progress != 100 THEN '❌ 불일치'
        WHEN status = '시작전' AND progress != 0 THEN '❌ 불일치'
        WHEN status LIKE '진행중%' AND progress = 0 THEN '⚠️ 확인필요'
        WHEN status LIKE '진행중%' AND progress = 100 THEN '⚠️ 확인필요'
        ELSE '✅ 정상'
    END as consistency
FROM public.tasks
GROUP BY status, progress
ORDER BY consistency DESC, status, progress; 