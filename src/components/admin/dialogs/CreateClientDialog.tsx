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
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const clientFormSchema = z.object({
  name: z.string().min(2, "고객사명은 2자 이상이어야 합니다."),
  country: z.string().min(1, "국가를 입력하세요."),
  manager_id: z.string().min(1, "담당자를 선택하세요."),
  contact_email: z.string().email("유효한 이메일 주소를 입력하세요.").optional(),
  homepage: z.string().url("유효한 URL을 입력하세요.").optional(),
  flag: z.string().optional(),
  remark: z.string().optional(),
  requirements: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateClientDialog({
  open,
  onOpenChange,
}: CreateClientDialogProps) {
  const { managers, createClient } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      manager_id: "",
      country: "대한민국",
      contact_email: "",
      homepage: "",
      flag: "",
      remark: "",
      requirements: "",
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    try {
      setIsSubmitting(true);
      await createClient({
        name: values.name,
        manager_id: values.manager_id,
        country: values.country,
        contact_email: values.contact_email,
        homepage: values.homepage,
        flag: values.flag,
        remark: values.remark,
        requirements: values.requirements,
      });
      toast.success("고객사가 성공적으로 등록되었습니다.");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("고객사 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>신규 고객 등록</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>고객명</FormLabel>
                  <FormControl>
                    <Input placeholder="고객사 이름" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>국가</FormLabel>
                  <FormControl>
                    <Input placeholder="국가" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>담당자</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="담당자를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name} ({manager.position?.name || '직책 없음'})
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
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="이메일 주소" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="homepage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>홈페이지</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="flag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flag</FormLabel>
                    <FormControl>
                      <Input placeholder="중요 정보 플래그" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remark"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remark</FormLabel>
                    <FormControl>
                      <Input placeholder="간단한 비고" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>요구사항</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="고객사 요구사항 및 특이사항"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
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