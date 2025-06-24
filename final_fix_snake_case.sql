-- ==========================================
-- 최종 수정: snake_case 컬럼명 사용
-- ==========================================

-- 1. 기존 뷰들 완전 삭제
DROP VIEW IF EXISTS tasks_with_assignees CASCADE;
DROP VIEW IF EXISTS tasks_with_assignee_info CASCADE;

-- 2. department 컬럼 삭제 (뷰가 삭제된 후)
ALTER TABLE public.tasks DROP COLUMN IF EXISTS department;

-- 3. tasks_with_assignees 뷰 재생성 (snake_case 사용)
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
  t.*,
  COALESCE(u.name, e.name, m.name) as assignee_name,
  COALESCE(u.email, e.email, m.email) as assignee_email
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
LEFT JOIN employees e ON t.assigned_to = e.id
LEFT JOIN managers m ON t.assigned_to = m.id;

-- 4. tasks_with_assignee_info 뷰 재생성 (snake_case 사용)
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
LEFT JOIN users u ON t.assigned_to = u.id
LEFT JOIN employees e ON t.assigned_to = e.id
LEFT JOIN managers m ON t.assigned_to = m.id;

-- 5. 검증
SELECT 'department 컬럼이 삭제되었는지 확인:' as info;
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
AND column_name = 'department';

SELECT 'tasks_with_assignees 뷰 생성 확인:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'tasks_with_assignees'
AND table_schema = 'public';

SELECT 'tasks_with_assignee_info 뷰 생성 확인:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'tasks_with_assignee_info'
AND table_schema = 'public';

-- 6. 최종 테스트
SELECT 'tasks 테이블 레코드 수:' as info, COUNT(*) as count FROM tasks;
SELECT 'tasks_with_assignees 뷰 레코드 수:' as info, COUNT(*) as count FROM tasks_with_assignees;
SELECT 'tasks_with_assignee_info 뷰 레코드 수:' as info, COUNT(*) as count FROM tasks_with_assignee_info;

-- 7. 샘플 데이터 확인 (담당자 정보가 올바르게 조인되는지 확인)
SELECT 'tasks_with_assignees 샘플 데이터:' as info;
SELECT id, title, assigned_to, assignee_name, assignee_email 
FROM tasks_with_assignees 
LIMIT 3;

SELECT '작업 완료!' as status, '이제 department 컬럼이 제거되고 뷰가 정상적으로 재생성되었습니다.' as message; 