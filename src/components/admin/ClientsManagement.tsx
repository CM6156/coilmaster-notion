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
import { Client } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

const clientFormSchema = z.object({
  name: z.string().min(2, "고객사명은 2자 이상이어야 합니다."),
  country: z.string().min(1, "국가를 입력하세요."),
  manager_id: z.string().min(1, "담당자를 선택하세요."),
  contact_number: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function ClientsManagement() {
  const { clients, managers, createClient } = useAppContext();
  const { translations } = useLanguage();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      country: "",
      manager_id: "",
      contact_number: "",
    },
  });

  const onSubmit = async (values: ClientFormValues) => {
    try {
      setIsSubmitting(true);
      await createClient({
        name: values.name,
        country: values.country,
        manager_id: values.manager_id,
        contact_number: values.contact_number,
      });
      toast.success(translations.clients?.clientAddSuccess || "고객사가 성공적으로 등록되었습니다.");
      form.reset();
      setIsCreateDialogOpen(false);
      // 목록 새로고침은 createClient 내부의 실시간 구독으로 자동 처리됨
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("고객사 등록 중 오류가 발생했습니다.");
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
              <CardTitle>{translations.global?.clientManagement || "고객사 관리"}</CardTitle>
              <CardDescription>{translations.global?.manageCorporationInfo || "고객사 정보를 관리합니다."}</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>{translations.global?.registerNewCorporation || "새 고객사 등록"}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{translations.global?.registerNewCorporation || "새 고객사 등록"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{translations.global?.corporationName || "고객사명"}</FormLabel>
                          <FormControl>
                            <Input placeholder={translations.global?.enterCorporationName || "고객사명을 입력하세요"} {...field} />
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
                          <FormLabel>{translations.global?.country || "국가"}</FormLabel>
                          <FormControl>
                            <Input placeholder={translations.global?.enterCountry || "국가를 입력하세요"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                                  {manager.name}
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
                      name="contact_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>연락처</FormLabel>
                          <FormControl>
                            <Input placeholder="연락처를 입력하세요" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (translations.global?.creating || "등록 중...") : (translations.global?.register || "등록")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder={translations.global?.searchCorporation || "고객사 검색..."}
              className="max-w-sm"
            />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="담당자 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 담당자</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.global?.corporationName || "고객사명"}</TableHead>
                  <TableHead>{translations.global?.country || "국가"}</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>{translations.global?.actions || "관리"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.country}</TableCell>
                    <TableCell>{client.manager?.name || '-'}</TableCell>
                    <TableCell>{client.contact_number || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          {translations.global?.modify || "수정"}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          {translations.global?.delete || "삭제"}
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
    </div>
  );
} 