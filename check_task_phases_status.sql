-- =============================================
-- 현재 상태 확인 쿼리
-- =============================================

-- 1. task_phases 테이블 존재 및 데이터 확인
SELECT 
    'task_phases 테이블 상태' as info,
    COUNT(*) as total_phases
FROM task_phases;

SELECT 
    id,
    name,
    order_index,
    is_active,
    color
FROM task_phases 
ORDER BY order_index;

-- 2. tasks 테이블에서 task_phase 필드 상태 확인
SELECT 
    'tasks 테이블 상태' as info,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN task_phase IS NOT NULL THEN 1 END) as tasks_with_phase,
    COUNT(CASE WHEN task_phase IS NULL THEN 1 END) as tasks_without_phase
FROM tasks;

-- 3. 업무별 task_phase 상태 확인
SELECT 
    t.title,
    t.task_phase,
    tp.name as phase_name,
    tp.order_index
FROM tasks t
LEFT JOIN task_phases tp ON t.task_phase = tp.id
ORDER BY t.title
LIMIT 20;

-- 4. task_phases가 비어있는지 확인
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'task_phases 테이블이 비어있습니다!'
        ELSE 'task_phases 테이블에 데이터가 있습니다.'
    END as phase_status
FROM task_phases;

-- 5. 재확인
SELECT 
    'task_phases 삽입 후 상태' as info,
    COUNT(*) as total_phases
FROM task_phases; 