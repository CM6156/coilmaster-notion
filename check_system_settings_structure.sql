-- system_settings 테이블 구조 확인

-- 테이블 칼럼 정보 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_name = 'system_settings'
ORDER BY 
  ordinal_position;

-- 테이블 제약 조건 확인
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column
FROM
  information_schema.table_constraints tc
JOIN
  information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN
  information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE
  tc.table_name = 'system_settings';

-- 테이블 데이터 확인
SELECT * FROM system_settings LIMIT 10; 