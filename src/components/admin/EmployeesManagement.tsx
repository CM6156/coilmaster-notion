'use client';

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
import { Employee } from "@/types";
import { useAppContext } from "@/context/AppContext";
import CreateEmployeeDialog from "./dialogs/CreateEmployeeDialog";
import CreateSubTaskDialog from "./dialogs/CreateSubTaskDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

export default function EmployeesManagement() {
  const { employees } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubTaskDialogOpen, setIsSubTaskDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);

  const handleAddSubTask = (projectId: string, projectName: string) => {
    setSelectedProject({ id: projectId, name: projectName });
    setIsSubTaskDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>직원 관리</CardTitle>
              <CardDescription>직원 정보를 관리합니다.</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              새 직원 등록
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="직원 검색..."
              className="max-w-sm"
            />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 부서</SelectItem>
                <SelectItem value="development">개발</SelectItem>
                <SelectItem value="sales">영업</SelectItem>
                <SelectItem value="management">경영</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="법인 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 법인</SelectItem>
                <SelectItem value="hq">본사</SelectItem>
                <SelectItem value="branch">지사</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사번</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>영문 이름</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>법인</TableHead>
                  <TableHead>직책</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.employee_number}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.english_name}</TableCell>
                    <TableCell>{employee.department?.name || '-'}</TableCell>
                    <TableCell>{employee.corporation?.name || '-'}</TableCell>
                    <TableCell>{employee.position?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          수정
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          삭제
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500"
                          onClick={() => handleAddSubTask(employee.id, employee.name)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          하위 업무
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateEmployeeDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {selectedProject && (
        <CreateSubTaskDialog
          open={isSubTaskDialogOpen}
          onOpenChange={setIsSubTaskDialogOpen}
          projectId={selectedProject.id}
          projectName={selectedProject.name}
        />
      )}
    </div>
  );
} 