-- tasks 테이블의 외래 키 제약 조건 수정
-- assigned_to 필드가 managers 테이블을 참조하도록 변경

-- 기존 외래 키 제약 조건 삭제
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- assigned_to 필드를 nullable로 변경 (제약 조건 없이)
ALTER TABLE tasks ALTER COLUMN assigned_to DROP NOT NULL;

-- 선택사항: managers 테이블을 참조하는 새로운 외래 키 제약 조건 추가
-- (managers 테이블에 데이터가 있는 경우에만)
-- ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_fkey 
--     FOREIGN KEY (assigned_to) REFERENCES managers(id) ON DELETE SET NULL;

-- 현재 제약 조건 확인
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='tasks'; 