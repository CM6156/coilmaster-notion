const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8082;

// 미들웨어 설정
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:5173', 'http://localhost:3000', 'https://your-frontend-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Preflight 요청 처리
app.options('*', cors());

// LINE API 설정
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

if (!LINE_ACCESS_TOKEN) {
  console.error('❌ LINE_ACCESS_TOKEN이 설정되지 않았습니다.');
}

if (!LINE_CHANNEL_SECRET) {
  console.error('❌ LINE_CHANNEL_SECRET이 설정되지 않았습니다.');
}

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'LINE API 프록시 서버가 실행 중입니다!',
    status: 'running',
    endpoints: [
      'POST /api/line/send - LINE 메시지 발송',
      'POST /api/line/webhook - LINE Webhook 처리',
      'GET /api/line/profile/:userId - 사용자 프로필 조회',
      'GET /api/line/info - Bot 정보 조회'
    ]
  });
});

// LINE Bot 정보 조회 API
app.get('/api/line/info', async (req, res) => {
  try {
    console.log('🤖 LINE Bot 정보 조회 요청');

    if (!LINE_ACCESS_TOKEN) {
      return res.status(500).json({ 
        error: 'LINE_ACCESS_TOKEN이 설정되지 않았습니다.' 
      });
    }

    const response = await fetch('https://api.line.me/v2/bot/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ LINE Bot 정보 조회 오류:', result);
      return res.status(response.status).json(result);
    }

    console.log('✅ LINE Bot 정보 조회 성공:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ LINE Bot 정보 조회 오류:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'LINE Bot 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

// LINE 메시지 발송 API
app.post('/api/line/send', async (req, res) => {
  try {
    console.log('📤 LINE 메시지 발송 요청:', req.body);

    if (!LINE_ACCESS_TOKEN) {
      return res.status(500).json({ 
        error: 'LINE_ACCESS_TOKEN이 설정되지 않았습니다.' 
      });
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ LINE API 오류:', result);
      return res.status(response.status).json(result);
    }

    console.log('✅ LINE 메시지 발송 성공:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ LINE 메시지 발송 오류:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'LINE 메시지 발송 중 오류가 발생했습니다.'
    });
  }
});

// LINE 사용자 프로필 조회 API
app.get('/api/line/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('👤 LINE 사용자 프로필 조회:', userId);

    if (!LINE_ACCESS_TOKEN) {
      return res.status(500).json({ 
        error: 'LINE_ACCESS_TOKEN이 설정되지 않았습니다.' 
      });
    }

    const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ LINE 프로필 조회 오류:', result);
      return res.status(response.status).json(result);
    }

    console.log('✅ LINE 프로필 조회 성공:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ LINE 프로필 조회 오류:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'LINE 프로필 조회 중 오류가 발생했습니다.'
    });
  }
});

// 수집된 데이터를 저장할 메모리 저장소 (실제 환경에서는 데이터베이스 사용)
const collectedUsers = [];
const collectedGroups = [];

// 수집된 데이터 조회 API
app.get('/api/line/collected-users', (req, res) => {
  res.json({ users: collectedUsers });
});

app.get('/api/line/collected-groups', (req, res) => {
  res.json({ groups: collectedGroups });
});

// 수집된 데이터 초기화 API
app.delete('/api/line/collected-users', (req, res) => {
  collectedUsers.length = 0;
  res.json({ message: '수집된 사용자 목록이 초기화되었습니다.' });
});

app.delete('/api/line/collected-groups', (req, res) => {
  collectedGroups.length = 0;
  res.json({ message: '수집된 그룹 목록이 초기화되었습니다.' });
});

// LINE Webhook 처리 API
app.post('/api/line/webhook', async (req, res) => {
  try {
    console.log('🎯 LINE Webhook 수신:', JSON.stringify(req.body, null, 2));
    console.log('📋 Headers:', req.headers);

    // Webhook 검증 (필요시)
    const signature = req.headers['x-line-signature'];
    if (!signature) {
      console.warn('⚠️ LINE Webhook 서명이 없습니다.');
    }

    // 이벤트 처리
    const events = req.body.events || [];
    
    for (const event of events) {
      console.log(`📨 이벤트:`, {
        type: event.type,
        sourceType: event.source?.type,
        userId: event.source?.userId,
        groupId: event.source?.groupId,
        message: event.message?.text,
        timestamp: new Date(event.timestamp).toLocaleString('ko-KR')
      });

      // 메시지 이벤트 처리
      if (event.type === 'message' && event.message.type === 'text') {
        const sourceType = event.source.type; // 'user', 'group', 'room'
        
        if (sourceType === 'user') {
          // 개별 사용자 메시지 - User ID 수집
          const userId = event.source.userId;
          const messageText = event.message.text;
          
          console.log(`👤 개별 사용자 ${userId}로부터 메시지: "${messageText}"`);
          
          // 사용자 프로필 정보 가져오기
          try {
            const profileResponse = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
              headers: {
                'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
              }
            });
            
            if (profileResponse.ok) {
              const profile = await profileResponse.json();
              
              // 중복 체크
              const existingUser = collectedUsers.find(u => u.userId === userId);
              if (!existingUser) {
                const userInfo = {
                  userId: userId,
                  displayName: profile.displayName,
                  pictureUrl: profile.pictureUrl,
                  statusMessage: profile.statusMessage,
                  timestamp: new Date().toISOString(),
                  lastMessage: messageText
                };
                
                collectedUsers.push(userInfo);
                console.log(`✅ 새 사용자 수집됨: ${profile.displayName} (${userId})`);
              } else {
                // 기존 사용자 정보 업데이트
                existingUser.lastMessage = messageText;
                existingUser.timestamp = new Date().toISOString();
                console.log(`🔄 기존 사용자 업데이트: ${existingUser.displayName}`);
              }
            }
          } catch (error) {
            console.error('❌ 사용자 프로필 조회 오류:', error);
          }
          
        } else if (sourceType === 'group') {
          // 그룹 메시지 - 그룹 ID 수집
          const groupId = event.source.groupId;
          const userId = event.source.userId;
          const messageText = event.message.text;
          
          console.log(`👥 그룹 ${groupId}에서 사용자 ${userId}가 메시지: "${messageText}"`);
          
          // 그룹 정보 가져오기
          try {
            const groupResponse = await fetch(`https://api.line.me/v2/bot/group/${groupId}/summary`, {
              headers: {
                'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
              }
            });
            
            let groupName = `그룹 ${groupId.substring(0, 8)}...`;
            if (groupResponse.ok) {
              const groupInfo = await groupResponse.json();
              groupName = groupInfo.groupName || groupName;
            }
            
            // 중복 체크
            const existingGroup = collectedGroups.find(g => g.groupId === groupId);
            if (!existingGroup) {
              const groupInfo = {
                groupId: groupId,
                groupName: groupName,
                timestamp: new Date().toISOString(),
                lastMessage: messageText,
                lastUserId: userId
              };
              
              collectedGroups.push(groupInfo);
              console.log(`✅ 새 그룹 수집됨: ${groupName} (${groupId})`);
            } else {
              // 기존 그룹 정보 업데이트
              existingGroup.lastMessage = messageText;
              existingGroup.lastUserId = userId;
              existingGroup.timestamp = new Date().toISOString();
              console.log(`🔄 기존 그룹 업데이트: ${existingGroup.groupName}`);
            }
          } catch (error) {
            console.error('❌ 그룹 정보 조회 오류:', error);
            
            // 그룹 정보 조회 실패 시에도 기본 정보 저장
            const existingGroup = collectedGroups.find(g => g.groupId === groupId);
            if (!existingGroup) {
              const groupInfo = {
                groupId: groupId,
                groupName: `그룹 ${groupId.substring(0, 8)}...`,
                timestamp: new Date().toISOString(),
                lastMessage: messageText,
                lastUserId: userId
              };
              
              collectedGroups.push(groupInfo);
              console.log(`✅ 새 그룹 수집됨 (기본 정보): ${groupInfo.groupName}`);
            }
          }
        }
      }

      // 팔로우 이벤트 처리
      if (event.type === 'follow') {
        const userId = event.source.userId;
        console.log(`👥 새 팔로워: ${userId}`);
        
        // 팔로우 시에도 사용자 정보 수집
        try {
          const profileResponse = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
            headers: {
              'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
            }
          });
          
          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            
            const existingUser = collectedUsers.find(u => u.userId === userId);
            if (!existingUser) {
              const userInfo = {
                userId: userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl,
                statusMessage: profile.statusMessage,
                timestamp: new Date().toISOString(),
                lastMessage: '[팔로우]'
              };
              
              collectedUsers.push(userInfo);
              console.log(`✅ 팔로워 사용자 수집됨: ${profile.displayName}`);
            }
          }
        } catch (error) {
          console.error('❌ 팔로워 프로필 조회 오류:', error);
        }
      }

      // 언팔로우 이벤트 처리
      if (event.type === 'unfollow') {
        const userId = event.source.userId;
        console.log(`👋 팔로우 해제: ${userId}`);
      }
    }

    // LINE에게 200 응답 반환 (필수)
    res.status(200).json({ 
      message: 'Webhook 처리 완료',
      eventsCount: events.length,
      collectedUsers: collectedUsers.length,
      collectedGroups: collectedGroups.length
    });

  } catch (error) {
    console.error('❌ LINE Webhook 처리 오류:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Webhook 처리 중 오류가 발생했습니다.'
    });
  }
});

// LINE 그룹/채팅방 정보 조회 (옵션)
app.get('/api/line/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log('👥 LINE 그룹 정보 조회:', groupId);

    if (!LINE_ACCESS_TOKEN) {
      return res.status(500).json({ 
        error: 'LINE_ACCESS_TOKEN이 설정되지 않았습니다.' 
      });
    }

    const response = await fetch(`https://api.line.me/v2/bot/group/${groupId}/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ LINE 그룹 정보 조회 오류:', result);
      return res.status(response.status).json(result);
    }

    console.log('✅ LINE 그룹 정보 조회 성공:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ LINE 그룹 정보 조회 오류:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'LINE 그룹 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

// Telegram 메시지 발송 API
app.post('/api/telegram/send', async (req, res) => {
  try {
    console.log('📤 Telegram 메시지 발송 요청:', req.body);

    const { botToken, chatId, text, parseMode = 'HTML' } = req.body;

    if (!botToken) {
      return res.status(400).json({ 
        error: 'botToken이 필요합니다.' 
      });
    }

    if (!chatId) {
      return res.status(400).json({ 
        error: 'chatId가 필요합니다.' 
      });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
        disable_web_page_preview: true
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Telegram API 오류:', result);
      return res.status(response.status).json(result);
    }

    console.log('✅ Telegram 메시지 발송 성공:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Telegram 메시지 발송 오류:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Telegram 메시지 발송 중 오류가 발생했습니다.'
    });
  }
});

// Telegram Bot 정보 조회 API
app.get('/api/telegram/info', async (req, res) => {
  try {
    console.log('🤖 Telegram Bot 정보 조회 요청');

    const { botToken } = req.query;

    if (!botToken) {
      return res.status(400).json({ 
        error: 'botToken이 필요합니다.' 
      });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Telegram Bot 정보 조회 오류:', result);
      return res.status(response.status).json(result);
    }

    console.log('✅ Telegram Bot 정보 조회 성공:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Telegram Bot 정보 조회 오류:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Telegram Bot 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

// LINE 토큰 검증 API (프론트엔드용)
app.post('/api/line/verify-token', async (req, res) => {
  try {
    console.log('🔐 LINE 토큰 검증 요청');
    
    const { channelAccessToken } = req.body;
    
    if (!channelAccessToken) {
      return res.status(400).json({ 
        success: false,
        error: 'Channel Access Token이 필요합니다.' 
      });
    }

    // LINE Bot 정보 조회로 토큰 유효성 검증
    const response = await fetch('https://api.line.me/v2/bot/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`
      }
    });

    if (response.ok) {
      const botInfo = await response.json();
      console.log('✅ LINE 토큰 검증 성공:', botInfo.displayName);
      
      res.json({
        success: true,
        displayName: botInfo.displayName,
        userId: botInfo.userId,
        pictureUrl: botInfo.pictureUrl
      });
    } else {
      const errorData = await response.json();
      console.error('❌ LINE 토큰 검증 실패:', errorData);
      
      res.status(400).json({
        success: false,
        error: errorData.message || '토큰이 유효하지 않습니다.'
      });
    }
  } catch (error) {
    console.error('❌ LINE 토큰 검증 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

// LINE 개별 메시지 발송 API (프론트엔드용)
app.post('/api/line/send-message', async (req, res) => {
  try {
    console.log('📤 LINE 개별 메시지 발송 요청:', req.body);
    
    const { channelAccessToken, to, messages } = req.body;
    
    if (!channelAccessToken || !to || !messages) {
      return res.status(400).json({ 
        success: false,
        error: '필수 파라미터가 누락되었습니다.' 
      });
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        messages
      })
    });

    if (response.ok) {
      console.log('✅ LINE 개별 메시지 발송 성공');
      res.json({ 
        success: true, 
        message: '메시지가 성공적으로 발송되었습니다.' 
      });
    } else {
      const errorData = await response.json();
      console.error('❌ LINE 개별 메시지 발송 실패:', errorData);
      
      res.status(400).json({
        success: false,
        error: errorData.message || '메시지 발송에 실패했습니다.'
      });
    }
  } catch (error) {
    console.error('❌ LINE 개별 메시지 발송 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

// LINE 그룹 메시지 발송 API (프론트엔드용)
app.post('/api/line/send-group-message', async (req, res) => {
  try {
    console.log('📤 LINE 그룹 메시지 발송 요청:', req.body);
    
    const { channelAccessToken, to, messages } = req.body;
    
    if (!channelAccessToken || !to || !messages) {
      return res.status(400).json({ 
        success: false,
        error: '필수 파라미터가 누락되었습니다.' 
      });
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        messages
      })
    });

    if (response.ok) {
      console.log('✅ LINE 그룹 메시지 발송 성공');
      res.json({ 
        success: true, 
        message: '그룹 메시지가 성공적으로 발송되었습니다.' 
      });
    } else {
      const errorData = await response.json();
      console.error('❌ LINE 그룹 메시지 발송 실패:', errorData);
      
      res.status(400).json({
        success: false,
        error: errorData.message || '그룹 메시지 발송에 실패했습니다.'
      });
    }
  } catch (error) {
    console.error('❌ LINE 그룹 메시지 발송 오류:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

// WeChat 메시지 발송 API (준비중 - 실제 구현 시 WeChat API 사용)
app.post('/api/wechat/send', async (req, res) => {
  try {
    console.log('📤 WeChat 메시지 발송 요청:', req.body);

    // 현재는 준비중 상태
    res.status(501).json({ 
      error: 'WeChat API 준비중',
      message: 'WeChat 메시지 발송 기능은 현재 준비 중입니다.'
    });
  } catch (error) {
    console.error('❌ WeChat 메시지 발송 오류:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'WeChat 메시지 발송 중 오류가 발생했습니다.'
    });
  }
});

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
  console.error('❌ 서버 오류:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `경로를 찾을 수 없습니다: ${req.method} ${req.path}`
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 LINE API 프록시 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
  console.log('📝 설정된 환경 변수:');
  console.log(`  - LINE_ACCESS_TOKEN: ${LINE_ACCESS_TOKEN ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log(`  - LINE_CHANNEL_SECRET: ${LINE_CHANNEL_SECRET ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log('🔗 사용 가능한 엔드포인트:');
  console.log(`  - GET  http://localhost:${PORT}/`);
  console.log(`  - GET  http://localhost:${PORT}/api/line/info`);
  console.log(`  - POST http://localhost:${PORT}/api/line/send`);
  console.log(`  - POST http://localhost:${PORT}/api/line/verify-token (프론트엔드용)`);
  console.log(`  - POST http://localhost:${PORT}/api/line/send-message (프론트엔드용)`);
  console.log(`  - POST http://localhost:${PORT}/api/line/send-group-message (프론트엔드용)`);
  console.log(`  - POST http://localhost:${PORT}/api/line/webhook`);
  console.log(`  - GET  http://localhost:${PORT}/api/line/profile/:userId`);
  console.log(`  - GET  http://localhost:${PORT}/api/line/group/:groupId`);
  console.log(`  - GET  http://localhost:${PORT}/api/line/collected-users`);
  console.log(`  - GET  http://localhost:${PORT}/api/line/collected-groups`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 서버를 종료합니다...');
  process.exit(0);
}); 