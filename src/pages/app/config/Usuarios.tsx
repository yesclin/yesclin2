import { useState, useEffect } from "react";
import { 
  UserCog, Plus, Search, Edit, RotateCcw, ToggleLeft, ToggleRight, 
  Shield, AlertCircle, Crown, Loader2, Users, CheckCircle2, XCircle,
  Mail, Clock, Send, RefreshCw, X, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsManager } from "@/components/permissions/PermissionsManager";
import { UserAuditLog } from "@/components/config/UserAuditLog";
import { useClinicUsers, ClinicUser } from "@/hooks/useClinicUsers";
import { useUserInvitations } from "@/hooks/useUserInvitations";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  profissional: "Profissional",
  recepcionista: "Recepção",
};

const roleColors: Record<string, string> = {
  owner: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  admin: "bg-primary/10 text-primary border-primary/20",
  profissional: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  recepcionista: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const permissionLabels = [
  { key: "agenda", label: "Agenda" },
  { key: "atendimento", label: "Atendimento" },
  { key: "prontuario", label: "Prontuário" },
  { key: "pacientes", label: "Pacientes" },
  { key: "relatorios", label: "Relatórios" },
  { key: "controles", label: "Controles (Financeiro/Estoque)" },
];

export default function ConfigUsuarios() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newUserForm, setNewUserForm] = useState({
    full_name: "",
    email: "",
    userRole: "" as string,
  });

  const { 
    users, 
    currentUser, 
    clinicId,
    isLoading, 
    error,
    activeUsersCount, 
    maxUsers, 
    canCreateUser,
    isAdmin,
    isOwner,
    canManageUsers,
    toggleUserStatus,
    refetch,
  } = useClinicUsers();

  const {
    pendingInvitations,
    isSending,
    fetchInvitations,
    sendInvite,
    cancelInvite,
    resendInvite,
  } = useUserInvitations(clinicId);

  // Fetch invitations when clinicId is available
  useEffect(() => {
    if (clinicId) {
      fetchInvitations();
    }
  }, [clinicId, fetchInvitations]);

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key)
        ? prev.filter((p) => p !== key)
        : [...prev, key]
    );
  };

  const handleCreateUser = async () => {
    // Validate form
    if (!newUserForm.full_name || !newUserForm.email || !newUserForm.userRole) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserForm.email)) {
      toast.error("E-mail inválido");
      return;
    }

    const success = await sendInvite({
      email: newUserForm.email,
      fullName: newUserForm.full_name,
      role: newUserForm.userRole,
      permissions: selectedPermissions,
    });

    if (success) {
      setIsDialogOpen(false);
      setNewUserForm({ full_name: "", email: "", userRole: "" });
      setSelectedPermissions([]);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    await toggleUserStatus(userId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            Usuários & Permissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários e controle de acesso da clínica
          </p>
        </div>
        
        {currentUser && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <span>Você está logado como</span>
            <Badge variant="outline" className={roleColors[currentUser.role]}>
              {roleLabels[currentUser.role]}
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permissões por Módulo
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button disabled={!canCreateUser || !canManageUsers}>
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Usuário
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Novo Usuário</DialogTitle>
                          <DialogDescription>
                            Cadastre um novo usuário para a clínica. Limite: {maxUsers} usuários ativos.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Nome Completo *</Label>
                            <Input 
                              id="name" 
                              placeholder="Nome do usuário" 
                              value={newUserForm.full_name}
                              onChange={(e) => setNewUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="email">E-mail *</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              placeholder="email@exemplo.com" 
                              value={newUserForm.email}
                              onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="role">Perfil *</Label>
                            <Select
                              value={newUserForm.userRole}
                              onValueChange={(value) => setNewUserForm(prev => ({ ...prev, userRole: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o perfil" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="profissional">Profissional</SelectItem>
                                <SelectItem value="recepcionista">Recepção</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Administradores têm acesso total. Outros perfis podem ter permissões personalizadas.
                            </p>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Permissões Iniciais
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              {permissionLabels.map((perm) => (
                                <div key={perm.key} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={perm.key}
                                    checked={selectedPermissions.includes(perm.key)}
                                    onCheckedChange={() => togglePermission(perm.key)}
                                    disabled={newUserForm.userRole === "admin"}
                                  />
                                  <Label htmlFor={perm.key} className="text-sm font-normal cursor-pointer">
                                    {perm.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {newUserForm.userRole === "admin" && (
                              <p className="text-xs text-muted-foreground italic">
                                Administradores têm acesso total a todos os módulos.
                              </p>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSending}>
                            Cancelar
                          </Button>
                          <Button onClick={handleCreateUser} disabled={isSending}>
                            {isSending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Enviar Convite
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TooltipTrigger>
                {!canManageUsers && (
                  <TooltipContent>
                    <p>Apenas o proprietário pode criar usuários</p>
                  </TooltipContent>
                )}
                {!canCreateUser && canManageUsers && (
                  <TooltipContent>
                    <p>Limite de {maxUsers} usuários ativos atingido</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {!canCreateUser && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Limite de {maxUsers} usuários ativos atingido neste plano. 
                Desative um usuário para adicionar outro ou entre em contato para upgrade.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Convites Pendentes ({pendingInvitations.length})
                </CardTitle>
                <CardDescription>
                  Convites enviados aguardando aceitação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-500/10 p-2 rounded-full">
                          <Mail className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{invitation.full_name}</p>
                          <p className="text-xs text-muted-foreground">{invitation.email}</p>
                        </div>
                        <Badge variant="outline" className={roleColors[invitation.role]}>
                          {roleLabels[invitation.role]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Enviado {formatDistanceToNow(new Date(invitation.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resendInvite(invitation)}
                                disabled={isSending}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reenviar convite</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => cancelInvite(invitation.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancelar convite</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuário..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {activeUsersCount}/{maxUsers} ativos
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className={user.user_id === currentUser?.user_id ? "bg-primary/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              {user.is_primary_admin && (
                                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                                  <Crown className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {user.full_name}
                                {user.user_id === currentUser?.user_id && (
                                  <Badge variant="outline" className="text-[10px] h-4">
                                    Você
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email || "E-mail não disponível"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleColors[user.role]}>
                            {user.is_primary_admin && <Crown className="h-3 w-3 mr-1" />}
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={user.is_active 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : "bg-muted text-muted-foreground"
                            }
                          >
                            {user.is_active ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Inativo</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      disabled={!canManageUsers}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar usuário</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      disabled={!canManageUsers}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Redefinir senha</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {!user.is_primary_admin && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleToggleStatus(user.user_id)}
                                      disabled={!canManageUsers}
                                    >
                                      {user.is_active ? (
                                        <ToggleRight className="h-4 w-4 text-primary" />
                                      ) : (
                                        <ToggleLeft className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {user.is_active ? "Desativar" : "Ativar"} usuário
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {user.is_primary_admin && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="w-8 h-8 flex items-center justify-center">
                                      <Shield className="h-4 w-4 text-amber-500" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Administrador principal não pode ser desativado
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Owner info card */}
          {currentUser && isOwner && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Você é o Proprietário</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Como proprietário, você tem controle total do sistema e pode gerenciar 
                      todos os usuários e permissões da clínica. Este perfil não pode ser alterado ou desativado.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsManager />
        </TabsContent>

        <TabsContent value="audit">
          <UserAuditLog clinicId={clinicId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
