-- ==========================================
-- 컬럼명 확인 및 뷰 재생성 (수정된 버전)
-- ==========================================

-- 1. tasks 테이블의 정확한 컬럼명 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 2. 기존 뷰들 삭제 (이미 삭제되었을 수 있음)
DROP VIEW IF EXISTS tasks_with_assignees CASCADE;
DROP VIEW IF EXISTS tasks_with_assignee_info CASCADE;

-- 3. 올바른 컬럼명으로 뷰 재생성

-- tasks_with_assignees 뷰 재생성 (수정된 컬럼명 사용)
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.assigned_to,  -- assignedTo -> assigned_to
  t.project_id,   -- projectId -> project_id (추정)
  t.start_date,   -- startDate -> start_date (추정)
  t.due_date,     -- dueDate -> due_date (추정)
  t.progress,
  t.parent_task_id, -- parentTaskId -> parent_task_id (추정)
  t.task_phase,     -- taskPhase는 그대로일 수 있음
  t.created_at,     -- createdAt -> created_at (추정)
  t.updated_at,     -- updatedAt -> updated_at (추정)
  COALESCE(u.name, e.name, m.name) as assignee_name,
  COALESCE(u.email, e.email, m.email) as assignee_email
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
LEFT JOIN employees e ON t.assigned_to = e.id  
LEFT JOIN managers m ON t.assigned_to = m.id;

-- tasks_with_assignee_info 뷰 재생성 (수정된 컬럼명 사용)
CREATE OR REPLACE VIEW tasks_with_assignee_info AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.assigned_to,
  t.project_id,
  t.start_date,
  t.due_date,
  t.progress,
  t.parent_task_id,
  t.task_phase,
  t.created_at,
  t.updated_at,
  COALESCE(u.name, e.name, m.name) as assignee_name,
  COALESCE(u.email, e.email, m.email) as assignee_email,
  CASE 
    WHEN u.id IS NOT NULL THEN 'user'
    WHEN e.id IS NOT NULL THEN 'employee'
    WHEN m.id IS NOT NULL THEN 'manager'
    ELSE 'unknown'
  END as assignee_type
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
LEFT JOIN employees e ON t.assigned_to = e.id
LEFT JOIN managers m ON t.assigned_to = m.id;

-- 4. 검증
SELECT 'tasks 테이블 구조:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

SELECT 'tasks_with_assignees 샘플 데이터:' as info;
SELECT * FROM tasks_with_assignees LIMIT 3;

SELECT 'tasks_with_assignee_info 샘플 데이터:' as info;
SELECT * FROM tasks_with_assignee_info LIMIT 3; 