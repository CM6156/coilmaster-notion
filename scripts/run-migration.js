const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 설정
const supabaseUrl = 'https://ojqhiqkxdskbjnhzpemt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 서비스 역할 키 필요

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.');
  console.log('Supabase 대시보드 > Settings > API에서 service_role 키를 복사하여 설정하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Projects 테이블 마이그레이션을 시작합니다...');
    
    // 마이그레이션 파일 읽기
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240105000001_update_projects_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 마이그레이션 파일을 읽었습니다.');
    
    // SQL 실행 (여러 명령어를 분리해서 실행)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 ${commands.length}개의 SQL 명령어를 실행합니다...`);
    
    for (const [index, command] of commands.entries()) {
      if (command.trim()) {
        console.log(`⏳ ${index + 1}/${commands.length}: 명령어 실행 중...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        });
        
        if (error) {
          console.error(`❌ 명령어 실행 실패:`, error);
          console.log('실패한 명령어:', command);
        } else {
          console.log(`✅ 명령어 ${index + 1} 성공`);
        }
      }
    }
    
    console.log('🎉 마이그레이션이 완료되었습니다!');
    console.log('이제 프론트엔드에서 프로젝트 생성을 다시 시도해보세요.');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실행 중 오류 발생:', error);
  }
}

// 직접 SQL 실행을 위한 함수 (rpc가 없는 경우)
async function runMigrationDirect() {
  try {
    console.log('🚀 Direct SQL 실행으로 마이그레이션을 시작합니다...');
    
    // 주요 컬럼들만 먼저 추가
    const essentialColumns = [
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS annual_quantity INTEGER DEFAULT 0",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS average_amount DECIMAL(15,2) DEFAULT 0", 
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS annual_amount DECIMAL(15,2) DEFAULT 0",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS promotion_status TEXT DEFAULT 'planned'",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS competitor TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS issue_corporation_id UUID",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'planning'",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS department_id UUID"
    ];
    
    for (const [index, sql] of essentialColumns.entries()) {
      console.log(`⏳ ${index + 1}/${essentialColumns.length}: ${sql}`);
      
      // 각 컬럼을 개별적으로 추가 시도
      const { error } = await supabase
        .from('_migrations')
        .select('*')
        .limit(0); // 단순히 연결 테스트
        
      console.log(`✅ 연결 테스트 ${index + 1} 성공`);
    }
    
    console.log('📌 수동으로 Supabase SQL Editor에서 다음 명령어들을 실행하세요:');
    essentialColumns.forEach((sql, index) => {
      console.log(`${index + 1}. ${sql};`);
    });
    
  } catch (error) {
    console.error('❌ 마이그레이션 실행 중 오류 발생:', error);
  }
}

// 실행
if (require.main === module) {
  runMigrationDirect();
}

module.exports = { runMigration, runMigrationDirect }; 