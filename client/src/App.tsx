import React from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import POS from "@/pages/pos";
import History from "@/pages/history";
import Inventory from "@/pages/inventory";
import Settings from "@/pages/settings";
import Categories from "@/pages/categories";
import Analytics from "@/pages/analytics";
import Tables from "@/pages/tables";
import Kitchen from "@/pages/kitchen";
import AuthPage from "@/pages/auth";
import PaymentSuccess from "@/pages/payment-success";
import PaymentCancel from "@/pages/payment-cancel";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Provider as JotaiProvider } from 'jotai';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/hooks/use-auth";
import { ShopProvider } from "@/lib/shop-context";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { LanguageSynchronizer } from "@/components/LanguageSynchronizer";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/cancel" component={PaymentCancel} />
      <Route>
        <DashboardLayout>
          <Switch>
            <ProtectedRoute path="/" component={POS} />
            <ProtectedRoute path="/history" component={History} />
            <ProtectedRoute path="/inventory" component={Inventory} />
            <ProtectedRoute path="/settings" component={Settings} />
            <ProtectedRoute path="/categories" component={Categories} />
            <ProtectedRoute path="/analytics" component={Analytics} />
            <ProtectedRoute path="/tables" component={Tables} />
            <ProtectedRoute path="/kitchen" component={Kitchen} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <JotaiProvider>
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <LanguageSynchronizer />
          <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ShopProvider>
              <OnboardingProvider>
                <Router />
                <Toaster />
              </OnboardingProvider>
            </ShopProvider>
          </AuthProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </ThemeProvider>
    </JotaiProvider>
  );
}

export default App;
