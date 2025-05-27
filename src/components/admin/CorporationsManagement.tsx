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
import { Corporation, CreateCorporationInput } from "@/types";
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
import { useLanguage } from "@/context/LanguageContext";

const corporationFormSchema = z.object({
  name: z.string().min(2, "법인명은 2자 이상이어야 합니다."),
  code: z.string().min(2, "코드는 2자 이상이어야 합니다."),
  country: z.string().min(1, "국가를 입력하세요."),
  type: z.enum(["headquarters", "sales", "factory"], {
    required_error: "법인 유형을 선택하세요.",
  }),
});

type CorporationFormValues = z.infer<typeof corporationFormSchema>;

export default function CorporationsManagement() {
  const { corporations, createCorporation, updateCorporation, deleteCorporation } = useAppContext();
  const { translations } = useLanguage();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCorporation, setSelectedCorporation] = useState<Corporation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CorporationFormValues>({
    resolver: zodResolver(corporationFormSchema),
    defaultValues: {
      name: "",
      code: "",
      country: "",
      type: "headquarters",
    },
  });

  const handleEdit = (corporation: Corporation) => {
    setSelectedCorporation(corporation);
    form.reset({
      name: corporation.name,
      code: corporation.code,
      country: corporation.country,
      type: corporation.type,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (corporation: Corporation) => {
    setSelectedCorporation(corporation);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: CorporationFormValues) => {
    try {
      setIsSubmitting(true);
      if (selectedCorporation) {
        await updateCorporation(selectedCorporation.id, data);
      } else {
        const corporationData: CreateCorporationInput = {
          name: data.name,
          code: data.code,
          country: data.country,
          type: data.type
        };
        await createCorporation(corporationData);
      }
      form.reset();
      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error saving corporation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!selectedCorporation) return;
    try {
      setIsSubmitting(true);
      await deleteCorporation(selectedCorporation.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting corporation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "headquarters":
        return translations.global?.headquarters || "본사";
      case "sales":
        return translations.global?.salesOffice || "영업소";
      case "factory":
        return translations.global?.factory || "공장";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{translations.global?.corporationManagement || "법인 관리"}</CardTitle>
              <CardDescription>{translations.global?.manageCorporationInfo || "법인 정보를 관리합니다."}</CardDescription>
            </div>
            <Button onClick={() => {
              form.reset();
              setSelectedCorporation(null);
              setIsCreateDialogOpen(true);
            }}>
              {translations.global?.registerNewCorporation || "새 법인 등록"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder={translations.global?.searchCorporation || "법인 검색..."}
              className="max-w-sm"
            />
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={translations.global?.corporationType || "법인 유형"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.global?.all || "전체"}</SelectItem>
                <SelectItem value="headquarters">{translations.global?.headquarters || "본사"}</SelectItem>
                <SelectItem value="sales">{translations.global?.salesOffice || "영업소"}</SelectItem>
                <SelectItem value="factory">{translations.global?.factory || "공장"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.global?.corporationName || "법인명"}</TableHead>
                  <TableHead>{translations.global?.code || "코드"}</TableHead>
                  <TableHead>{translations.global?.country || "국가"}</TableHead>
                  <TableHead>{translations.global?.type || "유형"}</TableHead>
                  <TableHead>{translations.global?.management || "관리"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corporations.map((corporation) => (
                  <TableRow key={corporation.id}>
                    <TableCell>{corporation.name}</TableCell>
                    <TableCell>{corporation.code}</TableCell>
                    <TableCell>{corporation.country}</TableCell>
                    <TableCell>{getTypeLabel(corporation.type)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(corporation)}
                        >
                          {translations.global?.modify || "수정"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => handleDelete(corporation)}
                        >
                          {translations.global?.remove || "삭제"}
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
              {selectedCorporation ? 
                (translations.global?.modifyCorporation || "법인 수정") : 
                (translations.global?.registerNewCorporation || "새 법인 등록")
              }
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.global?.corporationName || "법인명"}</FormLabel>
                    <FormControl>
                      <Input placeholder={translations.global?.enterCorporationName || "법인명을 입력하세요"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.global?.code || "코드"}</FormLabel>
                    <FormControl>
                      <Input placeholder={translations.global?.enterCode || "코드를 입력하세요"} {...field} />
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.global?.corporationType || "법인 유형"}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.global?.selectCorporationType || "법인 유형을 선택하세요"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="headquarters">{translations.global?.headquarters || "본사"}</SelectItem>
                        <SelectItem value="sales">{translations.global?.salesOffice || "영업소"}</SelectItem>
                        <SelectItem value="factory">{translations.global?.factory || "공장"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 
                    (translations.global?.saving || "저장 중...") : 
                    (selectedCorporation ? 
                      (translations.global?.modify || "수정") : 
                      (translations.global?.register || "등록")
                    )
                  }
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
            <AlertDialogTitle>{translations.global?.deleteCorporation || "법인 삭제"}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.global?.confirmDeleteCorporation || "정말로 이 법인을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.global?.cancel || "취소"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? 
                (translations.global?.deleting || "삭제 중...") : 
                (translations.global?.remove || "삭제")
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 