// 개발 환경에서 LINE API 시뮬레이션

export const lineApiSimulator = {
  async getInfo() {
    // 연결 테스트 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      displayName: 'CoilMaster LINE Bot (개발모드)',
      userId: 'U' + Math.random().toString(36).substr(2, 15),
      language: 'ko',
      pictureUrl: 'https://via.placeholder.com/150'
    };
  },

  async sendMessage(messageData: any) {
    // 메시지 발송 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('LINE 메시지 발송 시뮬레이션:', messageData);
    return {
      status: 'success',
      message: '개발 환경에서 시뮬레이션됨',
      sentCount: 1
    };
  },

  async getProfile(userId: string) {
    // 프로필 조회 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
      userId: userId,
      displayName: `사용자${Math.floor(Math.random() * 100)}`,
      pictureUrl: `https://ui-avatars.com/api/?name=User&background=random`,
      language: 'ko'
    };
  }
};

// 텔레그램 API 시뮬레이션
export const telegramApiSimulator = {
  async getMe(botToken: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      ok: true,
      result: {
        id: 123456789,
        is_bot: true,
        first_name: 'CoilMaster Bot',
        username: 'coilmaster_dev_bot',
        can_join_groups: true,
        can_read_all_group_messages: true,
        supports_inline_queries: false
      }
    };
  },

  async sendMessage(botToken: string, chatId: string, text: string) {
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('텔레그램 메시지 발송 시뮬레이션:', { chatId, text });
    return {
      ok: true,
      result: {
        message_id: Math.floor(Math.random() * 1000000),
        date: Math.floor(Date.now() / 1000),
        text: text,
        chat: {
          id: chatId,
          type: 'group',
          title: '테스트 그룹'
        }
      }
    };
  }
}; 