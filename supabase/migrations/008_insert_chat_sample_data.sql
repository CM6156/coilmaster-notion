-- 기본 채팅방 생성 (일반 채팅방)
INSERT INTO chat_rooms (id, name, type, description, is_private)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '일반', 'group', '팀 전체 대화방', false),
    ('22222222-2222-2222-2222-222222222222', '개발팀', 'group', '개발팀 전용 채팅방', false),
    ('33333333-3333-3333-3333-333333333333', '영업팀', 'group', '영업팀 전용 채팅방', false),
    ('44444444-4444-4444-4444-444444444444', '품질관리팀', 'group', '품질관리팀 전용 채팅방', false)
ON CONFLICT (id) DO NOTHING;

-- 샘플 메시지 (일반 채팅방)
INSERT INTO chat_messages (room_id, sender_id, content, message_type)
SELECT 
    '11111111-1111-1111-1111-111111111111',
    u.id,
    CASE 
        WHEN u.name = '관리자' THEN '안녕하세요! 새로운 채팅 시스템이 오픈되었습니다. 많은 이용 바랍니다!'
        WHEN u.role = 'manager' THEN '좋은 기능이네요! 팀 소통에 도움이 될 것 같습니다.'
        ELSE '네, 잘 사용하겠습니다!'
    END,
    'text'
FROM users u
WHERE u.is_active = true
LIMIT 3
ON CONFLICT DO NOTHING;

-- 기본 그룹 채팅방 참여자 추가 (모든 활성 사용자를 일반 채팅방에 추가)
INSERT INTO chat_participants (room_id, user_id, role)
SELECT 
    '11111111-1111-1111-1111-111111111111',
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 'admin'
        WHEN u.role = 'manager' THEN 'moderator'
        ELSE 'member'
    END
FROM users u
WHERE u.is_active = true
ON CONFLICT (room_id, user_id) DO NOTHING;

-- 부서별 채팅방 참여자 추가
-- 개발팀 채팅방
INSERT INTO chat_participants (room_id, user_id, role)
SELECT 
    '22222222-2222-2222-2222-222222222222',
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 'admin'
        WHEN u.role = 'manager' THEN 'moderator'
        ELSE 'member'
    END
FROM users u
WHERE u.is_active = true 
AND (u.department = 'development' OR u.role = 'admin')
ON CONFLICT (room_id, user_id) DO NOTHING;

-- 영업팀 채팅방
INSERT INTO chat_participants (room_id, user_id, role)
SELECT 
    '33333333-3333-3333-3333-333333333333',
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 'admin'
        WHEN u.role = 'manager' THEN 'moderator'
        ELSE 'member'
    END
FROM users u
WHERE u.is_active = true 
AND (u.department = 'sales' OR u.role = 'admin')
ON CONFLICT (room_id, user_id) DO NOTHING;

-- 품질관리팀 채팅방
INSERT INTO chat_participants (room_id, user_id, role)
SELECT 
    '44444444-4444-4444-4444-444444444444',
    u.id,
    CASE 
        WHEN u.role = 'admin' THEN 'admin'
        WHEN u.role = 'manager' THEN 'moderator'
        ELSE 'member'
    END
FROM users u
WHERE u.is_active = true 
AND (u.department = 'quality' OR u.role = 'admin')
ON CONFLICT (room_id, user_id) DO NOTHING; 