-- =============================================
-- task_phases 테이블 완전 설정 및 기존 데이터 수정
-- =============================================

-- 1. 기존 task_phases 테이블 확인 및 정리
DO $$ 
BEGIN
    -- 테이블이 존재하지 않으면 생성
    CREATE TABLE IF NOT EXISTS task_phases (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7),
        order_index INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- order_index에 UNIQUE 제약 조건 추가 (존재하지 않으면)
    BEGIN
        ALTER TABLE task_phases ADD CONSTRAINT uk_task_phases_order_index UNIQUE (order_index);
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 2. 기존 데이터 삭제 (중복 방지)
DELETE FROM task_phases;

-- 3. 15개 프로모션 단계 삽입
INSERT INTO task_phases (name, description, color, order_index, is_active) VALUES
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
('수주', 'Order', '#ec4899', 15, true);

-- 4. task_phases 삽입 확인
SELECT 
    'task_phases 삽입 완료' as status,
    COUNT(*) as total_phases
FROM task_phases;

-- 5. 기존 업무들의 task_phase 업데이트
-- PT-XX 패턴으로 업무 단계 매핑
UPDATE tasks 
SET task_phase = (
    SELECT tp.id 
    FROM task_phases tp 
    WHERE tp.order_index = CASE 
        -- PT-XX 패턴 매핑
        WHEN tasks.title ~ 'PT-01' THEN 1
        WHEN tasks.title ~ 'PT-02' THEN 2
        WHEN tasks.title ~ 'PT-03' THEN 3
        WHEN tasks.title ~ 'PT-04' THEN 4
        WHEN tasks.title ~ 'PT-05' THEN 5
        WHEN tasks.title ~ 'PT-06' THEN 6
        WHEN tasks.title ~ 'PT-07' THEN 7
        WHEN tasks.title ~ 'PT-08' THEN 8
        WHEN tasks.title ~ 'PT-09' THEN 9
        WHEN tasks.title ~ 'PT-10' THEN 10
        WHEN tasks.title ~ 'PT-11' THEN 11
        WHEN tasks.title ~ 'PT-12' THEN 12
        WHEN tasks.title ~ 'PT-13' THEN 13
        WHEN tasks.title ~ 'PT-14' THEN 14
        WHEN tasks.title ~ 'PT-15' THEN 15
        -- 한국어 이름으로 매핑
        WHEN tasks.title ILIKE '%영업정보%' THEN 1
        WHEN tasks.title ILIKE '%견적서 및 접수%' THEN 2
        WHEN tasks.title ILIKE '%견적서 분석%' THEN 3
        WHEN tasks.title ILIKE '%원자재 소싱전략%' THEN 4
        WHEN tasks.title ILIKE '%SPL 접수%' THEN 5
        WHEN tasks.title ILIKE '%원재 소싱전략%' THEN 6
        WHEN tasks.title ILIKE '%원재 결정%' THEN 7
        WHEN tasks.title ILIKE '%E-Service Content%' THEN 8
        WHEN tasks.title ILIKE '%E-Service 완성%' THEN 9
        WHEN tasks.title ILIKE '%LINE 그래디%' THEN 10
        WHEN tasks.title ILIKE '%결과 산출%' THEN 11
        WHEN tasks.title ILIKE '%PP%' THEN 12
        WHEN tasks.title ILIKE '%품질 Review%' THEN 13
        WHEN tasks.title ILIKE '%최종 개선%' THEN 14
        WHEN tasks.title ILIKE '%수주%' THEN 15
        ELSE 1  -- 기본값
    END
    LIMIT 1
);

-- 6. 여전히 task_phase가 NULL인 업무들을 첫 번째 단계로 설정
UPDATE tasks 
SET task_phase = (SELECT id FROM task_phases WHERE order_index = 1 LIMIT 1)
WHERE task_phase IS NULL;

-- 7. 수정 결과 확인
SELECT 
    'tasks 업데이트 완료' as status,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN task_phase IS NOT NULL THEN 1 END) as tasks_with_phase,
    COUNT(CASE WHEN task_phase IS NULL THEN 1 END) as tasks_without_phase
FROM tasks;

-- 8. 업무별 단계 매핑 결과 확인
SELECT 
    t.title,
    tp.name as phase_name,
    tp.order_index,
    t.status,
    p.name as project_name
FROM tasks t
LEFT JOIN task_phases tp ON t.task_phase = tp.id
LEFT JOIN projects p ON t.project_id = p.id
ORDER BY tp.order_index, t.title;

-- 9. 단계별 업무 통계
SELECT 
    tp.order_index,
    tp.name as phase_name,
    COUNT(t.id) as task_count
FROM task_phases tp
LEFT JOIN tasks t ON tp.id = t.task_phase
GROUP BY tp.id, tp.order_index, tp.name
ORDER BY tp.order_index;

-- 10. 완료 메시지
SELECT '✅ task_phases 설정 및 기존 업무 매핑 완료!' as result; 