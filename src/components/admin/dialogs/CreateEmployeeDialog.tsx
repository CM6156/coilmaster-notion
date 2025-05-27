'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useAppContext } from "@/context/AppContext";
import { CreateEmployeeInput } from "@/types";

const employeeFormSchema = z.object({
  employee_number: z.string().min(1, "사번을 입력하세요."),
  name: z.string().min(2, "이름은 2자 이상이어야 합니다."),
  english_name: z.string().optional(),
  department_id: z.string().min(1, "부서를 선택하세요."),
  corporation_id: z.string().min(1, "법인을 선택하세요."),
  position_id: z.string().min(1, "직책을 선택하세요."),
});

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateEmployeeDialog({
  open,
  onOpenChange,
}: CreateEmployeeDialogProps) {
  const { departments, corporations, positions, createEmployee } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateEmployeeInput>({
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

  const onSubmit = async (data: CreateEmployeeInput) => {
    try {
      setIsSubmitting(true);
      await createEmployee(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error creating employee:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 직원 등록</DialogTitle>
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
                {isSubmitting ? "등록 중..." : "등록"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 