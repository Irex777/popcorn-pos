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
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Provider as JotaiProvider } from 'jotai';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import Analytics from "@/pages/analytics";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={POS} />
        <Route path="/history" component={History} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/settings" component={Settings} />
        <Route path="/categories" component={Categories} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <JotaiProvider>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <Router />
          <Toaster />
        </QueryClientProvider>
      </I18nextProvider>
    </JotaiProvider>
  );
}

export default App;