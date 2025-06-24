-- 빠른 해결책: 기존 데이터를 건드리지 않고 task_phases 설정

-- 1. task_phases 테이블이 없다면 생성
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

-- 2. 기존에 데이터가 있는지 확인하고, 없다면 추가
INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT '영업정보', '영업 정보 수집 및 분석', 1, '#ef4444', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = '영업정보');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT '견적서 및 접수', '견적서 작성 및 접수 처리', 2, '#f97316', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = '견적서 및 접수');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT '견적서 분석', '견적서 내용 분석 및 검토', 3, '#f59e0b', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = '견적서 분석');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT '원자재 소싱전략', '원자재 소싱 전략 수립', 4, '#eab308', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = '원자재 소싱전략');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT 'SPL 접수', 'SPL(Supplier Part List) 접수', 5, '#84cc16', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = 'SPL 접수');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT '원재 소싱전략', '원재료 소싱 전략 최종 결정', 6, '#22c55e', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = '원재 소싱전략');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT '원재 결정', '원재료 최종 결정 및 확정', 7, '#10b981', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = '원재 결정');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT 'E-Service Content', 'E-Service 컨텐츠 개발', 8, '#14b8a6', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = 'E-Service Content');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT 'E-Service 완성', 'E-Service 개발 완료', 9, '#06b6d4', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = 'E-Service 완성');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT 'LINE 그래디', 'LINE 그래디 진행', 10, '#0ea5e9', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = 'LINE 그래디');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT '결과 산출', '최종 결과 산출 및 보고', 11, '#3b82f6', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = '결과 산출');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT 'PP', 'PP(Production Part) 진행', 12, '#6366f1', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = 'PP');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT '품질 Review', '품질 검토 및 승인', 13, '#8b5cf6', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = '품질 Review');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT '최종 개선', '최종 개선사항 반영', 14, '#a855f7', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = '최종 개선');

INSERT INTO task_phases (name, description, order_index, color, is_active)
SELECT '수주', '최종 수주 완료', 15, '#ec4899', true
WHERE NOT EXISTS (SELECT 1 FROM task_phases WHERE name = '수주');

-- 3. 결과 확인
SELECT 
    id,
    name,
    order_index,
    color,
    is_active
FROM task_phases 
ORDER BY order_index; 