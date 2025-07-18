import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Settings, Menu, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useShop } from "@/lib/shop-context";
import { ShopSelector } from "./ShopSelector";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const { isRestaurantMode } = useShop();

  const menuItems = [
    { href: "/", label: t('analytics.navigation.pos') },
    // Restaurant-specific features (only shown in restaurant mode)
    ...(isRestaurantMode ? [
      { href: "/server", label: t('analytics.navigation.server') },
      { href: "/kitchen", label: t('analytics.navigation.kitchen') },
    ] : []),
    { href: "/history", label: t('analytics.navigation.history') },
    { href: "/inventory", label: t('analytics.navigation.inventory') },
    { href: "/categories", label: t('analytics.navigation.categories') },
    { href: "/analytics", label: t('analytics.navigation.analytics') },
  ];

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = '/auth';
      },
      onError: (error: Error) => {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-2 h-16 flex items-center justify-between safe-area-x">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl md:text-2xl font-bold"
          >
            Popcorn POS
          </motion.h1>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] px-2 py-6">
                <nav className="flex flex-col gap-2">
                  {menuItems.map(item => (
                    <button
                      key={item.href}
                      className={`px-4 py-3 rounded-md text-base font-medium w-full text-left ${
                        location === item.href
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                      onClick={() => {
                        setIsMenuOpen(false);
                        window.location.href = item.href;
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>


                <Separator className="my-4" />

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.location.href = "/settings";
                    }}
                    className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-medium w-full text-left text-foreground/60 hover:text-foreground"
                  >
                    <Settings className="h-5 w-5" />
                    {t('analytics.navigation.settings')}
                  </button>
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-medium w-full text-left text-foreground/60 hover:text-foreground"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-3 rounded-md text-base font-medium w-full text-left text-destructive hover:text-destructive/80"
                  >
                    <LogOut className="h-5 w-5" />
                    {t('common.logout')}
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            <nav className="flex items-center gap-2 mr-4">
              {menuItems.map(item => (
                <Link key={item.href} href={item.href}>
                  <button
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                </Link>
              ))}
            </nav>
            <ShopSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive/80"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-4 md:px-6 md:py-6 safe-area-x">
        {children}
      </main>
    </div>
  );
}
