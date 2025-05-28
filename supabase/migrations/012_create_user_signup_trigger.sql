-- 새 사용자 회원가입 시 자동으로 public.users 테이블에 추가하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_department_id UUID;
    user_position_id UUID;
BEGIN
    -- raw_user_meta_data에서 이름, 부서, 직책 추출
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
    
    -- 부서 ID 조회 (부서 코드나 이름으로)
    IF NEW.raw_user_meta_data->>'department' IS NOT NULL THEN
        SELECT id INTO user_department_id 
        FROM public.departments 
        WHERE code = NEW.raw_user_meta_data->>'department' 
           OR id::text = NEW.raw_user_meta_data->>'department'
        LIMIT 1;
    END IF;
    
    -- 직책 ID 조회 (직책 코드나 이름으로)
    IF NEW.raw_user_meta_data->>'position' IS NOT NULL THEN
        SELECT id INTO user_position_id 
        FROM public.positions 
        WHERE code = NEW.raw_user_meta_data->>'position' 
           OR id::text = NEW.raw_user_meta_data->>'position'
        LIMIT 1;
    END IF;

    -- public.users 테이블에 새 사용자 추가
    INSERT INTO public.users (
        id,
        name,
        email,
        department_id,
        position_id,
        role,
        is_active,
        login_method,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_name,
        NEW.email,
        user_department_id,
        user_position_id,
        'user', -- 기본 역할
        true,    -- 기본 활성 상태
        'email', -- 기본 로그인 방식
        NOW(),
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- 오류가 발생해도 회원가입을 막지 않음
        RAISE LOG 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 트리거 생성
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 기존 auth.users에 있지만 public.users에 없는 사용자들을 동기화
INSERT INTO public.users (id, name, email, role, is_active, login_method, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
    au.email,
    'user' as role,
    true as is_active,
    'email' as login_method,
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING; 