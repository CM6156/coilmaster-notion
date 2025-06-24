-- ==========================================
-- Tasks 테이블 department 컬럼 삭제 마이그레이션
-- 단계별 실행 가이드
-- ==========================================

-- ========== 1단계: 현재 뷰 정의 확인 ==========
-- 먼저 기존 뷰들의 정의를 확인하고 백업합니다.
-- 각각을 개별적으로 실행하여 결과를 저장해두세요.

SELECT 'tasks_with_assignees 뷰 정의:' as info;
SELECT pg_get_viewdef('tasks_with_assignees'::regclass, true) as view_definition;

SELECT 'tasks_with_assignee_info 뷰 정의:' as info;
SELECT pg_get_viewdef('tasks_with_assignee_info'::regclass, true) as view_definition;


-- ========== 2단계: 뷰 삭제 ==========
-- 의존성이 있는 뷰들을 먼저 삭제합니다.

DROP VIEW IF EXISTS tasks_with_assignees CASCADE;
DROP VIEW IF EXISTS tasks_with_assignee_info CASCADE;


-- ========== 3단계: 컬럼 삭제 ==========
-- 이제 department 컬럼을 삭제할 수 있습니다.

ALTER TABLE public.tasks DROP COLUMN IF EXISTS department;


-- ========== 4단계: 뷰 재생성 ==========
-- department 컬럼을 제외하고 뷰를 다시 생성합니다.

-- tasks_with_assignees 뷰 재생성
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.assignedTo,
  t.projectId,
  t.startDate,
  t.dueDate,
  t.progress,
  t.parentTaskId,
  t.taskPhase,
  t.createdAt,
  t.updatedAt,
  COALESCE(u.name, e.name, m.name) as assignee_name,
  COALESCE(u.email, e.email, m.email) as assignee_email
FROM tasks t
LEFT JOIN users u ON t.assignedTo = u.id
LEFT JOIN employees e ON t.assignedTo = e.id  
LEFT JOIN managers m ON t.assignedTo = m.id;

-- tasks_with_assignee_info 뷰 재생성
CREATE OR REPLACE VIEW tasks_with_assignee_info AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.assignedTo,
  t.projectId,
  t.startDate,
  t.dueDate,
  t.progress,
  t.parentTaskId,
  t.taskPhase,
  t.createdAt,
  t.updatedAt,
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


-- ========== 5단계: 검증 ==========
-- 마이그레이션이 성공했는지 확인합니다.

-- tasks 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 뷰가 정상적으로 생성되었는지 확인
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('tasks_with_assignees', 'tasks_with_assignee_info');

-- 뷰 데이터 확인 (샘플)
SELECT COUNT(*) as total_tasks FROM tasks;
SELECT COUNT(*) as tasks_with_assignees_count FROM tasks_with_assignees;
SELECT COUNT(*) as tasks_with_assignee_info_count FROM tasks_with_assignee_info; 