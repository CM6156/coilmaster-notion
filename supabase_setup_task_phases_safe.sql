-- Supabase에서 안전하게 실행할 Task Phases 설정 스크립트
-- 외래키 제약 조건을 고려한 안전한 버전

-- 1. task_phases 테이블 생성 (존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS task_phases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 기존 tasks에서 task_phase 참조를 임시로 NULL로 설정
UPDATE tasks SET task_phase = NULL WHERE task_phase IS NOT NULL;

-- 3. 기존 task_phases 데이터 삭제 (이제 안전함)
DELETE FROM task_phases;

-- 4. 시퀀스 리셋 (ID를 1부터 시작하도록)
ALTER SEQUENCE task_phases_id_seq RESTART WITH 1;

-- 5. 15개 프로모션 단계 데이터 입력
INSERT INTO task_phases (name, description, order_index, color, is_active) VALUES
('영업정보', '영업 정보 수집 및 분석', 1, '#ef4444', true),
('견적서 및 접수', '견적서 작성 및 접수 처리', 2, '#f97316', true),
('견적서 분석', '견적서 내용 분석 및 검토', 3, '#f59e0b', true),
('원자재 소싱전략', '원자재 소싱 전략 수립', 4, '#eab308', true),
('SPL 접수', 'SPL(Supplier Part List) 접수', 5, '#84cc16', true),
('원재 소싱전략', '원재료 소싱 전략 최종 결정', 6, '#22c55e', true),
('원재 결정', '원재료 최종 결정 및 확정', 7, '#10b981', true),
('E-Service Content', 'E-Service 컨텐츠 개발', 8, '#14b8a6', true),
('E-Service 완성', 'E-Service 개발 완료', 9, '#06b6d4', true),
('LINE 그래디', 'LINE 그래디 진행', 10, '#0ea5e9', true),
('결과 산출', '최종 결과 산출 및 보고', 11, '#3b82f6', true),
('PP', 'PP(Production Part) 진행', 12, '#6366f1', true),
('품질 Review', '품질 검토 및 승인', 13, '#8b5cf6', true),
('최종 개선', '최종 개선사항 반영', 14, '#a855f7', true),
('수주', '최종 수주 완료', 15, '#ec4899', true);

-- 6. 기존 tasks를 새로운 task_phases와 매핑
-- PT-01부터 PT-15까지 순서대로 매핑
UPDATE tasks SET task_phase = 1 WHERE title LIKE '%영업정보%' OR title = '영업정보';
UPDATE tasks SET task_phase = 2 WHERE title LIKE '%견적서 및 접수%' OR title = '견적서 및 접수';
UPDATE tasks SET task_phase = 3 WHERE title LIKE '%견적서 분석%' OR title = '견적서 분석';
UPDATE tasks SET task_phase = 4 WHERE title LIKE '%원자재 소싱전략%' OR title = '원자재 소싱전략';
UPDATE tasks SET task_phase = 5 WHERE title LIKE '%SPL 접수%' OR title = 'SPL 접수';
UPDATE tasks SET task_phase = 6 WHERE title LIKE '%원재 소싱전략%' OR title = '원재 소싱전략';
UPDATE tasks SET task_phase = 7 WHERE title LIKE '%원재 결정%' OR title = '원재 결정';
UPDATE tasks SET task_phase = 8 WHERE title LIKE '%E-Service Content%' OR title = 'E-Service Content';
UPDATE tasks SET task_phase = 9 WHERE title LIKE '%E-Service 완성%' OR title = 'E-Service 완성';
UPDATE tasks SET task_phase = 10 WHERE title LIKE '%LINE 그래디%' OR title = 'LINE 그래디';
UPDATE tasks SET task_phase = 11 WHERE title LIKE '%결과 산출%' OR title = '결과 산출';
UPDATE tasks SET task_phase = 12 WHERE title LIKE '%PP%' OR title = 'PP';
UPDATE tasks SET task_phase = 13 WHERE title LIKE '%품질 Review%' OR title = '품질 Review';
UPDATE tasks SET task_phase = 14 WHERE title LIKE '%최종 개선%' OR title = '최종 개선';
UPDATE tasks SET task_phase = 15 WHERE title LIKE '%수주%' OR title = '수주';

-- 7. 결과 확인
SELECT 
    'task_phases 테이블 상태' as 구분,
    COUNT(*) as 개수
FROM task_phases
WHERE is_active = true

UNION ALL

SELECT 
    'task_phase가 할당된 tasks' as 구분,
    COUNT(*) as 개수
FROM tasks
WHERE task_phase IS NOT NULL

UNION ALL

SELECT 
    'task_phase가 NULL인 tasks' as 구분,
    COUNT(*) as 개수
FROM tasks
WHERE task_phase IS NULL;

-- 8. 단계별 task 현황 확인
SELECT 
    tp.order_index,
    tp.name as 단계명,
    COUNT(t.id) as 업무수
FROM task_phases tp
LEFT JOIN tasks t ON tp.id = t.task_phase
WHERE tp.is_active = true
GROUP BY tp.id, tp.order_index, tp.name
ORDER BY tp.order_index; 