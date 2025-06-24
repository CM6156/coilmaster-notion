-- PT-01 업무의 프로모션 단계 수정 스크립트
-- =============================================

-- 1. 현재 PT-01 업무 상태 확인
SELECT 
    t.id,
    t.title,
    t.task_phase,
    tp.name as current_phase_name,
    tp.order_index as current_order,
    p.name as project_name
FROM tasks t
LEFT JOIN task_phases tp ON t.task_phase = tp.id
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.title LIKE '%PT-01%'
ORDER BY t.created_at;

-- 2. 사용 가능한 프로모션 단계들 확인
SELECT 
    id,
    name,
    order_index,
    color,
    is_active
FROM task_phases 
ORDER BY order_index;

-- 3. PT-01 업무를 "영업정보" 단계(order_index=1)로 연결
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = '영업정보' 
    LIMIT 1
)
WHERE title LIKE '%PT-01%';

-- 4. 다른 PT-XX 업무들도 올바른 단계와 연결
-- PT-02 → 견적서 및 접수 (order_index=2)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = '견적서 및 접수' 
    LIMIT 1
)
WHERE title LIKE '%PT-02%';

-- PT-03 → 견적서 분석 (order_index=3)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = '견적서 분석' 
    LIMIT 1
)
WHERE title LIKE '%PT-03%';

-- PT-04 → 원자재 소싱전략 (order_index=4)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = '원자재 소싱전략' 
    LIMIT 1
)
WHERE title LIKE '%PT-04%';

-- PT-05 → SPL 접수 (order_index=5)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = 'SPL 접수' 
    LIMIT 1
)
WHERE title LIKE '%PT-05%';

-- PT-06 → 원재 소싱전략 (order_index=6)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = '원재 소싱전략' 
    LIMIT 1
)
WHERE title LIKE '%PT-06%';

-- PT-07 → 원재 결정 (order_index=7)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = '원재 결정' 
    LIMIT 1
)
WHERE title LIKE '%PT-07%';

-- PT-08 → E-Service Content (order_index=8)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = 'E-Service Content' 
    LIMIT 1
)
WHERE title LIKE '%PT-08%';

-- PT-09 → E-Service 완성 (order_index=9)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = 'E-Service 완성' 
    LIMIT 1
)
WHERE title LIKE '%PT-09%';

-- PT-10 → LINE 그래디 (order_index=10)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = 'LINE 그래디' 
    LIMIT 1
)
WHERE title LIKE '%PT-10%';

-- PT-11 → 결과 산출 (order_index=11)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = '결과 산출' 
    LIMIT 1
)
WHERE title LIKE '%PT-11%';

-- PT-12 → PP (order_index=12)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = 'PP' 
    LIMIT 1
)
WHERE title LIKE '%PT-12%';

-- PT-13 → 품질 Review (order_index=13)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = '품질 Review' 
    LIMIT 1
)
WHERE title LIKE '%PT-13%';

-- PT-14 → 최종 개선 (order_index=14)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = '최종 개선' 
    LIMIT 1
)
WHERE title LIKE '%PT-14%';

-- PT-15 → 수주 (order_index=15)
UPDATE tasks 
SET task_phase = (
    SELECT id 
    FROM task_phases 
    WHERE name = '수주' 
    LIMIT 1
)
WHERE title LIKE '%PT-15%';

-- 5. 수정 결과 확인
SELECT 
    t.id,
    t.title,
    tp.name as phase_name,
    tp.order_index,
    tp.color,
    p.name as project_name
FROM tasks t
LEFT JOIN task_phases tp ON t.task_phase = tp.id
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.title LIKE '%PT-%'
ORDER BY tp.order_index, t.title;

-- 6. Parking Transformer 프로젝트의 모든 업무 확인
SELECT 
    t.id,
    t.title,
    tp.name as stage_name,
    tp.order_index as stage_order,
    t.status,
    t.assigned_to,
    p.name as project_name
FROM tasks t
LEFT JOIN task_phases tp ON t.task_phase = tp.id
LEFT JOIN projects p ON t.project_id = p.id
WHERE p.name LIKE '%Parking Transformer%'
ORDER BY tp.order_index;

-- 성공 메시지
SELECT '✅ PT-01 및 관련 업무들의 프로모션 단계 연결이 완료되었습니다!' as result; 