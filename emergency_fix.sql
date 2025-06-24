-- ==========================================
-- 응급 수정: 가장 간단한 방법
-- ==========================================

-- 1. 먼저 tasks 테이블 구조 확인 (필수!)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 기존 뷰들 완전 삭제
DROP VIEW IF EXISTS tasks_with_assignees CASCADE;
DROP VIEW IF EXISTS tasks_with_assignee_info CASCADE;

-- 3. department 컬럼 삭제 (뷰가 삭제된 후)
ALTER TABLE public.tasks DROP COLUMN IF EXISTS department;

-- 4. 가장 간단한 뷰 재생성 (실제 컬럼명에 맞춰 수정 필요)
-- 방법 A: camelCase인 경우
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
  t.*,
  u.name as assignee_name,
  u.email as assignee_email
FROM tasks t
LEFT JOIN users u ON t."assignedTo" = u.id;

-- 방법 A가 실패하면 방법 B 시도: snake_case인 경우  
-- CREATE OR REPLACE VIEW tasks_with_assignees AS
-- SELECT 
--   t.*,
--   u.name as assignee_name,
--   u.email as assignee_email
-- FROM tasks t
-- LEFT JOIN users u ON t.assigned_to = u.id;

-- 5. 확장 뷰도 동일하게 생성
CREATE OR REPLACE VIEW tasks_with_assignee_info AS
SELECT 
  t.*,
  u.name as assignee_name,
  u.email as assignee_email,
  'user' as assignee_type
FROM tasks t
LEFT JOIN users u ON t."assignedTo" = u.id;

-- 6. 검증
SELECT COUNT(*) as tasks_count FROM tasks;
SELECT COUNT(*) as view_count FROM tasks_with_assignees;

-- 만약 위의 스크립트가 여전히 실패한다면, 
-- 1단계의 결과를 보고 정확한 컬럼명을 확인한 후 
-- 아래 템플릿을 사용하여 수동으로 뷰를 생성하세요:

/*
템플릿:
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
  t.*,
  u.name as assignee_name,
  u.email as assignee_email
FROM tasks t
LEFT JOIN users u ON t.[실제_담당자_컬럼명] = u.id;
*/ 