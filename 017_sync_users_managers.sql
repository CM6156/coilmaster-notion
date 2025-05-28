-- 사용자 관리와 담당자 관리 이메일 기준 연동 시스템
-- 파일명: 017_sync_users_managers.sql

-- 1단계: 사용자-담당자 연동 함수 생성
CREATE OR REPLACE FUNCTION public.sync_user_to_manager()
RETURNS TRIGGER AS $$
BEGIN
  -- 사용자가 새로 생성되거나 이메일이 변경될 때
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.email != NEW.email) THEN
    -- 같은 이메일을 가진 담당자가 있는지 확인
    IF EXISTS (SELECT 1 FROM public.managers WHERE email = NEW.email) THEN
      -- 이미 존재하는 담당자가 있으면 사용자 정보로 업데이트
      UPDATE public.managers 
      SET 
        name = NEW.name,
        updated_at = NOW()
      WHERE email = NEW.email;
      
      RAISE NOTICE '기존 담당자 정보가 사용자 정보로 업데이트되었습니다: %', NEW.email;
    ELSE
      -- 담당자가 없으면 새로 생성 (영업 부서인 경우에만)
      IF NEW.department_id IN (
        SELECT id FROM public.departments WHERE code IN ('sales', 'management', 'development')
      ) THEN
        INSERT INTO public.managers (
          name,
          email,
          corporation_id,
          position_id,
          created_at,
          updated_at
        ) VALUES (
          NEW.name,
          NEW.email,
          NEW.corporation_id,
          NEW.position_id,
          NOW(),
          NOW()
        );
        
        RAISE NOTICE '새 담당자가 생성되었습니다: %', NEW.email;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2단계: 담당자-사용자 연동 함수 생성
CREATE OR REPLACE FUNCTION public.sync_manager_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 담당자가 새로 생성되거나 이메일이 변경될 때
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.email != NEW.email) THEN
    -- 같은 이메일을 가진 사용자가 있는지 확인
    IF EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
      -- 이미 존재하는 사용자가 있으면 담당자 정보로 업데이트
      UPDATE public.users 
      SET 
        name = NEW.name,
        corporation_id = NEW.corporation_id,
        position_id = NEW.position_id,
        updated_at = NOW()
      WHERE email = NEW.email;
      
      RAISE NOTICE '기존 사용자 정보가 담당자 정보로 업데이트되었습니다: %', NEW.email;
    ELSE
      -- 사용자가 없으면 새로 생성하지 않음 (보안상 이유)
      RAISE NOTICE '담당자 %에 대응하는 사용자가 없습니다. 수동으로 사용자를 생성해주세요.', NEW.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3단계: 기존 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS trigger_sync_user_to_manager ON public.users;
DROP TRIGGER IF EXISTS trigger_sync_manager_to_user ON public.managers;

-- 4단계: 트리거 생성
CREATE TRIGGER trigger_sync_user_to_manager
  AFTER INSERT OR UPDATE OF email, name, corporation_id, position_id
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_to_manager();

CREATE TRIGGER trigger_sync_manager_to_user
  AFTER INSERT OR UPDATE OF email, name, corporation_id, position_id
  ON public.managers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_manager_to_user();

-- 5단계: 기존 데이터 동기화 함수
CREATE OR REPLACE FUNCTION public.sync_existing_users_managers()
RETURNS TEXT AS $$
DECLARE
  sync_count INTEGER := 0;
  user_record RECORD;
  manager_record RECORD;
BEGIN
  -- 사용자 -> 담당자 동기화
  FOR user_record IN 
    SELECT u.* FROM public.users u
    WHERE u.email IS NOT NULL 
    AND u.department_id IN (
      SELECT id FROM public.departments WHERE code IN ('sales', 'management', 'development')
    )
  LOOP
    -- 같은 이메일의 담당자가 있는지 확인
    IF EXISTS (SELECT 1 FROM public.managers WHERE email = user_record.email) THEN
      -- 담당자 정보 업데이트
      UPDATE public.managers 
      SET 
        name = user_record.name,
        corporation_id = user_record.corporation_id,
        position_id = user_record.position_id,
        updated_at = NOW()
      WHERE email = user_record.email;
      sync_count := sync_count + 1;
    ELSE
      -- 새 담당자 생성
      INSERT INTO public.managers (
        name,
        email,
        corporation_id,
        position_id,
        created_at,
        updated_at
      ) VALUES (
        user_record.name,
        user_record.email,
        user_record.corporation_id,
        user_record.position_id,
        NOW(),
        NOW()
      );
      sync_count := sync_count + 1;
    END IF;
  END LOOP;
  
  -- 담당자 -> 사용자 동기화 (이름만 업데이트)
  FOR manager_record IN 
    SELECT m.* FROM public.managers m
    WHERE m.email IS NOT NULL
  LOOP
    -- 같은 이메일의 사용자가 있으면 이름 동기화
    IF EXISTS (SELECT 1 FROM public.users WHERE email = manager_record.email) THEN
      UPDATE public.users 
      SET 
        name = manager_record.name,
        updated_at = NOW()
      WHERE email = manager_record.email;
    END IF;
  END LOOP;
  
  RETURN format('동기화 완료: %s개의 레코드가 처리되었습니다.', sync_count);
END;
$$ LANGUAGE plpgsql;

-- 6단계: 사용자-담당자 연동 상태 조회 뷰 생성
CREATE OR REPLACE VIEW public.user_manager_sync_status AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  u.department_id as user_department_id,
  d.name as user_department_name,
  m.id as manager_id,
  m.name as manager_name,
  m.email as manager_email,
  CASE 
    WHEN u.email IS NOT NULL AND m.email IS NOT NULL THEN '연동됨'
    WHEN u.email IS NOT NULL AND m.email IS NULL THEN '담당자 없음'
    WHEN u.email IS NULL AND m.email IS NOT NULL THEN '사용자 없음'
    ELSE '연동 불가'
  END as sync_status,
  CASE 
    WHEN u.name = m.name THEN '일치'
    WHEN u.name IS NOT NULL AND m.name IS NOT NULL THEN '불일치'
    ELSE '확인 불가'
  END as name_match_status
FROM public.users u
FULL OUTER JOIN public.managers m ON u.email = m.email
LEFT JOIN public.departments d ON u.department_id = d.id
WHERE u.email IS NOT NULL OR m.email IS NOT NULL
ORDER BY u.email, m.email;

-- 7단계: 중복 이메일 확인 함수
CREATE OR REPLACE FUNCTION public.check_duplicate_emails()
RETURNS TABLE(
  email TEXT,
  user_count BIGINT,
  manager_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(u.email, m.email) as email,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT m.id) as manager_count,
    COUNT(DISTINCT u.id) + COUNT(DISTINCT m.id) as total_count
  FROM public.users u
  FULL OUTER JOIN public.managers m ON u.email = m.email
  WHERE COALESCE(u.email, m.email) IS NOT NULL
  GROUP BY COALESCE(u.email, m.email)
  HAVING COUNT(DISTINCT u.id) + COUNT(DISTINCT m.id) > 1
  ORDER BY total_count DESC, email;
END;
$$ LANGUAGE plpgsql;

-- 8단계: 프로젝트/업무 담당자 정보 개선을 위한 뷰 업데이트
CREATE OR REPLACE VIEW public.projects_with_manager_info AS
SELECT 
  p.*,
  COALESCE(u.name, m.name, p.pic_name) as manager_display_name,
  COALESCE(u.email, m.email) as manager_email,
  COALESCE(d.name, '부서 없음') as manager_department,
  CASE 
    WHEN u.id IS NOT NULL THEN '사용자 연동'
    WHEN m.id IS NOT NULL THEN '담당자만'
    ELSE '연동 없음'
  END as manager_sync_status
FROM public.projects p
LEFT JOIN public.managers m ON p.pic_name = m.name OR p.pic_name = m.email OR p.manager_id = m.id
LEFT JOIN public.users u ON m.email = u.email
LEFT JOIN public.departments d ON u.department_id = d.id;

-- 9단계: 업무 담당자 정보 개선을 위한 뷰 업데이트
CREATE OR REPLACE VIEW public.tasks_with_assignee_info AS
SELECT 
  t.*,
  COALESCE(u.name, m.name, up.name, t.assigned_to::text) as assignee_display_name,
  COALESCE(u.email, m.email, up.email) as assignee_email,
  COALESCE(d.name, '부서 없음') as assignee_department,
  CASE 
    WHEN u.id IS NOT NULL THEN '사용자 연동'
    WHEN m.id IS NOT NULL THEN '담당자만'
    WHEN up.id IS NOT NULL THEN 'user_profiles 연동'
    ELSE '연동 없음'
  END as assignee_sync_status
FROM public.tasks t
LEFT JOIN public.user_profiles up ON t.assigned_to = up.id
LEFT JOIN public.managers m ON up.email = m.email
LEFT JOIN public.users u ON up.email = u.email OR m.email = u.email
LEFT JOIN public.departments d ON u.department_id = d.id;

-- 10단계: 코멘트 추가
COMMENT ON FUNCTION public.sync_user_to_manager() IS '사용자 정보 변경 시 담당자 정보 자동 동기화';
COMMENT ON FUNCTION public.sync_manager_to_user() IS '담당자 정보 변경 시 사용자 정보 자동 동기화';
COMMENT ON FUNCTION public.sync_existing_users_managers() IS '기존 사용자와 담당자 데이터 일괄 동기화';
COMMENT ON VIEW public.user_manager_sync_status IS '사용자-담당자 연동 상태 조회';
COMMENT ON FUNCTION public.check_duplicate_emails() IS '중복 이메일 확인';
COMMENT ON VIEW public.projects_with_manager_info IS '프로젝트 담당자 정보 통합 뷰';
COMMENT ON VIEW public.tasks_with_assignee_info IS '업무 담당자 정보 통합 뷰';

-- 실행 예시:
-- 기존 데이터 동기화: SELECT public.sync_existing_users_managers();
-- 연동 상태 확인: SELECT * FROM public.user_manager_sync_status;
-- 중복 이메일 확인: SELECT * FROM public.check_duplicate_emails(); 