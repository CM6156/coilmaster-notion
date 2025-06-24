-- ========================================
-- 샘플 데이터 제거 스크립트
-- ========================================

-- 샘플 업무 데이터 삭제
DELETE FROM public.tasks WHERE id IN (
    'task-1',
    'task-2', 
    'task-3',
    'task-4',
    'task-5'
);

-- 샘플 프로젝트 데이터 삭제
DELETE FROM public.projects WHERE id IN (
    'project-1',
    'project-2'
);

-- 삭제 완료 메시지
SELECT '✅ 샘플 데이터가 성공적으로 삭제되었습니다!' as message; 