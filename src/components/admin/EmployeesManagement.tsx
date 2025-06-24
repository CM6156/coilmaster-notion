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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const employeeFormSchema = z.object({
  employee_number: z.string().min(1, "사번을 입력하세요."),
  name: z.string().min(2, "이름은 2자 이상이어야 합니다."),
  english_name: z.string().optional(),
  department_id: z.string().min(1, "부서를 선택하세요."),
  corporation_id: z.string().min(1, "법인을 선택하세요."),
  position_id: z.string().min(1, "직책을 선택하세요."),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function EmployeesManagement() {
  const { employees, departments, corporations, positions, updateEmployee, deleteEmployee } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubTaskDialogOpen, setIsSubTaskDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 디버깅용 로그
  console.log('=== EmployeesManagement 디버깅 ===');
  console.log('employees 배열:', employees);
  console.log('employees 길이:', employees?.length || 0);
  console.log('departments 배열:', departments);
  console.log('departments 길이:', departments?.length || 0);
  console.log('corporations 배열:', corporations);
  console.log('corporations 길이:', corporations?.length || 0);
  console.log('positions 배열:', positions);
  console.log('positions 길이:', positions?.length || 0);
  
  // 첫 번째 직원 데이터 상세 분석
  if (employees && employees.length > 0) {
    console.log('첫 번째 직원 데이터 상세:', employees[0]);
    console.log('첫 번째 직원의 department_id:', employees[0].department_id);
    console.log('첫 번째 직원의 corporation_id:', employees[0].corporation_id);
    console.log('첫 번째 직원의 position_id:', employees[0].position_id);
    console.log('첫 번째 직원의 department 객체:', employees[0].department);
    console.log('첫 번째 직원의 corporation 객체:', employees[0].corporation);
    console.log('첫 번째 직원의 position 객체:', employees[0].position);
  }
  console.log('=== 디버깅 끝 ===');

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employee_number: "",
      name: "",
      english_name: "",
      department_id: "",
      corporation_id: "",
      position_id: "",
    },
  });

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    form.reset({
      employee_number: employee.employee_number || "",
      name: employee.name,
      english_name: employee.english_name || "",
      department_id: employee.department_id || "",
      corporation_id: employee.corporation_id || "",
      position_id: employee.position_id || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubTask = (projectId: string, projectName: string) => {
    setSelectedProject({ id: projectId, name: projectName });
    setIsSubTaskDialogOpen(true);
  };

  const onSubmit = async (data: EmployeeFormValues) => {
    if (!selectedEmployee) return;
    
    try {
      setIsSubmitting(true);
      await updateEmployee(selectedEmployee.id, data);
      form.reset();
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Error updating employee:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!selectedEmployee) return;
    
    try {
      setIsSubmitting(true);
      await deleteEmployee(selectedEmployee.id);
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 부서 이름 가져오기
  const getDepartmentName = (employee: any) => {
    console.log(`부서 이름 조회 - 직원: ${employee.name}, department_id: ${employee.department_id}`);
    console.log('department 객체:', employee.department);
    
    // JOIN으로 가져온 department 객체가 있는 경우
    if (employee.department && typeof employee.department === 'object' && employee.department.name) {
      console.log(`✅ JOIN 데이터에서 부서 이름 찾음: ${employee.department.name}`);
      return employee.department.name;
    }
    
    // department_id로 departments 배열에서 찾기
    if (employee.department_id) {
      const dept = departments.find(d => d.id === employee.department_id);
      if (dept) {
        console.log(`✅ departments 배열에서 부서 이름 찾음: ${dept.name}`);
        return dept.name;
      } else {
        console.log(`❌ departments 배열에서 ID ${employee.department_id}를 찾을 수 없음`);
        console.log('사용 가능한 departments:', departments.map(d => ({ id: d.id, name: d.name })));
      }
    }
    
    console.log('❌ 부서 이름을 찾을 수 없음, "-" 반환');
    return '-';
  };

  // 법인 이름 가져오기
  const getCorporationName = (employee: any) => {
    console.log(`법인 이름 조회 - 직원: ${employee.name}, corporation_id: ${employee.corporation_id}`);
    console.log('corporation 객체:', employee.corporation);
    
    // JOIN으로 가져온 corporation 객체가 있는 경우
    if (employee.corporation && typeof employee.corporation === 'object' && employee.corporation.name) {
      console.log(`✅ JOIN 데이터에서 법인 이름 찾음: ${employee.corporation.name}`);
      return employee.corporation.name;
    }
    
    // corporation_id로 corporations 배열에서 찾기
    if (employee.corporation_id) {
      const corp = corporations.find(c => c.id === employee.corporation_id);
      if (corp) {
        console.log(`✅ corporations 배열에서 법인 이름 찾음: ${corp.name}`);
        return corp.name;
      } else {
        console.log(`❌ corporations 배열에서 ID ${employee.corporation_id}를 찾을 수 없음`);
        console.log('사용 가능한 corporations:', corporations.map(c => ({ id: c.id, name: c.name })));
      }
    }
    
    console.log('❌ 법인 이름을 찾을 수 없음, "-" 반환');
    return '-';
  };

  // 직책 이름 가져오기
  const getPositionName = (employee: any) => {
    console.log(`직책 이름 조회 - 직원: ${employee.name}, position_id: ${employee.position_id}`);
    console.log('position 객체:', employee.position);
    
    // JOIN으로 가져온 position 객체가 있는 경우
    if (employee.position && typeof employee.position === 'object' && employee.position.name) {
      console.log(`✅ JOIN 데이터에서 직책 이름 찾음: ${employee.position.name}`);
      return employee.position.name;
    }
    
    // position_id로 positions 배열에서 찾기
    if (employee.position_id) {
      const pos = positions.find(p => p.id === employee.position_id);
      if (pos) {
        console.log(`✅ positions 배열에서 직책 이름 찾음: ${pos.name}`);
        return pos.name;
      } else {
        console.log(`❌ positions 배열에서 ID ${employee.position_id}를 찾을 수 없음`);
        console.log('사용 가능한 positions:', positions.map(p => ({ id: p.id, name: p.name })));
      }
    }
    
    console.log('❌ 직책 이름을 찾을 수 없음, "-" 반환');
    return '-';
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
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="법인 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 법인</SelectItem>
                {corporations.map(corp => (
                  <SelectItem key={corp.id} value={corp.id}>
                    {corp.name}
                  </SelectItem>
                ))}
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
                {employees && employees.length > 0 ? (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.employee_number}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.english_name || '-'}</TableCell>
                      <TableCell>{getDepartmentName(employee)}</TableCell>
                      <TableCell>{getCorporationName(employee)}</TableCell>
                      <TableCell>{getPositionName(employee)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            수정
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500"
                            onClick={() => handleDelete(employee)}
                          >
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      등록된 직원이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateEmployeeDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(false);
          setSelectedEmployee(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>직원 정보 수정</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="employee_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사번</FormLabel>
                    <FormControl>
                      <Input placeholder="사번을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름</FormLabel>
                    <FormControl>
                      <Input placeholder="이름을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="english_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>영문 이름</FormLabel>
                    <FormControl>
                      <Input placeholder="영문 이름을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>부서</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="부서를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="corporation_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>법인</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="법인을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {corporations.map((corporation) => (
                          <SelectItem key={corporation.id} value={corporation.id}>
                            {corporation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>직책</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="직책을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "수정 중..." : "수정"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>직원 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 "{selectedEmployee?.name}" 직원을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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