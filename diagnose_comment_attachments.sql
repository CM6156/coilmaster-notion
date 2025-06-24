-- =============================================
-- 댓글 첨부파일 시스템 진단 스크립트
-- =============================================

-- 1. 필요한 테이블 존재 여부 확인
SELECT 
  '📋 테이블 존재 여부 확인' as step,
  table_name,
  CASE 
    WHEN table_name = 'task_comments' THEN '💬 댓글 테이블'
    WHEN table_name = 'task_comment_attachments' THEN '📎 첨부파일 테이블'
    ELSE table_name
  END as description,
  '✅ 존재함' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('task_comments', 'task_comment_attachments')
ORDER BY table_name;

-- 2. 스토리지 버킷 확인
SELECT 
  '🗂️ 스토리지 버킷 확인' as step,
  id as bucket_name,
  public as is_public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  array_length(allowed_mime_types, 1) as allowed_types_count,
  created_at
FROM storage.buckets 
WHERE id = 'task-files'
UNION ALL
SELECT 
  '❌ 버킷 없음' as step,
  'task-files' as bucket_name,
  null as is_public,
  null as size_limit_mb,
  null as allowed_types_count,
  null as created_at
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'task-files');

-- 3. 스토리지 정책 확인
SELECT 
  '🔐 스토리지 정책 확인' as step,
  policyname as policy_name,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '🔍 조회 허용'
    WHEN cmd = 'INSERT' THEN '📤 업로드 허용'
    WHEN cmd = 'UPDATE' THEN '✏️ 수정 허용'
    WHEN cmd = 'DELETE' THEN '🗑️ 삭제 허용'
    ELSE cmd
  END as description
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%task_files%'
ORDER BY policyname, cmd;

-- 4. 실제 업로드된 댓글 확인
SELECT 
  '💬 최근 댓글 확인' as step,
  tc.id as comment_id,
  tc.author_name,
  tc.content,
  tc.created_at,
  COUNT(tca.id) as attachment_count
FROM task_comments tc
LEFT JOIN task_comment_attachments tca ON tc.id = tca.comment_id
WHERE tc.created_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY tc.id, tc.author_name, tc.content, tc.created_at
ORDER BY tc.created_at DESC;

-- 5. 첨부파일 상세 정보 확인
SELECT 
  '📎 첨부파일 상세 정보' as step,
  tca.id as attachment_id,
  tca.comment_id,
  tca.file_name,
  tca.file_type,
  tca.file_size,
  tca.storage_path,
  CASE 
    WHEN tca.public_url IS NOT NULL AND tca.public_url != '' THEN '✅ URL 있음'
    ELSE '❌ URL 없음'
  END as url_status,
  tca.created_at
FROM task_comment_attachments tca
JOIN task_comments tc ON tca.comment_id = tc.id
WHERE tc.created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY tca.created_at DESC;

-- 6. 스토리지 실제 파일 확인
SELECT 
  '📁 스토리지 파일 확인' as step,
  name as file_path,
  metadata->>'size' as file_size,
  created_at,
  CASE 
    WHEN name LIKE '%comment-attachments%' THEN '✅ 댓글 첨부파일'
    ELSE '❓ 기타 파일'
  END as file_type
FROM storage.objects 
WHERE bucket_id = 'task-files'
  AND created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY created_at DESC;

-- 7. 문제 진단 요약
SELECT 
  '🔍 진단 요약' as step,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'task_comment_attachments') = 0 
    THEN '❌ task_comment_attachments 테이블이 없습니다'
    WHEN (SELECT COUNT(*) FROM storage.buckets WHERE id = 'task-files') = 0 
    THEN '❌ task-files 스토리지 버킷이 없습니다'
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE policyname LIKE '%task_files%') = 0 
    THEN '❌ 스토리지 정책이 설정되지 않았습니다'
    WHEN (SELECT COUNT(*) FROM task_comment_attachments WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') = 0 
    THEN '❌ 최근 첨부파일이 데이터베이스에 저장되지 않았습니다'
    ELSE '✅ 기본 설정은 완료되었습니다. 브라우저 콘솔 로그를 확인해주세요'
  END as diagnosis,
  NOW() as checked_at; 