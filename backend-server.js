/**
 * 외부 알림 API 프록시 서버
 * 포트 8082에서 실행
 * 
 * 설치 방법:
 * npm install express cors axios dotenv
 * 
 * 실행 방법:
 * node backend-server.js
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 8082;

// 미들웨어
app.use(cors());
app.use(express.json());

// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// LINE API 프록시
app.post('/api/line/send', async (req, res) => {
  try {
    const { to, messages } = req.body;
    const channelAccessToken = process.env.VITE_LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!channelAccessToken) {
      return res.status(400).json({ 
        error: 'LINE Channel Access Token이 설정되지 않았습니다.' 
      });
    }

    console.log('📱 LINE API 호출 시작:', { to, messageCount: messages?.length });

    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      { to, messages },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${channelAccessToken}`
        }
      }
    );

    console.log('✅ LINE API 성공:', response.status);
    res.json({ success: true, data: response.data });

  } catch (error) {
    console.error('❌ LINE API 에러:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data || error.message 
    });
  }
});

// Telegram API 프록시
app.post('/api/telegram/send', async (req, res) => {
  try {
    const { botToken, chatId, chat_id, text, parse_mode } = req.body;
    const finalChatId = chatId || chat_id;
    const finalBotToken = botToken || process.env.VITE_TELEGRAM_BOT_TOKEN;
    
    if (!finalBotToken) {
      return res.status(400).json({ 
        error: 'Telegram Bot Token이 설정되지 않았습니다.' 
      });
    }

    console.log('🤖 Telegram API 호출 시작:', { chatId: finalChatId, textLength: text?.length });

    const response = await axios.post(
      `https://api.telegram.org/bot${finalBotToken}/sendMessage`,
      {
        chat_id: finalChatId,
        text,
        parse_mode: parse_mode || 'HTML'
      }
    );

    console.log('✅ Telegram API 성공:', response.status);
    res.json({ success: true, data: response.data });

  } catch (error) {
    console.error('❌ Telegram API 에러:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data || error.message 
    });
  }
});

// LINE 사용자 프로필 조회
app.get('/api/line/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const channelAccessToken = process.env.VITE_LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!channelAccessToken) {
      return res.status(400).json({ 
        error: 'LINE Channel Access Token이 설정되지 않았습니다.' 
      });
    }

    const response = await axios.get(
      `https://api.line.me/v2/bot/profile/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${channelAccessToken}`
        }
      }
    );

    res.json({ success: true, data: response.data });

  } catch (error) {
    console.error('❌ LINE Profile API 에러:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data || error.message 
    });
  }
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: {
      hasLineToken: !!process.env.VITE_LINE_CHANNEL_ACCESS_TOKEN,
      hasTelegramToken: !!process.env.VITE_TELEGRAM_BOT_TOKEN
    }
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 외부 알림 API 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  console.log('📱 LINE API: /api/line/send');
  console.log('🤖 Telegram API: /api/telegram/send');
  console.log('👤 LINE Profile: /api/line/profile/:userId');
  
  // 환경변수 체크
  if (!process.env.VITE_LINE_CHANNEL_ACCESS_TOKEN) {
    console.warn('⚠️  LINE_CHANNEL_ACCESS_TOKEN이 설정되지 않았습니다.');
  }
  if (!process.env.VITE_TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.');
  }
}); 