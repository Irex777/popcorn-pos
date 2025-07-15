import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ChefHat, Clock, Users } from "lucide-react";

export default function Kitchen() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6"
      >
        Kitchen Display System
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Kitchen Operations
            </CardTitle>
            <CardDescription>
              Real-time order management for kitchen staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Restaurant Feature Available
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  This kitchen display system is only available in Restaurant Mode. 
                  Kitchen management features will be implemented here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Order Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Real-time order tracking with preparation times and priority management
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Staff Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Kitchen staff assignments and workflow coordination
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ChefHat className="h-5 w-5" />
                Recipe Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ingredient lists, cooking instructions, and allergen information
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Planned Features</CardTitle>
            <CardDescription>Kitchen display system capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Real-time order notifications with audio alerts</li>
              <li>• Order timing and preparation tracking</li>
              <li>• Course sequencing and coordination</li>
              <li>• Special dietary requirements and allergen alerts</li>
              <li>• Kitchen performance analytics</li>
              <li>• Inventory integration for ingredient availability</li>
              <li>• Multi-station workflow management</li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}