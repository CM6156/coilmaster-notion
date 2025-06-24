-- employees 테이블에 avatar 컬럼 추가
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar TEXT;

-- 기존 데이터에 대한 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_employees_avatar ON employees(avatar);

-- 확인용 쿼리
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND table_schema = 'public'
ORDER BY ordinal_position; 