import { useState } from "react";
import { 
  Search, 
  Filter,
  UserPlus,
  MoreHorizontal,
  Shield,
  Ban,
  CheckCircle,
  UserCog,
  CreditCard
} from "lucide-react";
import { InviteUserDialog } from "@/components/admin/InviteUserDialog";
import { ManualSubscriptionDialog } from "@/components/admin/ManualSubscriptionDialog";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAllUsers, useUpdateUserRole, useToggleUserStatus } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { 
  ALL_ROLES,
  INVITABLE_ROLES, 
  ROLE_LABELS, 
  ROLE_DESCRIPTIONS, 
  ROLE_CONFIG,
  type AppRole 
} from "@/lib/roles";

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; email: string; fullName: string | null; currentRole: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("PARTENAIRE");
  const [grantPlanUser, setGrantPlanUser] = useState<{ id: string; email: string; fullName: string | null } | null>(null);
  
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useAllUsers();
  const updateRoleMutation = useUpdateUserRole();
  const toggleStatusMutation = useToggleUserStatus();

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.company?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  const handleOpenRoleDialog = (user: { id: string; email: string; fullName: string | null; role: string }) => {
    setEditingUser({ id: user.id, email: user.email, fullName: user.fullName, currentRole: user.role });
    setSelectedRole(user.role as AppRole);
  };

  const handleUpdateRole = () => {
    if (editingUser) {
      updateRoleMutation.mutate({ userId: editingUser.id, newRole: selectedRole });
      setEditingUser(null);
    }
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  // Stats calculations
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(u => u.isActive).length || 0;
  const partnerUsers = users?.filter(u => u.role === "PARTENAIRE" || u.role === "ENTREPRISE" || u.role === "ANALYSTE" || u.role === "API_CLIENT").length || 0;
  const borrowerUsers = users?.filter(u => u.role === "EMPRUNTEUR").length || 0;

  return (
    <DashboardLayout role="admin" title="Gestion des utilisateurs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {ALL_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Inviter un utilisateur
          </Button>
        </div>

        <InviteUserDialog 
          open={inviteDialogOpen} 
          onOpenChange={setInviteDialogOpen}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-sm text-muted-foreground">Total utilisateurs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">
                {activeUsers}
              </div>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {partnerUsers}
              </div>
              <p className="text-sm text-muted-foreground">Partenaires</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-secondary">
                {borrowerUsers}
              </div>
              <p className="text-sm text-muted-foreground">Emprunteurs</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Liste des utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const roleConfig = ROLE_CONFIG[user.role as AppRole] || ROLE_CONFIG.PARTENAIRE;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.fullName || "—"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{user.company || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={roleConfig.variant}>
                            {ROLE_LABELS[user.role as AppRole] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <Ban className="w-3 h-3" />
                              Inactif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleOpenRoleDialog(user)}
                                disabled={user.id === currentUser?.id}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Modifier le rôle
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setGrantPlanUser({
                                  id: user.id,
                                  email: user.email,
                                  fullName: user.fullName,
                                })}
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Attribuer un forfait
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(user.id, user.isActive)}
                                disabled={user.id === currentUser?.id}
                                className={user.isActive ? "text-destructive focus:text-destructive" : "text-success focus:text-success"}
                              >
                                {user.isActive ? (
                                  <>
                                    <Ban className="w-4 h-4 mr-2" />
                                    Désactiver le compte
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Activer le compte
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Modifier le rôle
            </DialogTitle>
            <DialogDescription>
              Changer le rôle de {editingUser?.fullName || editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rôle actuel</Label>
              <Badge 
                variant={ROLE_CONFIG[editingUser?.currentRole as AppRole]?.variant || "outline"} 
                className="text-sm"
              >
                {ROLE_LABELS[editingUser?.currentRole as AppRole] || editingUser?.currentRole}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-role">Nouveau rôle</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{ROLE_LABELS[role]}</span>
                        <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRole === "SUPER_ADMIN" && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                <strong>Attention :</strong> Le rôle Super Admin donne un accès complet à toutes les fonctionnalités d'administration.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending || selectedRole === editingUser?.currentRole}
            >
              {updateRoleMutation.isPending ? "Mise à jour..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Subscription Dialog */}
      <ManualSubscriptionDialog 
        open={!!grantPlanUser}
        onOpenChange={(open) => !open && setGrantPlanUser(null)}
        preselectedUser={grantPlanUser}
      />
    </DashboardLayout>
  );
};

export default AdminUsers;
