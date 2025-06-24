-- 1. managers 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    department_id UUID REFERENCES public.departments(id),
    corporation_id UUID REFERENCES public.corporations(id), 
    position_id UUID REFERENCES public.positions(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 기존 user_manager_sync_status 테이블 삭제 (뷰로 교체하기 위해)
DROP TABLE IF EXISTS public.user_manager_sync_status CASCADE;

-- 3. 사용자-담당자 연동 상태 조회 뷰 생성
CREATE VIEW public.user_manager_sync_status AS
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

-- 4. 기존 데이터 동기화 함수 생성
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
    AND u.department_id IS NOT NULL
  LOOP
    -- 같은 이메일의 담당자가 있는지 확인
    IF EXISTS (SELECT 1 FROM public.managers WHERE email = user_record.email) THEN
      -- 담당자 정보 업데이트
      UPDATE public.managers 
      SET 
        name = user_record.name,
        corporation_id = user_record.corporation_id,
        position_id = user_record.position_id,
        department_id = user_record.department_id,
        updated_at = NOW()
      WHERE email = user_record.email;
      sync_count := sync_count + 1;
    ELSE
      -- 영업/관리/개발 부서 사용자만 담당자로 생성
      IF user_record.department_id IN (
        SELECT id FROM public.departments WHERE code IN ('sales', 'management', 'development')
      ) THEN
        INSERT INTO public.managers (
          name,
          email,
          corporation_id,
          position_id,
          department_id,
          created_at,
          updated_at
        ) VALUES (
          user_record.name,
          user_record.email,
          user_record.corporation_id,
          user_record.position_id,
          user_record.department_id,
          NOW(),
          NOW()
        );
        sync_count := sync_count + 1;
      END IF;
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

-- 5. 사용자 정보 변경 시 담당자 정보 자동 동기화 함수
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
        corporation_id = NEW.corporation_id,
        position_id = NEW.position_id,
        department_id = NEW.department_id,
        updated_at = NOW()
      WHERE email = NEW.email;
    ELSE
      -- 담당자가 없으면 새로 생성 (특정 부서인 경우에만)
      IF NEW.department_id IN (
        SELECT id FROM public.departments WHERE code IN ('sales', 'management', 'development')
      ) THEN
        INSERT INTO public.managers (
          name,
          email,
          corporation_id,
          position_id,
          department_id,
          created_at,
          updated_at
        ) VALUES (
          NEW.name,
          NEW.email,
          NEW.corporation_id,
          NEW.position_id,
          NEW.department_id,
          NOW(),
          NOW()
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 담당자 정보 변경 시 사용자 정보 자동 동기화 함수
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
        department_id = NEW.department_id,
        updated_at = NOW()
      WHERE email = NEW.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 기존 트리거 삭제 후 새로 생성
DROP TRIGGER IF EXISTS trigger_sync_user_to_manager ON public.users;
DROP TRIGGER IF EXISTS trigger_sync_manager_to_user ON public.managers;

CREATE TRIGGER trigger_sync_user_to_manager
  AFTER INSERT OR UPDATE OF email, name, corporation_id, position_id, department_id
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_to_manager();

CREATE TRIGGER trigger_sync_manager_to_user
  AFTER INSERT OR UPDATE OF email, name, corporation_id, position_id, department_id
  ON public.managers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_manager_to_user();

-- 8. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_managers_email ON public.managers(email);
CREATE INDEX IF NOT EXISTS idx_managers_department_id ON public.managers(department_id);
CREATE INDEX IF NOT EXISTS idx_managers_corporation_id ON public.managers(corporation_id);
CREATE INDEX IF NOT EXISTS idx_managers_position_id ON public.managers(position_id); 