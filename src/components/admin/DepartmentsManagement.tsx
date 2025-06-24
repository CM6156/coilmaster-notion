import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Department } from "@/types";
import { useAppContext } from "@/context/AppContext";
import CreateDepartmentDialog from "./dialogs/CreateDepartmentDialog";

export default function DepartmentsManagement() {
  const { departments } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    console.log('🏢 DepartmentsManagement - 부서 목록 업데이트:', departments);
    console.log('🏢 부서 개수:', departments.length);
  }, [departments]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">부서 관리</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          새 부서 등록
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>부서명</TableHead>
              <TableHead>부서코드</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length > 0 ? (
              departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.code}</TableCell>
                  <TableCell>{department.description || '-'}</TableCell>
                  <TableCell>
                    {new Date(department.created_at).toLocaleDateString('ko-KR')}
                  </TableCell>
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
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  등록된 부서가 없습니다. 새 부서를 등록해보세요.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateDepartmentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
} 