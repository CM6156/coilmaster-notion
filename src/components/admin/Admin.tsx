'use client';

import { useState } from "react";
import { User, Position } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersManagement from "./UsersManagement";
import EmployeesManagement from "./EmployeesManagement";
import ManagersManagement from "./ManagersManagement";
import ClientsManagement from "./ClientsManagement";
import CorporationsManagement from "./CorporationsManagement";
import PositionsManagement from "./PositionsManagement";
import DepartmentsManagement from "./DepartmentsManagement";
import { DataManagement } from "./DataManagement";
import SettingsManagement from "./SettingsManagement";
// SettingsManagement 모듈을 찾을 수 없으므로 임포트 제거

// 부서 관련 인터페이스 및 스키마
interface DepartmentData {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const departmentFormSchema = z.object({
  name: z.string().min(2, "부서명은 2자 이상이어야 합니다."),
  code: z.string().min(2, "코드는 2자 이상이어야 합니다."),
  description: z.string().optional(),
});

// 직책 관련 스키마
const positionFormSchema = z.object({
  name: z.string().min(2, "직책명은 2자 이상이어야 합니다."),
  code: z.string().min(2, "코드는 2자 이상이어야 합니다."),
  level: z.number().min(1, "레벨은 1 이상이어야 합니다."),
});

// 담당자 관련 스키마
const managerFormSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상이어야 합니다."),
  email: z.string().email("유효한 이메일 주소를 입력하세요."),
  department: z.string().min(1, "부서를 선택하세요."),
  position: z.string().min(1, "직책을 선택하세요."),
});

export default function Admin() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">관리자 패널</h1>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="users">사용자</TabsTrigger>
          <TabsTrigger value="employees">직원</TabsTrigger>
          <TabsTrigger value="managers">담당자</TabsTrigger>
          <TabsTrigger value="clients">고객사</TabsTrigger>
          <TabsTrigger value="corporations">법인</TabsTrigger>
          <TabsTrigger value="positions">직책</TabsTrigger>
          <TabsTrigger value="departments">부서</TabsTrigger>
          <TabsTrigger value="data">데이터 관리</TabsTrigger>
          <TabsTrigger value="settings">설정 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="employees">
          <EmployeesManagement />
        </TabsContent>

        <TabsContent value="managers">
          <ManagersManagement />
        </TabsContent>

        <TabsContent value="clients">
          <ClientsManagement />
        </TabsContent>

        <TabsContent value="corporations">
          <CorporationsManagement />
        </TabsContent>

        <TabsContent value="positions">
          <PositionsManagement />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsManagement />
        </TabsContent>

        <TabsContent value="data">
          <DataManagement />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
} 