-- ========================================
-- 업무일지에 잘못 저장된 댓글 데이터 정리 스크립트
-- ========================================

-- 1. 잘못된 데이터 확인 (백업용)
SELECT 
    id,
    content,
    author_name,
    status,
    created_at,
    CASE 
        WHEN LENGTH(TRIM(content)) <= 10 THEN 'too_short'
        WHEN content ~ '^(test|테스트|Test|\d+)$' THEN 'test_data'
        WHEN project_id IS NULL AND task_id IS NULL THEN 'no_relation'
        ELSE 'valid'
    END as data_type
FROM work_journals 
WHERE 
    LENGTH(TRIM(content)) <= 10 
    OR content ~ '^(test|테스트|Test|\d+)$'
    OR (project_id IS NULL AND task_id IS NULL)
ORDER BY created_at DESC;

-- 2. 댓글로 보이는 데이터 삭제 (주의: 실제 실행 전 백업 필요)
-- DELETE FROM work_journals 
-- WHERE 
--     LENGTH(TRIM(content)) <= 10 
--     OR content ~ '^(test|테스트|Test|\d+)$'
--     OR (project_id IS NULL AND task_id IS NULL);

-- 3. 유효한 업무일지만 남기기 위한 조건 확인
SELECT 
    'valid_journals' as type,
    COUNT(*) as count
FROM work_journals 
WHERE 
    LENGTH(TRIM(content)) > 10 
    AND NOT (content ~ '^(test|테스트|Test|\d+)$')
    AND (project_id IS NOT NULL OR task_id IS NOT NULL);

-- 4. 실제 댓글은 task_comments 테이블에서 확인
SELECT 
    'task_comments' as type,
    COUNT(*) as count
FROM task_comments;

-- 실행 가이드:
-- 1. 먼저 첫 번째 쿼리로 삭제될 데이터 확인
-- 2. 필요시 데이터 백업
-- 3. DELETE 쿼리의 주석 해제 후 실행
-- 4. 애플리케이션에서 업무일지 목록 새로고침 