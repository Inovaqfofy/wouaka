import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react';
import { ROLE_CONFIG, ROLE_LABELS, DASHBOARD_ROUTES } from '@/lib/roles';

type UserMenuVariant = 'icon' | 'full';

interface UserMenuProps {
  variant?: UserMenuVariant;
}

export const UserMenu = ({ variant = 'icon' }: UserMenuProps) => {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const config = role ? ROLE_CONFIG[role] : null;
  const RoleIcon = config?.icon || User;
  const roleLabel = role ? ROLE_LABELS[role] : '';
  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDashboard = () => {
    if (role) {
      navigate(DASHBOARD_ROUTES[role]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            variant === 'full'
              ? 'h-10 px-2 rounded-lg flex items-center gap-2'
              : 'relative h-10 w-10 rounded-full'
          }
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          {variant === 'full' && (
            <>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-sm font-medium">{profile?.full_name || 'Utilisateur'}</span>
                <span className="text-xs text-muted-foreground">{roleLabel}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">
              {profile?.full_name || 'Utilisateur'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {role && config && (
              <Badge variant="outline" className="w-fit mt-1">
                <RoleIcon className="w-3 h-3 mr-1" />
                {roleLabel}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDashboard}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Tableau de bord</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Mon profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
