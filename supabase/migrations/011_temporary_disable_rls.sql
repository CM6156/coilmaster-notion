-- 임시적으로 채팅 관련 테이블의 RLS 비활성화 (개발/테스트 용도)
-- 프로덕션 환경에서는 사용하지 마세요!

-- 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view chat rooms they participate in" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON chat_rooms;

DROP POLICY IF EXISTS "Users can view participants in their rooms" ON chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON chat_participants;

DROP POLICY IF EXISTS "Users can view messages in their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

DROP POLICY IF EXISTS "Users can view reactions in their rooms" ON message_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON message_reactions;

DROP POLICY IF EXISTS "Users can view their own conversations" ON direct_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON direct_conversations;
DROP POLICY IF EXISTS "Users can update their own conversation settings" ON direct_conversations;

-- RLS 비활성화
ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE direct_conversations DISABLE ROW LEVEL SECURITY; 