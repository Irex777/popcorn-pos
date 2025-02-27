import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import POS from "@/pages/pos";
import History from "@/pages/history";
import Inventory from "@/pages/inventory";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Provider as JotaiProvider } from 'jotai';

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={POS} />
        <Route path="/history" component={History} />
        <Route path="/inventory" component={Inventory} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </JotaiProvider>
  );
}

export default App;