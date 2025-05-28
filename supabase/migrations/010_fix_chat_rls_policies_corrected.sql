-- chat_participants 테이블의 순환 참조 문제 해결 (구문 오류 수정)

-- 기존 문제가 있는 정책들 삭제
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON chat_participants;
DROP POLICY IF EXISTS "Users can view chat rooms they participate in" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can view reactions in their rooms" ON message_reactions;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;

-- 새로운 안전한 RLS 정책 생성

-- 채팅방 RLS 정책 (순환 참조 제거)
CREATE POLICY "Users can view chat rooms they participate in" ON chat_rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE chat_participants.room_id = chat_rooms.id 
            AND chat_participants.user_id = auth.uid()
        )
    );

-- 참여자 RLS 정책 (직접적인 권한 확인으로 변경)
CREATE POLICY "Users can view participants in their rooms" ON chat_participants
    FOR SELECT USING (
        -- 자신의 참여 레코드는 항상 볼 수 있음
        user_id = auth.uid() OR
        -- 같은 방에 참여한 사용자들의 레코드를 볼 수 있음
        EXISTS (
            SELECT 1 FROM chat_participants AS my_participation
            WHERE my_participation.room_id = chat_participants.room_id
            AND my_participation.user_id = auth.uid()
        )
    );

-- 메시지 RLS 정책 (직접적인 권한 확인)
CREATE POLICY "Users can view messages in their rooms" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE chat_participants.room_id = chat_messages.room_id 
            AND chat_participants.user_id = auth.uid()
        )
    );

-- 반응 RLS 정책 (직접적인 권한 확인)
CREATE POLICY "Users can view reactions in their rooms" ON message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_messages cm
            INNER JOIN chat_participants cp ON cm.room_id = cp.room_id
            WHERE cm.id = message_reactions.message_id
            AND cp.user_id = auth.uid()
        )
    );

-- 메시지 전송 정책 (CREATE OR REPLACE 대신 DROP 후 CREATE)
CREATE POLICY "Users can send messages to their rooms" ON chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE chat_participants.room_id = chat_messages.room_id 
            AND chat_participants.user_id = auth.uid()
        )
    );

-- 반응 추가 정책 (CREATE OR REPLACE 대신 DROP 후 CREATE)
CREATE POLICY "Users can add reactions" ON message_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM chat_messages cm
            INNER JOIN chat_participants cp ON cm.room_id = cp.room_id
            WHERE cm.id = message_reactions.message_id
            AND cp.user_id = auth.uid()
        )
    ); 