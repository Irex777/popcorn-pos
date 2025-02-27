import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { languages, languageAtom, currencies, currencyAtom } from '@/lib/settings';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import i18n from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { insertUserSchema } from '@shared/schema';

export default function Settings() {
  const { t } = useTranslation();
  const [language, setLanguage] = useAtom(languageAtom);
  const [currency, setCurrency] = useAtom(currencyAtom);
  const { toast } = useToast();

  // Get current user details
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user']
  });

  // Get all users if admin
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: currentUser?.isAdmin,
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('settings.userCreated'),
        description: t('settings.userCreatedSuccess'),
      });
      // Reset form
      const form = document.getElementById('createUserForm') as HTMLFormElement;
      if (form) form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.userCreationFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('settings.passwordChanged'),
        description: t('settings.passwordChangeSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.passwordChangeFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    i18n.changeLanguage(value);
  };

  const handleCurrencyChange = (value: string) => {
    const selectedCurrency = currencies.find(c => c.code === value);
    if (selectedCurrency) {
      setCurrency(selectedCurrency);
    }
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      toast({
        title: t('settings.passwordMismatch'),
        description: t('settings.passwordsMustMatch'),
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-6">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold"
      >
        {t('settings.title')}
      </motion.h2>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.account')}</CardTitle>
            <CardDescription>{t('settings.accountDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>{t('settings.username')}</Label>
              <p className="text-sm text-muted-foreground">{currentUser?.username}</p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                />
              </div>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {t('settings.changePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Management Section - Only visible to admins */}
        {currentUser?.isAdmin && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.userManagement')}</CardTitle>
                <CardDescription>{t('settings.userManagementDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create User Form */}
                <form
                  id="createUserForm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const username = formData.get('username') as string;
                    const password = formData.get('password') as string;

                    try {
                      const parsed = insertUserSchema.parse({ username, password });
                      createUserMutation.mutate(parsed);
                    } catch (error) {
                      if (error instanceof Error) {
                        toast({
                          title: t('settings.validationError'),
                          description: error.message,
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('settings.newUsername')}</Label>
                    <Input
                      id="username"
                      name="username"
                      required
                      minLength={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('settings.newPassword')}</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={createUserMutation.isPending}
                    className="w-full"
                  >
                    {createUserMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {t('settings.createUser')}
                  </Button>
                </form>

                {/* User List */}
                <div className="space-y-2">
                  <h3 className="font-medium">{t('settings.userList')}</h3>
                  {usersLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {users?.map(user => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 rounded-md bg-muted"
                        >
                          <span className="font-medium">{user.username}</span>
                          {user.isAdmin && (
                            <span className="text-sm text-muted-foreground">
                              {t('settings.adminUser')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Separator />

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.preferences')}</CardTitle>
            <CardDescription>{t('settings.preferencesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.language')}</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('settings.currency')}</Label>
              <Select value={currency.code} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(curr => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}