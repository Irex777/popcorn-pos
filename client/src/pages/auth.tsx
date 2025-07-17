import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth"; // Import useAuth
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { languages, languageAtom } from "@/lib/settings";
import { useAtom } from "jotai";
import i18n from "@/lib/i18n";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { loginMutation } = useAuth(); // Get loginMutation from useAuth
  const [language, setLanguage] = useAtom(languageAtom);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    } as any,
  });

  // Remove the local mutation definition

  const onSubmit = (data: InsertUser) => {
    // Use the loginMutation from useAuth
    loginMutation.mutate(data, {
      onSuccess: () => {
        // Add navigation and toast on success here, as the hook's onSuccess only updates cache
        navigate("/");
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.welcomeBack'),
        });
      },
      // onError is handled globally by the loginMutation in useAuth
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Popcorn POS
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('auth.welcomeMessage')}
          </p>
        </div>

        {/* Language Selector */}
        <div className="w-full flex justify-end">
          <Select
            value={language}
            onValueChange={(value) => {
              setLanguage(value);
              i18n.changeLanguage(value);
            }}
          >
            <SelectTrigger className="w-[180px]">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {t('auth.login')}
            </CardTitle>
            <CardDescription>
              {t('auth.loginDescription')}
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
                disabled={loginMutation.isPending} // Use loginMutation state
              >
                {t('auth.login')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
