-- ==========================================
-- 안전한 뷰 재생성 스크립트
-- ==========================================

-- 1단계: tasks 테이블의 정확한 컬럼명 확인
SELECT 'tasks 테이블의 모든 컬럼:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2단계: 관련 테이블들의 컬럼명도 확인
SELECT 'users 테이블 컬럼:' as info;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'employees 테이블 컬럼:' as info;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'managers 테이블 컬럼:' as info;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'managers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3단계: 기존 뷰들 삭제
DROP VIEW IF EXISTS tasks_with_assignees CASCADE;
DROP VIEW IF EXISTS tasks_with_assignee_info CASCADE;

-- 4단계: 최소한의 뷰부터 시작 (가장 기본적인 컬럼들만 사용)
-- 먼저 tasks 테이블에서 확실히 존재하는 컬럼들만 사용하여 뷰 생성

-- 기본 뷰 생성 (모든 컬럼을 t.*로 가져오고 담당자 정보만 추가)
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
  t.*,
  COALESCE(u.name, e.name, m.name) as assignee_name,
  COALESCE(u.email, e.email, m.email) as assignee_email
FROM tasks t
LEFT JOIN users u ON t."assignedTo" = u.id  -- 큰따옴표로 camelCase 컬럼명 시도
LEFT JOIN employees e ON t."assignedTo" = e.id
LEFT JOIN managers m ON t."assignedTo" = m.id;

-- 위가 실패하면 snake_case로 다시 시도
-- CREATE OR REPLACE VIEW tasks_with_assignees AS
-- SELECT 
--   t.*,
--   COALESCE(u.name, e.name, m.name) as assignee_name,
--   COALESCE(u.email, e.email, m.email) as assignee_email
-- FROM tasks t
-- LEFT JOIN users u ON t.assigned_to = u.id
-- LEFT JOIN employees e ON t.assigned_to = e.id
-- LEFT JOIN managers m ON t.assigned_to = m.id;

-- 5단계: 확장된 뷰 생성
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
LEFT JOIN users u ON t."assignedTo" = u.id
LEFT JOIN employees e ON t."assignedTo" = e.id
LEFT JOIN managers m ON t."assignedTo" = m.id;

-- 6단계: 검증
SELECT 'tasks_with_assignees 뷰가 생성되었는지 확인:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'tasks_with_assignees'
AND table_schema = 'public';

SELECT 'tasks_with_assignee_info 뷰가 생성되었는지 확인:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'tasks_with_assignee_info'
AND table_schema = 'public';

-- 7단계: 샘플 데이터로 테스트
SELECT 'tasks_with_assignees 샘플 (컬럼명 확인):' as info;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tasks_with_assignees'
AND table_schema = 'public'
ORDER BY ordinal_position; 