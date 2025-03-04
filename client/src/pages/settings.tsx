import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import { languages, languageAtom, currencies, currencyAtom } from "@/lib/settings";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Loader2, Pencil, TestTube } from "lucide-react";
import i18n from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, type User } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useShop } from "@/lib/shop-context";

export default function Settings() {
  const { t } = useTranslation();
  const [language, setLanguage] = useAtom(languageAtom);
  const [currency, setCurrency] = useAtom(currencyAtom);
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<{ id: number; username: string } | null>(null);
  const [editingShop, setEditingShop] = useState<{ id: number; name: string; address?: string } | null>(null);
  const { user } = useAuth();
  const { shops, setCurrentShop } = useShop();

  // Get all users if admin
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: user?.isAdmin,
  });

  // Create new shop mutation
  const createShopMutation = useMutation({
    mutationFn: async (data: { name: string; address?: string }) => {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          address: data.address?.trim() || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('common.shop.createError'));
      }

      return response.json();
    },
    onSuccess: (shop) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      setCurrentShop(shop);
      toast({
        title: t('common.shop.created'),
        description: t('common.shop.createSuccess'),
      });
      // Reset form
      const form = document.getElementById('createShopForm') as HTMLFormElement;
      if (form) form.reset();
    },
    onError: (error: Error) => {
      console.error('Shop creation error:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit shop mutation
  const editShopMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; address?: string }) => {
      const response = await fetch(`/api/shops/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Only send name and address
        body: JSON.stringify({
          name: data.name,
          address: data.address || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('common.shop.updateError'));
      }

      return response.json();
    },
    onSuccess: (shop) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      setEditingShop(null);
      toast({
        title: t('common.shop.updated'),
        description: t('common.shop.updateSuccess'),
      });
    },
    onError: (error: Error) => {
      console.error('Shop update error:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Keep existing mutations and handlers
  const editUserMutation = useMutation({
    mutationFn: async (data: { id: number; username?: string; password?: string }) => {
      const response = await fetch(`/api/users/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditingUser(null);
      toast({
        title: t('settings.userUpdated'),
        description: t('settings.userUpdateSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.userUpdateFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  // Keep other existing mutations and handlers...
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
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
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
        {/* Shop Management Section - Only visible to admins */}
        {user?.isAdmin && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('common.shops')}</CardTitle>
                <CardDescription>{t('settings.shopManagementDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create Shop Form */}
                <form
                  id="createShopForm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get('name') as string;
                    const address = formData.get('address') as string;

                    if (!name.trim()) {
                      toast({
                        title: t('settings.validationError'),
                        description: t('common.shop.nameRequired'),
                        variant: "destructive",
                      });
                      return;
                    }

                    createShopMutation.mutate({ name, address });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('common.shop.name')}</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">{t('common.shop.address')}</Label>
                    <Input
                      id="address"
                      name="address"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createShopMutation.isPending}
                    className="w-full"
                  >
                    {createShopMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {t('common.shop.create')}
                  </Button>
                </form>

                {/* Shop List */}
                <div className="space-y-2">
                  <h3 className="font-medium">{t('common.shops')}</h3>
                  <div className="space-y-2">
                    {shops?.map(shop => (
                      <div
                        key={shop.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted"
                      >
                        <div>
                          <span className="font-medium">{shop.name}</span>
                          {shop.address && (
                            <p className="text-sm text-muted-foreground">{shop.address}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingShop({ id: shop.id, name: shop.name, address: shop.address })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />
          </>
        )}

        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.account')}</CardTitle>
            <CardDescription>{t('settings.accountDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>{t('settings.username')}</Label>
              <p className="text-sm text-muted-foreground">{user?.username}</p>
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
        {user?.isAdmin && (
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
                          <div className="flex items-center gap-2">
                            {user.isAdmin && (
                              <span className="text-sm text-muted-foreground">
                                {t('settings.adminUser')}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUser({ id: user.id, username: user.username })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
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

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('settings.editUser')}</DialogTitle>
              <DialogDescription>
                {t('settings.editUserDescription')}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingUser) return;

                const formData = new FormData(e.currentTarget);
                const username = formData.get('username') as string;
                const password = formData.get('password') as string;

                const updates: { id: number; username?: string; password?: string } = {
                  id: editingUser.id,
                };

                if (username && username !== editingUser.username) {
                  updates.username = username;
                }

                if (password) {
                  updates.password = password;
                }

                if (Object.keys(updates).length > 1) {
                  editUserMutation.mutate(updates);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-username">{t('settings.username')}</Label>
                <Input
                  id="edit-username"
                  name="username"
                  defaultValue={editingUser?.username}
                  minLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">{t('settings.newPassword')}</Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  placeholder={t('settings.leaveBlankPassword')}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={editUserMutation.isPending}
                >
                  {editUserMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Shop Dialog */}
        <Dialog open={!!editingShop} onOpenChange={(open) => !open && setEditingShop(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('common.shop.edit')}</DialogTitle>
              <DialogDescription>
                {t('settings.shopEditDescription')}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingShop) return;

                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const address = formData.get('address') as string;

                if (!name.trim()) {
                  toast({
                    title: t('settings.validationError'),
                    description: t('common.shop.nameRequired'),
                    variant: "destructive",
                  });
                  return;
                }

                editShopMutation.mutate({
                  id: editingShop.id,
                  name: name.trim(),
                  address: address.trim() || undefined
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t('common.shop.name')}</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingShop?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">{t('common.shop.address')}</Label>
                <Input
                  id="edit-address"
                  name="address"
                  defaultValue={editingShop?.address || ''}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingShop(null)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={editShopMutation.isPending}
                >
                  {editShopMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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

        <Separator />

        {/* System Test Section - Only visible to admins */}
        {user?.isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.systemTest')}</CardTitle>
              <CardDescription>{t('settings.systemTestDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={async () => {
                    try {
                      toast({
                        title: t('settings.testStarted'),
                        description: t('settings.testInProgress'),
                      });

                      // Run system test
                      const response = await apiRequest('POST', '/api/system-test');
                      const results = await response.json();

                      // Show results
                      if (results.success) {
                        toast({
                          title: t('settings.testSuccess'),
                          description: results.message,
                        });
                      } else {
                        toast({
                          title: t('settings.testFailed'),
                          description: results.error,
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error('System test error:', error);
                      toast({
                        title: t('settings.testFailed'),
                        description: error instanceof Error ? error.message : 'Unknown error',
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {t('settings.runSystemTest')}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {t('settings.systemTestNote')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}