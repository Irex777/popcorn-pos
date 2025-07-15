import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import { languages, languageAtom, currencies, currencyAtom } from "@/lib/settings";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Loader2, Pencil, TestTube, Trash2 } from "lucide-react";
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
import { insertUserSchema, type User, type StripeSettings } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useShop } from "@/lib/shop-context";
import { useUserPreferences } from "@/hooks/use-preferences";

export default function Settings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<{ id: number; username: string; isAdmin?: boolean } | null>(null);
  const [editingShop, setEditingShop] = useState<{ id: number; name: string; address?: string | null; businessMode?: string } | null>(null);
  const [deletingShop, setDeletingShop] = useState<{ id: number; name: string; requiresConfirmation?: boolean; dataToBeDeleted?: any } | null>(null);
  const [confirmationName, setConfirmationName] = useState('');
  const { user } = useAuth();
  const { shops, currentShop, setCurrentShop } = useShop();
  const { language, currency, updateLanguage, updateCurrency, isUpdating } = useUserPreferences();

  // Get stripe settings for current shop
  const { data: stripeSettings } = useQuery<StripeSettings>({
    queryKey: [`/api/shops/${currentShop?.id}/stripe-settings`],
    enabled: !!currentShop?.id && user?.isAdmin,
  });

  // Get all users if admin
  const { data: users, isLoading: usersLoading } = useQuery<(User & { shopIds?: number[] })[]>({
    queryKey: ['/api/users'],
    enabled: user?.isAdmin,
    select: (data) => data?.map(user => ({ // Ensure shopIds is always an array
      ...user,
      shopIds: user.shopIds || []
    }))
  });

  const createShopMutation = useMutation({
    mutationFn: async (data: { name: string; address?: string; businessMode?: string }) => {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          address: data.address?.trim() || null,
          businessMode: data.businessMode || 'shop'
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

  const editShopMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; address?: string | null; businessMode?: string }) => {
      const response = await fetch(`/api/shops/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          address: data.address === null ? null : data.address?.trim(),
          businessMode: data.businessMode || 'shop'
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

  const deleteShopMutation = useMutation({
    mutationFn: async ({ id, confirmationName }: { id: number; confirmationName?: string }) => {
      const response = await fetch(`/api/shops/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationName }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // If confirmation is required, set up the confirmation dialog
        if (error.requiresConfirmation) {
          setDeletingShop({
            id,
            name: error.shopName,
            requiresConfirmation: true,
            dataToBeDeleted: error.dataToBeDeleted
          });
          // Throw a special error that won't show a toast
          throw new Error('CONFIRMATION_REQUIRED');
        }
        
        throw new Error(error.error || t('common.shop.deleteError'));
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shops'] });
      setDeletingShop(null);
      setConfirmationName('');
      
      toast({
        title: t('common.shop.deleted'),
        description: data.cascadeDelete 
          ? t('settings.shopAndDataDeleted')
          : t('common.shop.deleteSuccess'),
      });
    },
    onError: (error: Error) => {
      console.error('Shop deletion error:', error);
      
      // Don't show error toast for confirmation requirements
      if (error.message === 'CONFIRMATION_REQUIRED') return;
      
      if (!error.message.includes('permanently deleted')) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('common.errors.failedToDeleteUser'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: t('settings.userDeleted'),
        description: t('settings.userDeleteSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('settings.userDeleteFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async (data: { id: number; username?: string; password?: string; shopIds?: number[] }) => {
      const response = await fetch(`/api/users/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('common.errors.failedToUpdateUser'));
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

  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; isAdmin?: boolean; shopIds?: number[] }) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('common.errors.failedToCreateUser'));
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
        throw new Error(error.error || t('common.errors.failedToChangePassword'));
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
    updateLanguage(value);
  };

  const handleCurrencyChange = (value: string) => {
    updateCurrency(value);
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

  const isShopAssigned = useCallback((userId: number, shopId: number) => {
    const foundUser = users?.find(u => u.id === userId);
    // Ensure shopIds is treated as an array even if undefined/null
    return (foundUser?.shopIds || []).includes(shopId);
  }, [users]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6"
      >
        {t('settings.title')}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-8"
      >
        {/* Preferences Section - Always visible */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('settings.preferences')}</h2>
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.preferences')}</CardTitle>
              <CardDescription>{t('settings.preferencesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>{t('settings.language')}</Label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('auth.selectLanguage')} />
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

                {/* Currency Setting - Admin Only */}
                {user?.isAdmin && (
                  <div>
                    <Label>{t('settings.currency')}</Label>
                    <Select value={currency.code} onValueChange={handleCurrencyChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('settings.currency')} />
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
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* App Name Setting Section - Only visible to admins */}
        {user?.isAdmin && (
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('common.appName')}</h2>
            <Card>
              <CardHeader>
                <CardTitle>{t('common.appName')}</CardTitle>
                <CardDescription>{t('settings.appNameDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const appName = formData.get('appName') as string;
                    // TODO: Save appName to settings
                    console.log('App Name:', appName);
                    toast({
                      title: 'App Name Updated',
                      description: 'App name has been updated successfully',
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="appName">{t('common.appName')}</Label>
                    <Input
                      id="appName"
                      name="appName"
                      defaultValue="Popcorn POS"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {t('settings.saveAppName')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Account Section - Always visible */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{t('settings.account')}</h2>
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.security')}</CardTitle>
              <CardDescription>{t('settings.securityDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium">{t('settings.username')}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{user?.username}</p>
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
                    {changePasswordMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {t('settings.changePassword')}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Shop Management Section - Only visible to admins */}
        {user?.isAdmin && (
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('settings.shopManagement')}</h2>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.createShop')}</CardTitle>
                  <CardDescription>{t('settings.createShopDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    id="createShopForm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('name') as string;
                      const address = formData.get('address') as string;
                      const businessMode = formData.get('businessMode') as string;

                      if (!name.trim()) {
                        toast({
                          title: t('settings.validationError'),
                          description: t('common.shop.nameRequired'),
                          variant: "destructive",
                        });
                        return;
                      }

                      createShopMutation.mutate({ name, address, businessMode });
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
                    <div className="space-y-2">
                      <Label htmlFor="businessMode">{t('settings.businessMode')}</Label>
                      <Select name="businessMode" defaultValue="shop">
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.selectBusinessMode')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shop">{t('settings.shopMode')}</SelectItem>
                          <SelectItem value="restaurant">{t('settings.restaurantMode')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      disabled={createShopMutation.isPending}
                      className="w-full"
                    >
                      {createShopMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {t('common.shop.create')}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.existingShops')}</CardTitle>
                  <CardDescription>{t('settings.existingShopsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {shops?.map(shop => (
                      <div
                        key={shop.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <h3 className="font-medium">{shop.name}</h3>
                          {shop.address && (
                            <p className="text-sm text-muted-foreground mt-1">{shop.address}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {t(`settings.${shop.businessMode}Mode`)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingShop({ id: shop.id, name: shop.name, address: shop.address, businessMode: shop.businessMode })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              deleteShopMutation.mutate({ id: shop.id });
                            }}
                            disabled={deleteShopMutation.isPending}
                          >
                            {deleteShopMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* User Management Section - Only visible to admins */}
        {user?.isAdmin && (
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('settings.userManagement')}</h2>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.createUser')}</CardTitle>
                  <CardDescription>{t('settings.createUserDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    id="createUserForm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const username = formData.get('username') as string;
                      const password = formData.get('password') as string;

                      try {
                        const parsed = insertUserSchema.parse({ username, password });
                        const isAdmin = formData.get('isAdmin') === 'true';
                        const shopIds = isAdmin ? [] : Array.from(formData.getAll('shopIds')).map(id => Number(id));

                        createUserMutation.mutate({
                          username,
                          password,
                          isAdmin,
                          shopIds
                        });
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
                    <div className="space-y-2">
                      <Label>{t('settings.userType')}</Label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="admin-user"
                            name="isAdmin"
                            value="true"
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor="admin-user">{t('settings.adminUser')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="regular-user"
                            name="isAdmin"
                            value="false"
                            defaultChecked
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor="regular-user">{t('settings.regularUser')}</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2" id="shop-assignment-section">
                      <Label>{t('settings.assignShops')}</Label>
                      <div className="space-y-2">
                        {shops?.length > 0 ? (
                          shops.map(shop => (
                            <div key={shop.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`shop-${shop.id}`}
                                name="shopIds"
                                value={shop.id.toString()} // Ensure value is string
                                className="h-4 w-4 rounded border-gray-300"
                                disabled={createUserMutation.isPending}
                              />
                              <Label htmlFor={`shop-${shop.id}`}>{shop.name}</Label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t('settings.noShopsAvailable')}
                          </p>
                        )}
                      </div>
                    </div>
                    <script dangerouslySetInnerHTML={{
                      __html: `
                        document.addEventListener('DOMContentLoaded', () => {
                          const adminRadio = document.getElementById('admin-user');
                          const regularRadio = document.getElementById('regular-user');
                          const shopSection = document.getElementById('shop-assignment-section');

                          const toggleShopSection = () => {
                            if (shopSection) {
                              shopSection.style.display = adminRadio?.checked ? 'none' : 'block';
                            }
                          };

                          adminRadio?.addEventListener('change', toggleShopSection);
                          regularRadio?.addEventListener('change', toggleShopSection);

                          // Initialize state
                          toggleShopSection();
                        });
                      `
                    }} />
                    <Button
                      type="submit"
                      disabled={createUserMutation.isPending}
                      className="w-full"
                    >
                      {createUserMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      {t('settings.createUser')}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.existingUsers')}</CardTitle>
                  <CardDescription>{t('settings.existingUsersDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users?.map(user => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div>
                            <span className="font-medium">{user.username}</span>
                            {user.isAdmin && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                {t('settings.adminUser')}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingUser({ id: user.id, username: user.username, isAdmin: user.isAdmin })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(t('settings.confirmDeleteUser'))) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}
                              disabled={deleteUserMutation.isPending}
                            >
                              {deleteUserMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Stripe Settings Section - Only visible to admins */}
        {user?.isAdmin && (
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('settings.stripeSettings')}</h2>
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.stripeIntegration')}</CardTitle>
                <CardDescription>{t('settings.stripeDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!currentShop) return;

                    const formData = new FormData(e.currentTarget);
                    const publishableKey = formData.get('publishableKey') as string;
                    const secretKey = formData.get('secretKey') as string;
                    const enabled = formData.get('enabled') === 'true';

                    try {
                      const response = await fetch(`/api/shops/${currentShop.id}/stripe-settings`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          publishableKey: publishableKey.trim() || null,
                          secretKey: secretKey.trim() || null,
                          enabled
                        }),
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || t('settings.stripeUpdateError'));
                      }

                      toast({
                        title: t('settings.stripeUpdated'),
                        description: t('settings.stripeUpdateSuccess'),
                      });
                    } catch (error) {
                      console.error('Stripe settings update error:', error);
                      toast({
                        title: t('settings.error'),
                        description: error instanceof Error ? error.message : t('settings.stripeUpdateError'),
                        variant: "destructive",
                      });
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="publishableKey">{t('settings.stripePublishableKey')}</Label>
                    <Input
                      id="publishableKey"
                      name="publishableKey"
                      placeholder="pk_test_..."
                      defaultValue={stripeSettings?.publishableKey || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secretKey">{t('settings.stripeSecretKey')}</Label>
                    <Input
                      id="secretKey"
                      name="secretKey"
                      type="password"
                      placeholder="sk_test_..."
                      defaultValue={stripeSettings?.secretKey || ''}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enabled"
                      name="enabled"
                      value="true"
                      className="h-4 w-4 rounded border-gray-300"
                      defaultChecked={stripeSettings?.enabled}
                    />
                    <Label htmlFor="enabled">{t('settings.enableStripe')}</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    {t('settings.saveStripeSettings')}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('settings.stripeNote')}
                  </p>
                </form>
              </CardContent>
            </Card>
          </section>
        )}

        {/* System Test Section - Only visible to admins */}
        {user?.isAdmin && (
          <section>
            <h2 className="text-xl font-semibold mb-4">{t('settings.systemTest')}</h2>
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

                        const response = await apiRequest('POST', 'system-test');
                        const results = await response.json();

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
          </section>
        )}

        {/* Keep the dialogs at the end */}
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

                const shopIds = Array.from(formData.getAll('shopIds')).map(id => Number(id));
                const updates: { id: number; username?: string; password?: string; shopIds?: number[] } = {
                  id: editingUser.id,
                };

                if (username && username !== editingUser.username) {
                  updates.username = username;
                }

                if (password) {
                  updates.password = password;
                }

                if (!editingUser.isAdmin) { // Corrected condition
                  updates.shopIds = shopIds;
                }

                // Send update if we have either username/password changes or shop assignments
                if (Object.keys(updates).length > 1 || updates.shopIds !== undefined) {
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
              {editingUser && !editingUser.isAdmin && (
                <div className="space-y-2">
                  <Label>{t('settings.assignShops')}</Label>
                  <div className="space-y-2">
                    {shops?.length > 0 ? (
                      shops.map(shop => (
                        <div key={shop.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-shop-${shop.id}`}
                            name="shopIds"
                            value={shop.id.toString()} // Ensure value is string
                            className="h-4 w-4 rounded border-gray-300"
                            defaultChecked={isShopAssigned(editingUser.id, shop.id)} // Use callback
                            disabled={editUserMutation.isPending}
                          />
                          <Label htmlFor={`edit-shop-${shop.id}`}>{shop.name}</Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t('settings.noShopsAvailable')}
                      </p>
                    )}
                  </div>
                </div>
              )}
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
                const businessMode = formData.get('businessMode') as string;

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
                  address: address ? address.trim() : null,
                  businessMode: businessMode || 'shop'
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
              <div className="space-y-2">
                <Label htmlFor="edit-businessMode">{t('settings.businessMode')}</Label>
                <Select name="businessMode" defaultValue={editingShop?.businessMode || 'shop'}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('settings.selectBusinessMode')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">{t('settings.shopMode')}</SelectItem>
                    <SelectItem value="restaurant">{t('settings.restaurantMode')}</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* Shop Deletion Confirmation Dialog */}
        <Dialog open={!!deletingShop} onOpenChange={(open) => {
          if (!open) {
            setDeletingShop(null);
            setConfirmationName('');
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">
                {t('settings.deleteShop')}
              </DialogTitle>
              <DialogDescription>
                {deletingShop?.requiresConfirmation ? (
                  <div className="space-y-3">
                    <p className="text-sm">
                      {t('settings.deleteShopWarning')}
                    </p>
                    {deletingShop.dataToBeDeleted && (
                      <div className="bg-destructive/10 p-3 rounded-md">
                        <p className="text-sm font-medium text-destructive mb-2">
                          {t('settings.dataWillBeDeleted')}:
                        </p>
                        <ul className="text-sm space-y-1">
                          {deletingShop.dataToBeDeleted.categories > 0 && (
                            <li>- {deletingShop.dataToBeDeleted.categories} {t('settings.categories')}</li>
                          )}
                          {deletingShop.dataToBeDeleted.products > 0 && (
                            <li>- {deletingShop.dataToBeDeleted.products} {t('settings.products')}</li>
                          )}
                          {deletingShop.dataToBeDeleted.orders > 0 && (
                            <li>- {deletingShop.dataToBeDeleted.orders} {t('settings.orders')}</li>
                          )}
                        </ul>
                      </div>
                    )}
                    <p className="text-sm font-medium">
                      {t('settings.typeShopNameToConfirm')}: <span className="font-mono bg-muted px-1 rounded">{deletingShop.name}</span>
                    </p>
                  </div>
                ) : (
                  t('settings.confirmDeleteEmptyShop')
                )}
              </DialogDescription>
            </DialogHeader>
            
            {deletingShop?.requiresConfirmation && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmation-name">
                    {t('settings.shopName')}
                  </Label>
                  <Input
                    id="confirmation-name"
                    value={confirmationName}
                    onChange={(e) => setConfirmationName(e.target.value)}
                    placeholder={deletingShop.name}
                    className="font-mono"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeletingShop(null);
                  setConfirmationName('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                disabled={
                  deleteShopMutation.isPending || 
                  (deletingShop?.requiresConfirmation && confirmationName !== deletingShop.name)
                }
                onClick={() => {
                  if (deletingShop) {
                    deleteShopMutation.mutate({ 
                      id: deletingShop.id, 
                      confirmationName: deletingShop.requiresConfirmation ? confirmationName : undefined 
                    });
                  }
                }}
              >
                {deleteShopMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t('settings.deleteShopPermanently')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
