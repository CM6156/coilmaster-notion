// Telegram 메시지 발송 API
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
} 