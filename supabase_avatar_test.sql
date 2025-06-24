-- avatar 데이터 저장 상태 확인
SELECT 
    id,
    name,
    CASE 
        WHEN avatar IS NULL THEN 'NULL'
        WHEN avatar = '' THEN 'EMPTY'
        WHEN avatar LIKE 'data:%' THEN 'BASE64'
        WHEN avatar LIKE 'http%' THEN 'URL'
        ELSE 'OTHER'
    END as avatar_type,
    LENGTH(avatar) as avatar_length,
    LEFT(avatar, 50) as avatar_preview,
    created_at
FROM employees 
ORDER BY created_at DESC 
LIMIT 10;

-- avatar 컬럼의 제약사항 확인
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' AND column_name = 'avatar';

-- 최근 생성된 직원의 avatar 데이터 상세 확인
SELECT 
    name,
    avatar,
    CASE 
        WHEN avatar LIKE 'data:image/jpeg%' THEN 'JPEG BASE64'
        WHEN avatar LIKE 'data:image/png%' THEN 'PNG BASE64'
        WHEN avatar LIKE 'data:image/%' THEN 'OTHER BASE64'
        WHEN avatar LIKE 'http%' THEN 'URL'
        ELSE 'UNKNOWN'
    END as format,
    LENGTH(avatar) as size_bytes
FROM employees 
WHERE avatar IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 3; 