import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TableIcon } from "lucide-react";

export default function Tables() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6"
      >
        Table Management
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              Restaurant Tables
            </CardTitle>
            <CardDescription>
              Manage your restaurant tables and seating arrangements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Restaurant Feature Available
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  This page is only visible when your shop is set to Restaurant Mode. 
                  Table management features will be implemented here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>Planned features for table management</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Interactive floor plan designer</li>
              <li>• Table status tracking (available, occupied, reserved)</li>
              <li>• Seating capacity management</li>
              <li>• Order assignment to tables</li>
              <li>• Reservation scheduling</li>
              <li>• Table turnover analytics</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}