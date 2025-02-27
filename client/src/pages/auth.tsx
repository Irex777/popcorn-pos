import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      try {
        const response = await fetch(
          `/api/${isLogin ? "login" : "register"}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Authentication failed');
        }

        return result;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Authentication failed');
      }
    },
    onSuccess: () => {
      navigate("/");
      toast({
        title: isLogin ? t('auth.loginSuccess') : t('auth.registerSuccess'),
        description: isLogin ? t('auth.welcomeBack') : t('auth.accountCreated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: isLogin ? t('auth.loginFailed') : t('auth.registerFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Boutique POS
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? t('auth.welcomeMessage') : t('auth.createAccount')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {isLogin ? t('auth.login') : t('auth.register')}
            </CardTitle>
            <CardDescription>
              {isLogin ? t('auth.loginDescription') : t('auth.registerDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder={t('auth.username')}
                  {...form.register("username")}
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={t('auth.password')}
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                {isLogin ? t('auth.login') : t('auth.register')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? t('auth.needAccount') : t('auth.haveAccount')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}