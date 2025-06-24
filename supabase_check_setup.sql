-- 1. employees 테이블에 avatar 컬럼이 있는지 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name = 'avatar';

-- 2. profile-images 버킷이 있는지 확인
SELECT * FROM storage.buckets WHERE id = 'profile-images';

-- 3. 현재 직원 데이터 확인
SELECT id, name, avatar FROM employees LIMIT 5; 