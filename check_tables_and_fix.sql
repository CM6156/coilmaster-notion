-- ==========================================
-- 테이블 구조 확인 후 뷰 재생성
-- ==========================================

-- 1. 관련 테이블들의 정확한 컬럼 구조 확인
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

-- 2. 기존 뷰들 삭제
DROP VIEW IF EXISTS tasks_with_assignees CASCADE;
DROP VIEW IF EXISTS tasks_with_assignee_info CASCADE;

-- 3. department 컬럼 삭제
ALTER TABLE public.tasks DROP COLUMN IF EXISTS department;

-- 4. 안전한 뷰 재생성 (이름만 가져오기)
CREATE OR REPLACE VIEW tasks_with_assignees AS
SELECT 
  t.*,
  COALESCE(u.name, e.name, m.name) as assignee_name
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
LEFT JOIN employees e ON t.assigned_to = e.id
LEFT JOIN managers m ON t.assigned_to = m.id;

-- 5. 확장 뷰 재생성 (이메일 없이)
CREATE OR REPLACE VIEW tasks_with_assignee_info AS
SELECT 
  t.*,
  COALESCE(u.name, e.name, m.name) as assignee_name,
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

-- 6. 검증
SELECT 'department 컬럼 삭제 확인:' as info;
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

-- 7. 최종 테스트
SELECT 'tasks 테이블 레코드 수:' as info, COUNT(*) as count FROM tasks;
SELECT 'tasks_with_assignees 뷰 레코드 수:' as info, COUNT(*) as count FROM tasks_with_assignees;
SELECT 'tasks_with_assignee_info 뷰 레코드 수:' as info, COUNT(*) as count FROM tasks_with_assignee_info;

-- 8. 샘플 데이터 확인
SELECT 'tasks_with_assignees 샘플 데이터:' as info;
SELECT id, title, assigned_to, assignee_name 
FROM tasks_with_assignees 
LIMIT 3;

SELECT '작업 완료!' as status, 'department 컬럼이 제거되고 뷰가 재생성되었습니다.' as message; 