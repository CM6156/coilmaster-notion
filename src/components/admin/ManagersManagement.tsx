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
import { Manager } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import React from "react";

const managerFormSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상이어야 합니다."),
  email: z.string().email("유효한 이메일 주소를 입력하세요."),
  corporation_id: z.string().min(1, "법인을 선택하세요."),
  department_id: z.string().min(1, "부서를 선택하세요."),
  position_id: z.string().min(1, "직책을 선택하세요."),
});

type ManagerFormValues = z.infer<typeof managerFormSchema>;

export default function ManagersManagement() {
  const { managers, corporations, positions, departments, createManager, updateManager, deleteManager } = useAppContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 디버깅 로그 추가
  console.log("=== ManagersManagement 디버깅 ===");
  console.log("🎯 managers 배열:", managers);
  console.log("🎯 managers 개수:", managers?.length || 0);
  console.log("🎯 corporations 배열:", corporations);
  console.log("🎯 corporations 개수:", corporations?.length || 0);
  console.log("🎯 departments 배열:", departments);
  console.log("🎯 departments 개수:", departments?.length || 0);
  console.log("🎯 positions 배열:", positions);
  console.log("🎯 positions 개수:", positions?.length || 0);
  
  // 첫 번째 담당자 데이터 상세 분석
  if (managers && managers.length > 0) {
    console.log("첫 번째 담당자 데이터 상세:", managers[0]);
    console.log("첫 번째 담당자의 corporation_id:", managers[0].corporation_id);
    console.log("첫 번째 담당자의 department_id:", managers[0].department_id);
    console.log("첫 번째 담당자의 position_id:", managers[0].position_id);
    console.log("첫 번째 담당자의 corporation 객체:", managers[0].corporation);
    console.log("첫 번째 담당자의 department 객체:", managers[0].department);
    console.log("첫 번째 담당자의 position 객체:", managers[0].position);
  }
  console.log("=== 디버깅 끝 ===");

  // 법인 이름 가져오기
  const getCorporationName = (manager: any) => {
    console.log(`법인 이름 조회 - 담당자: ${manager.name}, corporation_id: ${manager.corporation_id}`);
    console.log('corporation 객체:', manager.corporation);
    
    // JOIN으로 가져온 corporation 객체가 있는 경우
    if (manager.corporation && typeof manager.corporation === 'object' && manager.corporation.name) {
      console.log(`✅ JOIN 데이터에서 법인 이름 찾음: ${manager.corporation.name}`);
      return manager.corporation.name;
    }
    
    // corporation_id로 corporations 배열에서 찾기
    if (manager.corporation_id) {
      const corp = corporations.find(c => c.id === manager.corporation_id);
      if (corp) {
        console.log(`✅ corporations 배열에서 법인 이름 찾음: ${corp.name}`);
        return corp.name;
      } else {
        console.log(`❌ corporations 배열에서 ID ${manager.corporation_id}를 찾을 수 없음`);
        console.log('사용 가능한 corporations:', corporations.map(c => ({ id: c.id, name: c.name })));
      }
    }
    
    console.log('❌ 법인 이름을 찾을 수 없음, "-" 반환');
    return '-';
  };

  // 부서 이름 가져오기
  const getDepartmentName = (manager: any) => {
    console.log(`부서 이름 조회 - 담당자: ${manager.name}, department_id: ${manager.department_id}`);
    console.log('department 객체:', manager.department);
    
    // JOIN으로 가져온 department 객체가 있는 경우
    if (manager.department && typeof manager.department === 'object' && manager.department.name) {
      console.log(`✅ JOIN 데이터에서 부서 이름 찾음: ${manager.department.name}`);
      return manager.department.name;
    }
    
    // department_id로 departments 배열에서 찾기
    if (manager.department_id) {
      const dept = departments.find(d => d.id === manager.department_id);
      if (dept) {
        console.log(`✅ departments 배열에서 부서 이름 찾음: ${dept.name}`);
        return dept.name;
      } else {
        console.log(`❌ departments 배열에서 ID ${manager.department_id}를 찾을 수 없음`);
        console.log('사용 가능한 departments:', departments.map(d => ({ id: d.id, name: d.name })));
      }
    }
    
    console.log('❌ 부서 이름을 찾을 수 없음, "-" 반환');
    return '-';
  };

  // 직책 이름 가져오기
  const getPositionName = (manager: any) => {
    console.log(`직책 이름 조회 - 담당자: ${manager.name}, position_id: ${manager.position_id}`);
    console.log('position 객체:', manager.position);
    
    // JOIN으로 가져온 position 객체가 있는 경우
    if (manager.position && typeof manager.position === 'object' && manager.position.name) {
      console.log(`✅ JOIN 데이터에서 직책 이름 찾음: ${manager.position.name}`);
      return manager.position.name;
    }
    
    // position_id로 positions 배열에서 찾기
    if (manager.position_id) {
      const pos = positions.find(p => p.id === manager.position_id);
      if (pos) {
        console.log(`✅ positions 배열에서 직책 이름 찾음: ${pos.name}`);
        return pos.name;
      } else {
        console.log(`❌ positions 배열에서 ID ${manager.position_id}를 찾을 수 없음`);
        console.log('사용 가능한 positions:', positions.map(p => ({ id: p.id, name: p.name })));
      }
    }
    
    console.log('❌ 직책 이름을 찾을 수 없음, "-" 반환');
    return '-';
  };

  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      corporation_id: "",
      department_id: "",
      position_id: "",
    },
  });

  // 폼 값 변화 모니터링
  const formValues = form.watch();
  
  // 폼 값이 변경될 때마다 로그 출력
  React.useEffect(() => {
    console.log("폼 값 변경됨:", formValues);
  }, [formValues]);

  const handleEdit = (manager: Manager) => {
    console.log("편집할 담당자 정보:", manager);
    console.log("department_id:", manager.department_id);
    console.log("corporation_id:", manager.corporation_id);
    console.log("position_id:", manager.position_id);
    
    setSelectedManager(manager);
    
    // 폼 초기화 - 값이 undefined인 경우 빈 문자열로 처리
    form.reset({
      name: manager.name || "",
      email: manager.email || "",
      corporation_id: manager.corporation_id || "",
      department_id: manager.department_id || "",
      position_id: manager.position_id || "",
    });
    
    console.log("폼 초기화 완료:", form.getValues());
    setIsEditDialogOpen(true);
  };

  const handleDelete = (manager: Manager) => {
    setSelectedManager(manager);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: ManagerFormValues) => {
    try {
      setIsSubmitting(true);
      
      // 디버깅 로그
      console.log("=== 담당자 수정/등록 시작 ===");
      console.log("폼 데이터:", JSON.stringify(data, null, 2));
      console.log("선택된 담당자:", selectedManager ? JSON.stringify(selectedManager, null, 2) : "신규 등록");
      
      // 수정할 데이터 구성
      const managerData = {
        name: data.name,
        email: data.email,
        corporation_id: data.corporation_id,
        department_id: data.department_id,
        position_id: data.position_id,
        profile_image: selectedManager?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random&color=fff&size=128`
      };
      
      console.log("업데이트할 데이터:", JSON.stringify(managerData, null, 2));
      
      if (selectedManager) {
        console.log("담당자 수정 시작 - ID:", selectedManager.id);
        
        // 모든 필드를 업데이트 데이터에 포함
        const updateData = {
          name: data.name,
          email: data.email,
          corporation_id: data.corporation_id,
          department_id: data.department_id,
          position_id: data.position_id,
          updated_at: new Date().toISOString()
        };
        
        console.log("최종 업데이트 데이터:", JSON.stringify(updateData, null, 2));
        
        // 업데이트 호출
        try {
          await updateManager(selectedManager.id, updateData);
          console.log("담당자 수정 완료");
          
          // 성공 알림 추가 (필요 시 여기에 토스트 메시지 추가)
          alert("담당자 정보가 성공적으로 수정되었습니다.");
        } catch (updateError) {
          console.error("담당자 수정 중 오류:", updateError);
          alert("담당자 수정 중 오류가 발생했습니다: " + (updateError as Error).message);
          throw updateError;
        }
      } else {
        try {
          console.log("담당자 신규 등록 시작");
          await createManager(managerData);
          console.log("담당자 등록 완료");
          alert("새 담당자가 성공적으로 등록되었습니다.");
        } catch (createError) {
          console.error("담당자 등록 중 오류:", createError);
          alert("담당자 등록 중 오류가 발생했습니다: " + (createError as Error).message);
          throw createError;
        }
      }
      
      // 폼 초기화 및 다이얼로그 닫기
      form.reset({
        name: "",
        email: "",
        corporation_id: "",
        department_id: "",
        position_id: ""
      });
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedManager(null);
      
      console.log("=== 담당자 수정/등록 완료 ===");
    } catch (error) {
      console.error("담당자 저장 중 오류 발생:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!selectedManager) return;
    try {
      setIsSubmitting(true);
      await deleteManager(selectedManager.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting manager:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>담당자 관리</CardTitle>
              <CardDescription>담당자 정보를 관리합니다.</CardDescription>
            </div>
            <Button onClick={() => {
              form.reset();
              setSelectedManager(null);
              setIsCreateDialogOpen(true);
            }}>
              새 담당자 등록
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="담당자 검색..."
              className="max-w-sm"
            />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="법인 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 법인</SelectItem>
                {corporations.map((corporation) => (
                  <SelectItem key={corporation.id} value={corporation.id}>
                    {corporation.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>법인</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>직책</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers && managers.length > 0 ? (
                  managers.map((manager) => (
                    <TableRow key={manager.id}>
                      <TableCell>{manager.name}</TableCell>
                      <TableCell>{manager.email}</TableCell>
                      <TableCell>{getCorporationName(manager)}</TableCell>
                      <TableCell>{getDepartmentName(manager)}</TableCell>
                      <TableCell>{getPositionName(manager)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(manager)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDelete(manager)}
                          >
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      등록된 담당자가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedManager ? "담당자 수정" : "새 담당자 등록"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input placeholder="이메일을 입력하세요" type="email" {...field} />
                    </FormControl>
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
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
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
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>부서</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
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
                name="position_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>직책</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
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
                  {isSubmitting ? "저장 중..." : (selectedManager ? "수정" : "등록")}
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
            <AlertDialogTitle>담당자 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 담당자를 삭제하시겠습니까?
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
    </div>
  );
} 