// Vercel API: 수집된 LINE 사용자 목록 조회
let collectedUsers = [];

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // 수집된 사용자 목록 반환
      return res.status(200).json({ 
        users: collectedUsers,
        count: collectedUsers.length,
        timestamp: new Date().toISOString()
      });
    } else if (req.method === 'POST') {
      // 새 사용자 데이터 추가 (Webhook에서 호출)
      const { userId, displayName, pictureUrl, statusMessage, timestamp, lastMessage } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId가 필요합니다.' });
      }

      // 중복 체크
      const existingUser = collectedUsers.find(u => u.userId === userId);
      if (!existingUser) {
        const userInfo = {
          userId,
          displayName: displayName || `사용자_${userId.substring(0, 8)}`,
          pictureUrl: pictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=random`,
          statusMessage: statusMessage || '',
          timestamp: timestamp || new Date().toISOString(),
          lastMessage: lastMessage || ''
        };
        
        collectedUsers.push(userInfo);
        console.log(`✅ 새 사용자 수집됨: ${userInfo.displayName} (${userId})`);
      } else {
        // 기존 사용자 정보 업데이트
        existingUser.lastMessage = lastMessage || existingUser.lastMessage;
        existingUser.timestamp = timestamp || new Date().toISOString();
        console.log(`🔄 기존 사용자 업데이트: ${existingUser.displayName}`);
      }

      return res.status(200).json({ 
        message: '사용자 데이터가 추가/업데이트되었습니다.',
        user: existingUser || collectedUsers[collectedUsers.length - 1]
      });
    } else if (req.method === 'DELETE') {
      // 수집된 사용자 목록 초기화
      collectedUsers.length = 0;
      return res.status(200).json({ 
        message: '수집된 사용자 목록이 초기화되었습니다.' 
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ 수집된 사용자 조회 오류:', error);
    return res.status(500).json({ 
      error: error.message,
      message: '수집된 사용자 조회 중 오류가 발생했습니다.'
    });
  }
} 