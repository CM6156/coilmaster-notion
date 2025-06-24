// Vercel API: 수집된 LINE 그룹 목록 조회
// 다른 파일과 데이터 공유를 위해 전역 변수 사용
global.collectedGroups = global.collectedGroups || [];
const collectedGroups = global.collectedGroups;

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
      // 수집된 그룹 목록 반환
      return res.status(200).json({ 
        groups: collectedGroups,
        count: collectedGroups.length,
        timestamp: new Date().toISOString()
      });
    } else if (req.method === 'POST') {
      // 새 그룹 데이터 추가 (Webhook에서 호출)
      const { groupId, groupName, timestamp, lastMessage, lastUserId } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ error: 'groupId가 필요합니다.' });
      }

      // 중복 체크
      const existingGroup = collectedGroups.find(g => g.groupId === groupId);
      if (!existingGroup) {
        const groupInfo = {
          groupId,
          groupName: groupName || `그룹_${groupId.substring(0, 8)}`,
          timestamp: timestamp || new Date().toISOString(),
          lastMessage: lastMessage || '',
          lastUserId: lastUserId || ''
        };
        
        collectedGroups.push(groupInfo);
        console.log(`✅ 새 그룹 수집됨: ${groupInfo.groupName} (${groupId})`);
      } else {
        // 기존 그룹 정보 업데이트
        existingGroup.lastMessage = lastMessage || existingGroup.lastMessage;
        existingGroup.lastUserId = lastUserId || existingGroup.lastUserId;
        existingGroup.timestamp = timestamp || new Date().toISOString();
        console.log(`🔄 기존 그룹 업데이트: ${existingGroup.groupName}`);
      }

      return res.status(200).json({ 
        message: '그룹 데이터가 추가/업데이트되었습니다.',
        group: existingGroup || collectedGroups[collectedGroups.length - 1]
      });
    } else if (req.method === 'DELETE') {
      // 수집된 그룹 목록 초기화
      collectedGroups.length = 0;
      return res.status(200).json({ 
        message: '수집된 그룹 목록이 초기화되었습니다.' 
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ 수집된 그룹 조회 오류:', error);
    return res.status(500).json({ 
      error: error.message,
      message: '수집된 그룹 조회 중 오류가 발생했습니다.'
    });
  }
} 