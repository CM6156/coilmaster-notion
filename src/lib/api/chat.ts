import { supabase } from '@/lib/supabase';

export interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | 'direct';
  description?: string;
  avatar_url?: string;
  is_private: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  participants?: ChatParticipant[];
  last_message?: ChatMessage;
  unread_count: number;
}

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    department_id?: string;
    department?: {
      id: string;
      name: string;
      code: string;
    };
    is_active?: boolean;
  };
  role: 'admin' | 'moderator' | 'member';
  is_pinned: boolean;
  is_muted: boolean;
  joined_at: string;
  last_read_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_id?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface DirectConversation {
  id: string;
  room_id: string;
  user1_id: string;
  user2_id: string;
  user1_blocked: boolean;
  user2_blocked: boolean;
  room?: ChatRoom;
  other_user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    department_id?: string;
    department?: {
      id: string;
      name: string;
      code: string;
    };
    is_active?: boolean;
  };
}

// 사용자가 참여한 채팅방 목록 조회
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data, error } = await supabase
    .from('chat_rooms')
    .select(`
      *,
      participants:chat_participants!inner(
        id,
        user_id,
        role,
        is_pinned,
        is_muted,
        joined_at,
        last_read_at,
        user:users(
          id, 
          name, 
          email, 
          avatar, 
          department_id,
          is_active,
          department:departments(id, name, code)
        )
      )
    `)
    .eq('participants.user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('채팅방 조회 오류:', error);
    throw error;
  }

  // 읽지 않은 메시지 수와 마지막 메시지 조회
  const roomsWithDetails = await Promise.all(
    (data || []).map(async (room) => {
      // 마지막 메시지 조회
      const { data: lastMessage } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users(id, name, avatar)
        `)
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 읽지 않은 메시지 수 조회
      const userParticipant = room.participants.find((p: any) => p.user_id === user.id);
      const lastReadAt = userParticipant?.last_read_at || '1970-01-01';
      
      const { count: unreadCount } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact' })
        .eq('room_id', room.id)
        .gt('created_at', lastReadAt);

      return {
        ...room,
        last_message: lastMessage,
        unread_count: unreadCount || 0
      };
    })
  );

  return roomsWithDetails;
};

// 특정 채팅방의 메시지 조회
export const getChatMessages = async (roomId: string, limit = 50, offset = 0): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      sender:users(id, name, avatar),
      reactions:message_reactions(
        id,
        user_id,
        emoji,
        created_at
      )
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('메시지 조회 오류:', error);
    throw error;
  }

  return (data || []).reverse(); // 시간순으로 정렬
};

// 메시지 전송
export const sendMessage = async (roomId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): Promise<ChatMessage> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      sender_id: user.id,
      content,
      message_type: messageType
    })
    .select(`
      *,
      sender:users(id, name, avatar)
    `)
    .single();

  if (error) {
    console.error('메시지 전송 오류:', error);
    throw error;
  }

  // 채팅방 업데이트 시간 갱신
  await supabase
    .from('chat_rooms')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', roomId);

  return data;
};

// 메시지 읽음 처리
export const markMessagesAsRead = async (roomId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { error } = await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', user.id);

  if (error) {
    console.error('읽음 처리 오류:', error);
    throw error;
  }
};

// 개인 대화 목록 조회
export const getDirectConversations = async (): Promise<DirectConversation[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data, error } = await supabase
    .from('direct_conversations')
    .select(`
      *,
      room:chat_rooms(
        *,
        participants:chat_participants(
          id,
          user_id,
          is_pinned,
          last_read_at,
          user:users(
            id, 
            name, 
            email, 
            avatar, 
            department_id,
            is_active,
            department:departments(id, name, code)
          )
        )
      )
    `)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('개인 대화 조회 오류:', error);
    throw error;
  }

  return (data || []).map(conv => {
    const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    const otherUserParticipant = conv.room?.participants?.find((p: any) => p.user_id === otherUserId);
    
    return {
      ...conv,
      other_user: otherUserParticipant?.user
    };
  });
};

// 개인 대화 시작 또는 찾기
export const startDirectConversation = async (otherUserId: string): Promise<DirectConversation> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  // 기존 대화 확인
  const { data: existing } = await supabase
    .from('direct_conversations')
    .select('*, room:chat_rooms(*)')
    .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
    .single();

  if (existing) {
    return existing;
  }

  // 상대방 정보 조회
  const { data: otherUser } = await supabase
    .from('users')
    .select('name')
    .eq('id', otherUserId)
    .single();

  // 새 채팅방 생성
  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .insert({
      name: `${user.user_metadata?.name || '사용자'} & ${otherUser?.name || '사용자'}`,
      type: 'direct',
      description: '개인 대화',
      is_private: true
    })
    .select()
    .single();

  if (roomError) {
    console.error('채팅방 생성 오류:', roomError);
    throw roomError;
  }

  // 참여자 추가
  const { error: participantError } = await supabase
    .from('chat_participants')
    .insert([
      { room_id: room.id, user_id: user.id, role: 'member' },
      { room_id: room.id, user_id: otherUserId, role: 'member' }
    ]);

  if (participantError) {
    console.error('참여자 추가 오류:', participantError);
    throw participantError;
  }

  // 개인 대화 레코드 생성
  const { data: conversation, error: convError } = await supabase
    .from('direct_conversations')
    .insert({
      room_id: room.id,
      user1_id: user.id,
      user2_id: otherUserId
    })
    .select(`
      *,
      room:chat_rooms(*),
      other_user:users!direct_conversations_user2_id_fkey(
        id, 
        name, 
        email, 
        avatar, 
        department_id,
        is_active,
        department:departments(id, name, code)
      )
    `)
    .single();

  if (convError) {
    console.error('개인 대화 생성 오류:', convError);
    throw convError;
  }

  return conversation;
};

// 메시지 반응 추가/제거
export const toggleMessageReaction = async (messageId: string, emoji: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  // 기존 반응 확인
  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single();

  if (existing) {
    // 반응 제거
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existing.id);

    if (error) {
      console.error('반응 제거 오류:', error);
      throw error;
    }
  } else {
    // 반응 추가
    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji
      });

    if (error) {
      console.error('반응 추가 오류:', error);
      throw error;
    }
  }
};

// 채팅방 참여자 조회
export const getChatParticipants = async (roomId: string): Promise<ChatParticipant[]> => {
  const { data, error } = await supabase
    .from('chat_participants')
    .select(`
      *,
      user:users(
        id, 
        name, 
        email, 
        avatar, 
        department_id,
        is_active,
        department:departments(id, name, code)
      )
    `)
    .eq('room_id', roomId);

  if (error) {
    console.error('참여자 조회 오류:', error);
    throw error;
  }

  return data || [];
};

// 실시간 메시지 구독
export const subscribeToRoomMessages = (roomId: string, callback: (message: ChatMessage) => void) => {
  return supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      },
      async (payload) => {
        // 전송자 정보 포함해서 조회
        const { data } = await supabase
          .from('chat_messages')
          .select(`
            *,
            sender:users(id, name, avatar)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          callback(data);
        }
      }
    )
    .subscribe();
}; 