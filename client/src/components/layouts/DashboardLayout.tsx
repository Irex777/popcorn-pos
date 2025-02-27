import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Settings, History, Package, Grid2X2, BarChart2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold"
          >
            Boutique POS
          </motion.h1>
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-2 mr-4">
              <Link href="/">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === "/" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                }`}>
                  {t('common.pos')}
                </a>
              </Link>
              <Link href="/history">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === "/history" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                }`}>
                  {t('common.history')}
                </a>
              </Link>
              <Link href="/inventory">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === "/inventory" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                }`}>
                  {t('common.inventory')}
                </a>
              </Link>
              <Link href="/categories">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === "/categories" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                }`}>
                  {t('common.categories')}
                </a>
              </Link>
              <Link href="/analytics">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === "/analytics" ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                }`}>
                  {t('analytics.title')}
                </a>
              </Link>
            </nav>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link href="/settings">
              <a>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}