import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User } from "@/types";
import { useAppContext } from "@/context/AppContext";
import CreateUserDialog from "./dialogs/CreateUserDialog";

export default function UsersManagement() {
  const { users, departments, corporations, positions } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 디버깅 로그 추가
  console.log("=== UsersManagement 디버깅 ===");
  console.log("🎯 users 배열:", users);
  console.log("🎯 users 개수:", users?.length || 0);
  console.log("🎯 departments 배열:", departments);
  console.log("🎯 departments 개수:", departments?.length || 0);
  console.log("🎯 corporations 배열:", corporations);
  console.log("🎯 corporations 개수:", corporations?.length || 0);
  console.log("🎯 positions 배열:", positions);
  console.log("🎯 positions 개수:", positions?.length || 0);
  
  // 첫 번째 사용자 데이터 상세 분석
  if (users && users.length > 0) {
    console.log("첫 번째 사용자 데이터 상세:", users[0]);
    console.log("첫 번째 사용자의 department:", (users[0] as any).department_id || users[0].department);
    console.log("첫 번째 사용자의 corporation:", (users[0] as any).corporation_id || users[0].corporation);
    console.log("첫 번째 사용자의 position:", (users[0] as any).position_id || users[0].position);
    console.log("첫 번째 사용자의 department 객체:", users[0].department);
    console.log("첫 번째 사용자의 corporation 객체:", users[0].corporation);
    console.log("첫 번째 사용자의 position 객체:", users[0].position);
  }
  console.log("=== 디버깅 끝 ===");

  // 부서 이름 가져오기
  const getDepartmentName = (user: any) => {
    console.log(`부서 이름 조회 - 사용자: ${user.name}`);
    console.log('department 객체:', user.department);
    
    // JOIN으로 가져온 department 객체가 있는 경우
    if (user.department && typeof user.department === 'object' && user.department.name) {
      console.log(`✅ JOIN 데이터에서 부서 이름 찾음: ${user.department.name}`);
      return user.department.name;
    }
    
    // department_id로 departments 배열에서 찾기
    const departmentId = user.department_id || (typeof user.department === 'string' ? user.department : null);
    if (departmentId) {
      const dept = departments.find(d => d.id === departmentId);
      if (dept) {
        console.log(`✅ departments 배열에서 부서 이름 찾음: ${dept.name}`);
        return dept.name;
      } else {
        console.log(`❌ departments 배열에서 ID ${departmentId}를 찾을 수 없음`);
        console.log('사용 가능한 departments:', departments.map(d => ({ id: d.id, name: d.name })));
      }
    }
    
    // department가 문자열인 경우 (부서 코드)
    if (typeof user.department === 'string') {
      const dept = departments.find(d => d.code === user.department);
      if (dept) {
        console.log(`✅ departments 배열에서 부서 코드로 이름 찾음: ${dept.name}`);
        return dept.name;
      }
    }
    
    console.log('❌ 부서 이름을 찾을 수 없음, "-" 반환');
    return '-';
  };

  // 법인 이름 가져오기
  const getCorporationName = (user: any) => {
    console.log(`법인 이름 조회 - 사용자: ${user.name}`);
    console.log('corporation 객체:', user.corporation);
    
    // JOIN으로 가져온 corporation 객체가 있는 경우
    if (user.corporation && typeof user.corporation === 'object' && user.corporation.name) {
      console.log(`✅ JOIN 데이터에서 법인 이름 찾음: ${user.corporation.name}`);
      return user.corporation.name;
    }
    
    // corporation_id로 corporations 배열에서 찾기
    const corporationId = user.corporation_id || (typeof user.corporation === 'string' ? user.corporation : null);
    if (corporationId) {
      const corp = corporations.find(c => c.id === corporationId);
      if (corp) {
        console.log(`✅ corporations 배열에서 법인 이름 찾음: ${corp.name}`);
        return corp.name;
      } else {
        console.log(`❌ corporations 배열에서 ID ${corporationId}를 찾을 수 없음`);
        console.log('사용 가능한 corporations:', corporations.map(c => ({ id: c.id, name: c.name })));
      }
    }
    
    // corporation이 문자열인 경우 (법인 코드)
    if (typeof user.corporation === 'string') {
      const corp = corporations.find(c => c.code === user.corporation);
      if (corp) {
        console.log(`✅ corporations 배열에서 법인 코드로 이름 찾음: ${corp.name}`);
        return corp.name;
      }
    }
    
    console.log('❌ 법인 이름을 찾을 수 없음, "-" 반환');
    return '-';
  };

  // 직책 이름 가져오기
  const getPositionName = (user: any) => {
    console.log(`직책 이름 조회 - 사용자: ${user.name}`);
    console.log('position 객체:', user.position);
    
    // JOIN으로 가져온 position 객체가 있는 경우
    if (user.position && typeof user.position === 'object' && user.position.name) {
      console.log(`✅ JOIN 데이터에서 직책 이름 찾음: ${user.position.name}`);
      return user.position.name;
    }
    
    // position_id로 positions 배열에서 찾기
    const positionId = user.position_id || (typeof user.position === 'string' ? user.position : null);
    if (positionId) {
      const pos = positions.find(p => p.id === positionId);
      if (pos) {
        console.log(`✅ positions 배열에서 직책 이름 찾음: ${pos.name}`);
        return pos.name;
      } else {
        console.log(`❌ positions 배열에서 ID ${positionId}를 찾을 수 없음`);
        console.log('사용 가능한 positions:', positions.map(p => ({ id: p.id, name: p.name })));
      }
    }
    
    // position이 문자열인 경우 (직책 코드)
    if (typeof user.position === 'string') {
      const pos = positions.find(p => p.code === user.position);
      if (pos) {
        console.log(`✅ positions 배열에서 직책 코드로 이름 찾음: ${pos.name}`);
        return pos.name;
      }
    }
    
    console.log('❌ 직책 이름을 찾을 수 없음, "-" 반환');
    return '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">사용자 관리</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          새 사용자 등록
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>법인</TableHead>
              <TableHead>국가</TableHead>
              <TableHead>직책</TableHead>
              <TableHead>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getDepartmentName(user)}</TableCell>
                  <TableCell>{getCorporationName(user)}</TableCell>
                  <TableCell>{user.country}</TableCell>
                  <TableCell>{getPositionName(user)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      수정
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500">
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  등록된 사용자가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
} 