-- =============================================
-- 기존 업무들의 프로모션 단계 수정 스크립트
-- =============================================

-- 1. 현재 상황 확인
SELECT 
    t.id,
    t.title,
    t.task_phase,
    tp.name as phase_name,
    tp.order_index,
    p.name as project_name
FROM tasks t
LEFT JOIN task_phases tp ON t.task_phase = tp.id
LEFT JOIN projects p ON t.project_id = p.id
ORDER BY p.name, t.title;

-- 2. task_phases 테이블 데이터 확인
SELECT * FROM task_phases ORDER BY order_index;

-- 3. 기존 업무들이 task_phase가 NULL이거나 잘못된 경우 수정
-- 각 업무를 해당하는 프로모션 단계와 연결

-- 먼저 업무 제목에 따라 적절한 단계를 매핑
UPDATE tasks 
SET task_phase = (
    SELECT tp.id 
    FROM task_phases tp 
    WHERE tp.order_index = CASE 
        WHEN tasks.title LIKE '%PT-01%' OR tasks.title LIKE '%영업정보%' THEN 1
        WHEN tasks.title LIKE '%PT-02%' OR tasks.title LIKE '%견적서 및 접수%' THEN 2
        WHEN tasks.title LIKE '%PT-03%' OR tasks.title LIKE '%견적서 분석%' THEN 3
        WHEN tasks.title LIKE '%PT-04%' OR tasks.title LIKE '%원자재 소싱전략%' THEN 4
        WHEN tasks.title LIKE '%PT-05%' OR tasks.title LIKE '%SPL 접수%' THEN 5
        WHEN tasks.title LIKE '%PT-06%' OR tasks.title LIKE '%원재 소싱전략%' THEN 6
        WHEN tasks.title LIKE '%PT-07%' OR tasks.title LIKE '%원재 결정%' THEN 7
        WHEN tasks.title LIKE '%PT-08%' OR tasks.title LIKE '%E-Service Content%' THEN 8
        WHEN tasks.title LIKE '%PT-09%' OR tasks.title LIKE '%E-Service 완성%' THEN 9
        WHEN tasks.title LIKE '%PT-10%' OR tasks.title LIKE '%LINE 그래디%' THEN 10
        WHEN tasks.title LIKE '%PT-11%' OR tasks.title LIKE '%결과 산출%' THEN 11
        WHEN tasks.title LIKE '%PT-12%' OR tasks.title LIKE '%PP%' THEN 12
        WHEN tasks.title LIKE '%PT-13%' OR tasks.title LIKE '%품질 Review%' THEN 13
        WHEN tasks.title LIKE '%PT-14%' OR tasks.title LIKE '%최종 개선%' THEN 14
        WHEN tasks.title LIKE '%PT-15%' OR tasks.title LIKE '%수주%' THEN 15
        ELSE 1  -- 기본값은 첫 번째 단계
    END
    LIMIT 1
)
WHERE task_phase IS NULL OR task_phase NOT IN (SELECT id FROM task_phases);

-- 4. 업무 제목에 PT-XX 패턴이 있는 경우 더 정확한 매핑
UPDATE tasks 
SET task_phase = (
    SELECT tp.id 
    FROM task_phases tp 
    WHERE tp.order_index = CAST(
        SUBSTRING(tasks.title FROM 'PT-(\d+)')::INTEGER
    )
    LIMIT 1
)
WHERE tasks.title ~ 'PT-\d+' 
AND SUBSTRING(tasks.title FROM 'PT-(\d+)')::INTEGER BETWEEN 1 AND 15;

-- 5. 여전히 task_phase가 NULL인 업무들을 첫 번째 단계로 설정
UPDATE tasks 
SET task_phase = (
    SELECT id FROM task_phases WHERE order_index = 1 LIMIT 1
)
WHERE task_phase IS NULL;

-- 6. 수정 결과 확인
SELECT 
    t.title,
    tp.name as phase_name,
    tp.order_index,
    t.status,
    t.progress,
    p.name as project_name
FROM tasks t
LEFT JOIN task_phases tp ON t.task_phase = tp.id
LEFT JOIN projects p ON t.project_id = p.id
ORDER BY p.name, tp.order_index, t.title;

-- 7. 통계 확인
SELECT 
    tp.name as phase_name,
    tp.order_index,
    COUNT(t.id) as task_count
FROM task_phases tp
LEFT JOIN tasks t ON tp.id = t.task_phase
GROUP BY tp.id, tp.name, tp.order_index
ORDER BY tp.order_index;

-- 8. 프로젝트별 업무 단계 분포 확인
SELECT 
    p.name as project_name,
    tp.name as phase_name,
    tp.order_index,
    COUNT(t.id) as task_count
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN task_phases tp ON t.task_phase = tp.id
GROUP BY p.name, tp.name, tp.order_index
ORDER BY p.name, tp.order_index;

-- 9. 만약 task_phases 테이블이 비어있다면 기본 데이터 삽입
INSERT INTO task_phases (name, description, color, order_index, is_active)
SELECT * FROM (VALUES
    ('영업정보', 'Sales Info', '#ef4444', 1, true),
    ('견적서 및 접수', 'Quote & Receipt', '#f97316', 2, true),
    ('견적서 분석', 'Quote Analysis', '#f59e0b', 3, true),
    ('원자재 소싱전략', 'Raw Material Sourcing', '#eab308', 4, true),
    ('SPL 접수', 'SPL Receipt', '#84cc16', 5, true),
    ('원재 소싱전략', 'Material Sourcing Strategy', '#22c55e', 6, true),
    ('원재 결정', 'Material Decision', '#10b981', 7, true),
    ('E-Service Content', 'E-Service Content', '#14b8a6', 8, true),
    ('E-Service 완성', 'E-Service Completion', '#06b6d4', 9, true),
    ('LINE 그래디', 'LINE Grady', '#0ea5e9', 10, true),
    ('결과 산출', 'Result Output', '#3b82f6', 11, true),
    ('PP', 'PP', '#6366f1', 12, true),
    ('품질 Review', 'Quality Review', '#8b5cf6', 13, true),
    ('최종 개선', 'Final Improvement', '#a855f7', 14, true),
    ('수주', 'Order', '#ec4899', 15, true)
) AS v(name, description, color, order_index, is_active)
WHERE NOT EXISTS (SELECT 1 FROM task_phases);

-- 10. 최종 확인 쿼리
SELECT 
    '=== 수정 완료 결과 ===' as status,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN task_phase IS NOT NULL THEN 1 END) as tasks_with_phase,
    COUNT(CASE WHEN task_phase IS NULL THEN 1 END) as tasks_without_phase
FROM tasks; 