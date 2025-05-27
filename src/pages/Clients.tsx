import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Search, Building, Users, Briefcase, Pencil, Trash2, Flag, Info, Link,
  Globe, Mail, Phone, MapPin, Calendar, TrendingUp, Award, Sparkles,
  Building2, UserCheck, FileText, ExternalLink, Star, Grid3x3, List, AlertCircle
} from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Client } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const clientFormSchema = z.object({
  name: z.string().min(1, { message: "고객사명은 필수입니다." }),
  picId: z.string().min(1, { message: "담당자(PIC)를 선택해주세요." }),
  country: z.string().min(1, { message: "국가는 필수입니다." }),
  contactEmail: z.string().email({ message: "유효한 이메일 주소를 입력하세요." }).optional().or(z.string().length(0)),
  salesRepId: z.string().optional(),
  requirements: z.string().optional(),
  homepage: z.string().optional(),
  flag: z.string().optional(),
  remark: z.string().optional(),
  files: z.array(z.string()).optional()
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const Clients = () => {
  const { clients, projects, managers, addClient, updateClient, removeClient } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { translations } = useLanguage();
  
  // 디버깅을 위한 로그 추가
  console.log("Clients component - clients array:", clients);
  console.log("Clients component - clients length:", clients.length);
  console.log("Clients component - managers array:", managers);
  
  // Get users who can be PICs
  const salesManagers = managers.filter(manager => manager.department?.name === '영업');
  
  // Client form
  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      picId: "",
      country: "kr",
      contactEmail: "",
      salesRepId: "",
      requirements: "",
      homepage: "",
      flag: "",
      remark: "",
      files: []
    }
  });
  
  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.contactPerson && client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle edit client
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditing(true);
    
    // Find PIC id based on contact person name
    const picUser = managers.find(manager => manager.name === client.contactPerson);
    
    clientForm.reset({
      name: client.name,
      picId: picUser?.id || "",
      country: client.country || "kr",
      contactEmail: client.contactEmail || "",
      salesRepId: client.salesRepId || "",
      requirements: client.requirements ?? "",
      homepage: client.homepage ?? "",
      flag: client.flag ?? "",
      remark: client.remark ?? "",
      files: client.files ?? []
    });
    setIsClientDialogOpen(true);
  };

  // Handle delete client
  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete client
  const confirmDeleteClient = async () => {
    if (!selectedClient) return;
    
    try {
      await removeClient(selectedClient.id);
      toast({
        title: "고객사 삭제 완료",
        description: `${selectedClient.name} 고객사가 삭제되었습니다.`
      });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "고객사 삭제 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitClient = async (values: ClientFormValues) => {
    try {
      // Find selected PIC user
      const picUser = managers.find(manager => manager.id === values.picId);
      
      if (isEditing && selectedClient) {
        // Update existing client
        const updatedClient: Partial<Client> = {
          name: values.name,
          contact_person: picUser?.name || "",
          contactPerson: picUser?.name || "",
          country: values.country,
          contact_email: values.contactEmail || "",
          contactEmail: values.contactEmail || "",
          sales_rep_id: values.salesRepId || "",
          salesRepId: values.salesRepId || "",
          salesRepName: managers.find(u => u.id === values.salesRepId)?.name || "",
          requirements: values.requirements || "",
          homepage: values.homepage || "",
          flag: values.flag || "",
          remark: values.remark || "",
          files: values.files || [],
          updatedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        await updateClient(selectedClient.id, updatedClient);
        toast({
          title: "고객사 수정 완료",
          description: `${selectedClient.name} 고객사 정보가 성공적으로 수정되었습니다.`
        });
        setIsClientDialogOpen(false);
        setIsEditing(false);
        setSelectedClient(null);
        clientForm.reset();
      } else {
        // Create a new client
        const newClient = {
          name: values.name,
          contact_person: picUser?.name || "",
          contactPerson: picUser?.name || "",
          country: values.country,
          contact_email: values.contactEmail || "",
          contactEmail: values.contactEmail || "",
          email: values.contactEmail || "",
          sales_rep_id: values.salesRepId || "",
          salesRepId: values.salesRepId || "",
          salesRepName: managers.find(u => u.id === values.salesRepId)?.name || "",
          requirements: values.requirements || "",
          homepage: values.homepage || "",
          flag: values.flag || "",
          remark: values.remark || "",
          files: values.files || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        await addClient(newClient);
        toast({
          title: "고객사 등록 완료",
          description: `${newClient.name} 고객사가 성공적으로 등록되었습니다.`
        });
        setIsClientDialogOpen(false);
        clientForm.reset();
      }
    } catch (error) {
      console.error("Error submitting client:", error);
      toast({
        title: "오류 발생",
        description: "고객사 등록/수정 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    }
  };
  
  // 담당자 선택 시 이메일 자동 입력 함수 추가
  const handlePicChange = (id: string) => {
    const selected = managers.find(manager => manager.id === id);
    clientForm.setValue('picId', id);
    clientForm.setValue('contactEmail', selected?.email || '');
  };

  // 고객사 통계
  const stats = {
    totalClients: clients.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalProjects: projects.length,
    totalPartners: 0 // 협업사 데이터가 구현되면 업데이트
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      kr: '🇰🇷',
      us: '🇺🇸',
      jp: '🇯🇵',
      cn: '🇨🇳',
      de: '🇩🇪',
      fr: '🇫🇷',
      gb: '🇬🇧',
    };
    return flags[country.toLowerCase()] || '🌍';
  };

  const ClientCard = ({ client }: { client: Client }) => {
    const clientProjects = projects.filter(p => p.clientId === client.id);
    const activeProjects = clientProjects.filter(p => p.status === 'active');
    
    return (
      <Card className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:scale-110 transition-transform">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                  {client.name}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {getCountryFlag(client.country || 'kr')} {client.country?.toUpperCase() || 'KR'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                onClick={() => handleEditClient(client)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30"
                onClick={() => handleDeleteClient(client)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">담당자:</span>
              <span className="font-medium">{client.contactPerson}</span>
            </div>

            {client.contactEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.contactEmail}`} className="text-blue-600 hover:underline">
                  {client.contactEmail}
                </a>
              </div>
            )}

            {client.homepage && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={client.homepage.startsWith('http') ? client.homepage : `https://${client.homepage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  홈페이지 <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{clientProjects.length}</p>
                    <p className="text-xs text-muted-foreground">전체 프로젝트</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{activeProjects.length}</p>
                    <p className="text-xs text-muted-foreground">진행중</p>
                  </div>
                </div>
                <RouterLink to={`/clients/${client.id}`}>
                  <Button variant="ghost" size="sm" className="hover:bg-primary hover:text-primary-foreground">
                    상세보기
                    <Sparkles className="h-3 w-3 ml-1" />
                  </Button>
                </RouterLink>
              </div>
            </div>
          </div>

          {/* 플래그 및 비고 */}
          {(client.flag || client.remark) && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {client.flag && (
                <div className="flex items-start gap-2">
                  <Flag className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span className="text-sm">{client.flag}</span>
                </div>
              )}
              {client.remark && (
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{client.remark}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* 호버 효과 */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Building className="h-6 w-6 text-white" />
                </div>
                {translations.clients?.title || "고객사 & 협업사 관리"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {translations.clients?.description || "고객사 및 협업 업체 정보 관리"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                onClick={() => setIsPartnerDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {translations.clients?.newPartner || "새 협업사"}
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedClient(null);
                  clientForm.reset({
                    name: "",
                    picId: "",
                    country: "kr",
                    contactEmail: "",
                    salesRepId: "",
                    requirements: "",
                    homepage: "",
                    flag: "",
                    remark: "",
                    files: []
                  });
                  setIsClientDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {translations.clients?.new || "새 고객사"}
              </Button>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">전체 고객사</p>
                    <p className="text-3xl font-bold">{stats.totalClients}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/10 to-green-600/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">진행중 프로젝트</p>
                    <p className="text-3xl font-bold">{stats.activeProjects}</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500/20">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">전체 프로젝트</p>
                    <p className="text-3xl font-bold">{stats.totalProjects}</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500/20">
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500/10 to-pink-600/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">협업사</p>
                    <p className="text-3xl font-bold">{stats.totalPartners}</p>
                  </div>
                  <div className="p-3 rounded-full bg-pink-500/20">
                    <Users className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="clients" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="h-12 p-1.5 bg-white dark:bg-slate-800 shadow-lg border-0">
              <TabsTrigger 
                value="clients"
                className={cn(
                  "h-9 px-6 font-medium transition-all duration-200",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500",
                  "data-[state=active]:text-white data-[state=active]:shadow-lg"
                )}
              >
                <Building className="mr-2 h-4 w-4" />
                {translations.clients?.clientList || "고객사"}
              </TabsTrigger>
              <TabsTrigger 
                value="partners"
                className={cn(
                  "h-9 px-6 font-medium transition-all duration-200",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500",
                  "data-[state=active]:text-white data-[state=active]:shadow-lg"
                )}
              >
                <Users className="mr-2 h-4 w-4" />
                {translations.clients?.partnersList || "협업사"}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
              {/* 검색 */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={translations.clients?.searchClientOrRep || "고객사 검색..."}
                  className="pl-10 bg-white dark:bg-slate-800 border-0 shadow-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* 뷰 모드 전환 */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg shadow-md p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3",
                    viewMode === 'grid' && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3",
                    viewMode === 'table' && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <TabsContent value="clients" className="space-y-4">
            {viewMode === 'grid' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-0">
                  <div className="rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                          <TableHead>{translations.clients?.name || "고객사명"}</TableHead>
                          <TableHead>{translations.clients?.contactPerson || "담당자(PIC)"}</TableHead>
                          <TableHead>Flag</TableHead>
                          <TableHead>Remark</TableHead>
                          <TableHead>Homepage</TableHead>
                          <TableHead>{translations.projects?.title || "프로젝트"}</TableHead>
                          <TableHead className="text-right">{translations.global?.actions || "관리"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map((client) => {
                          const clientProjects = projects.filter(p => p.clientId === client.id);
                          return (
                            <TableRow key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-blue-500" />
                                  {client.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4 text-green-500" />
                                  {client.contactPerson}
                                </div>
                              </TableCell>
                              <TableCell>
                                {client.flag && (
                                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                    <Flag className="h-3 w-3" />
                                    {client.flag}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {client.remark && (
                                  <div className="flex items-center gap-1">
                                    <Info className="h-3 w-3 text-gray-500" />
                                    <span className="text-sm line-clamp-1">{client.remark}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {client.homepage && (
                                  <a href={client.homepage.startsWith('http') ? client.homepage : `https://${client.homepage}`} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="flex items-center text-blue-500 hover:underline">
                                    <Link className="h-4 w-4 mr-1" />
                                    <span className="text-sm">링크</span>
                                  </a>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                  <Briefcase className="h-3 w-3" />
                                  {clientProjects.length}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                    onClick={() => handleEditClient(client)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30"
                                    onClick={() => handleDeleteClient(client)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                  <RouterLink to={`/clients/${client.id}`}>
                                    <Button variant="ghost" size="sm" className="h-8 px-3">
                                      상세보기 <ExternalLink className="h-3 w-3 ml-1" />
                                    </Button>
                                  </RouterLink>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        
                        {filteredClients.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <Building2 className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                <p className="text-muted-foreground">
                                  {clients.length === 0 ? "등록된 고객사가 없습니다." : "검색 결과가 없습니다."}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* 고객사 프로젝트 현황 */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {translations.clients?.clientProjects || "고객사별 프로젝트 현황"}
                </CardTitle>
                <CardDescription className="text-white/80">
                  {translations.clients?.clientProjectDescription || "각 고객사별 프로젝트 진행 상황을 보여줍니다."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {clients.slice(0, 3).map((client) => {
                    const clientProjects = projects.filter(p => p.clientId === client.id);
                    const activeProjects = clientProjects.filter(p => p.status === 'active');
                    const completedProjects = clientProjects.filter(p => p.status === 'completed');
                    
                    return (
                      <div key={client.id} className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-slate-800">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-500" />
                            {client.name}
                          </h3>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            프로젝트 {clientProjects.length}개
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <p className="text-2xl font-bold text-blue-600">{activeProjects.length}</p>
                            <p className="text-xs text-muted-foreground">진행중</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <p className="text-2xl font-bold text-green-600">{completedProjects.length}</p>
                            <p className="text-xs text-muted-foreground">완료</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                            <p className="text-sm font-medium text-purple-600">
                              {managers.find(u => u.id === client.salesRepId)?.name || '미배정'}
                            </p>
                            <p className="text-xs text-muted-foreground">담당자</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="partners" className="space-y-4">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  협업사 목록
                </CardTitle>
                <CardDescription className="text-white/80">
                  프로젝트 협업사 목록을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-16 text-center">
                  <div className="relative">
                    <Users className="mx-auto h-20 w-20 text-muted-foreground/20 mb-6" />
                    <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-purple-500 to-pink-500 pointer-events-none" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">협업사 데이터 없음</h3>
                  <p className="text-muted-foreground mb-6">아직 등록된 협업사가 없습니다. 새로운 협업사를 추가해 주세요.</p>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
                    onClick={() => setIsPartnerDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    {translations.clients?.newPartner || "새 협업사 등록"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      
        {/* 고객사 생성/수정 다이얼로그 */}
        <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                {isEditing ? "고객사 정보 수정" : (translations.clients?.new || "새 고객사 등록")}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...clientForm}>
              <form onSubmit={clientForm.handleSubmit(handleSubmitClient)} className="space-y-4 py-4">
                <FormField
                  control={clientForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        {translations.clients?.name || "고객사명"} 
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="고객사 이름" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={clientForm.control}
                    name="picId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          {translations.clients?.contactPerson || "담당자(PIC)"} 
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={handlePicChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="담당자 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salesManagers.map(manager => (
                              <SelectItem key={manager.id} value={manager.id}>
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4" />
                                  {manager.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translations.clients?.contactEmail || "담당자 이메일"}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} type="email" placeholder="이메일 주소" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={clientForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        국가 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="국가를 입력하세요" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={clientForm.control}
                  name="homepage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>홈페이지</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="https://example.com" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={clientForm.control}
                    name="flag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flag</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} placeholder="중요 정보 플래그" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={clientForm.control}
                    name="remark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remark</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Info className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} placeholder="간단한 비고" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={clientForm.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translations.clients?.requirements || "주요 요구사항"}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="고객사 요구사항 및 특이사항" 
                          className="min-h-[100px] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="files"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>파일 업로드</FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <Input 
                            type="file" 
                            multiple 
                            onChange={e => field.onChange(e.target.files)} 
                            className="hidden"
                            id="file-upload"
                          />
                          <Label htmlFor="file-upload" className="cursor-pointer text-sm text-muted-foreground hover:text-primary">
                            클릭하여 파일 선택
                          </Label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsClientDialogOpen(false)}>
                    {translations.global?.cancel || "취소"}
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    {isEditing ? "수정" : (translations.global?.save || "저장")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* 협업사 생성 다이얼로그 */}
        <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                새 협업사 등록
              </DialogTitle>
            </DialogHeader>
            
            <form className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="partnerName">협업사명</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="partnerName" placeholder="협업사 이름" className="pl-10" />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="partnerType">유형</Label>
                <Select defaultValue="supplier">
                  <SelectTrigger id="partnerType" className="w-full">
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        공급업체
                      </div>
                    </SelectItem>
                    <SelectItem value="manufacturer">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        제조사
                      </div>
                    </SelectItem>
                    <SelectItem value="consultant">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        컨설턴트
                      </div>
                    </SelectItem>
                    <SelectItem value="service">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        서비스 제공자
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="contactName">담당자 이름</Label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="contactName" placeholder="담당자 이름" className="pl-10" />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="contactEmail">담당자 이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="contactEmail" type="email" placeholder="이메일 주소" className="pl-10" />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="note">비고</Label>
                <Textarea 
                  id="note" 
                  placeholder="협업사 관련 비고사항" 
                  className="min-h-[100px] resize-none"
                />
              </div>
              
              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsPartnerDialogOpen(false)}>
                  취소
                </Button>
                <Button 
                  type="submit" 
                  onClick={() => setIsPartnerDialogOpen(false)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  저장
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* 고객사 삭제 확인 다이얼로그 */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                고객사 삭제
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>{selectedClient?.name} 고객사를 삭제하시겠습니까?</p>
                <p className="text-red-600 font-medium">
                  ⚠️ 이 작업은 되돌릴 수 없으며, 관련된 모든 데이터가 삭제될 수 있습니다.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteClient} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Clients;
