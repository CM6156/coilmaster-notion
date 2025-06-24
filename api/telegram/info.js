// Telegram Bot 정보 조회 API
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
} 