-- 기존 phases 테이블에 type 컬럼 추가 (프로젝트 단계용)
ALTER TABLE phases ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'project';

-- 업무 단계를 위한 별도 테이블 생성
CREATE TABLE IF NOT EXISTS task_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 업무 단계 기본 데이터 삽입
INSERT INTO task_phases (name, description, color, order_index) VALUES
('시작전', '업무를 아직 시작하지 않은 상태', '#6b7280', 1),
('진행중', '업무가 진행 중인 상태', '#3b82f6', 2),
('검토중', '업무 결과를 검토 중인 상태', '#f59e0b', 3),
('완료', '업무가 완료된 상태', '#10b981', 4),
('보류', '업무가 일시적으로 보류된 상태', '#ef4444', 5);

-- 기존 phases 테이블 데이터 type 업데이트
UPDATE phases SET type = 'project' WHERE type IS NULL OR type = '';

-- 업무 단계 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_task_phases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업무 단계 테이블에 트리거 적용
CREATE TRIGGER task_phases_updated_at_trigger
    BEFORE UPDATE ON task_phases
    FOR EACH ROW
    EXECUTE FUNCTION update_task_phases_updated_at(); 