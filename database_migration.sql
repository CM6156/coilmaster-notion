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

-- Tasks 테이블 department 컬럼 삭제를 위한 마이그레이션
-- 의존성 있는 뷰들을 먼저 처리해야 함

-- 1. 기존 뷰들 백업 (뷰 정의 확인)
-- tasks_with_assignees 뷰 정의 확인
SELECT pg_get_viewdef('tasks_with_assignees'::regclass, true);

-- tasks_with_assignee_info 뷰 정의 확인  
SELECT pg_get_viewdef('tasks_with_assignee_info'::regclass, true);

-- 2. 의존하는 뷰들 삭제
DROP VIEW IF EXISTS tasks_with_assignees CASCADE;
DROP VIEW IF EXISTS tasks_with_assignee_info CASCADE;

-- 3. tasks 테이블에서 department 컬럼 삭제
ALTER TABLE public.tasks DROP COLUMN IF EXISTS department;

-- 4. 필요한 경우 뷰를 department 컬럼 없이 다시 생성
-- (department 컬럼을 제외한 형태로 뷰 재생성)

-- tasks_with_assignees 뷰 재생성 (department 컬럼 제외)
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
  t.*,
  COALESCE(u.name, e.name, m.name) as assignee_name,
  COALESCE(u.email, e.email, m.email) as assignee_email
FROM tasks t
LEFT JOIN users u ON t.assignedTo = u.id
LEFT JOIN employees e ON t.assignedTo = e.id  
LEFT JOIN managers m ON t.assignedTo = m.id;

-- tasks_with_assignee_info 뷰 재생성 (department 컬럼 제외)
CREATE OR REPLACE VIEW tasks_with_assignee_info AS
SELECT 
  t.*,
  COALESCE(u.name, e.name, m.name) as assignee_name,
  COALESCE(u.email, e.email, m.email) as assignee_email,
  CASE 
    WHEN u.id IS NOT NULL THEN 'user'
    WHEN e.id IS NOT NULL THEN 'employee'
    WHEN m.id IS NOT NULL THEN 'manager'
    ELSE 'unknown'
  END as assignee_type
FROM tasks t
LEFT JOIN users u ON t.assignedTo = u.id
LEFT JOIN employees e ON t.assignedTo = e.id
LEFT JOIN managers m ON t.assignedTo = m.id; 