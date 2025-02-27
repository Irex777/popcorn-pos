import { motion } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRealTimeAnalytics } from "@/hooks/use-real-time-analytics";
import { formatCurrency } from "@/lib/settings";
import { useAtom } from "jotai";
import { currencyAtom } from "@/lib/settings";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function PredictiveInsights() {
  const { t } = useTranslation();
  const [currency] = useAtom(currencyAtom);
  const { analyticsData, isLoading } = useRealTimeAnalytics();

  if (isLoading || !analyticsData) {
    return <LoadingAnimation />;
  }

  const { predictions, trendIndicators } = analyticsData;

  const getTrendIcon = () => {
    switch (trendIndicators.salesTrend) {
      case 'increasing':
        return <TrendingUp className="text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="text-red-500" />;
      default:
        return <Minus className="text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('analytics.predictions')}
            {getTrendIcon()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Next Hour Prediction */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-card"
              >
                <h3 className="text-sm font-medium">{t('analytics.nextHour')}</h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(predictions.nextHour.predictedValue, currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('analytics.confidenceInterval')}: 
                  {formatCurrency(predictions.nextHour.confidenceInterval.lower, currency)} - 
                  {formatCurrency(predictions.nextHour.confidenceInterval.upper, currency)}
                </p>
              </motion.div>

              {/* Next Day Prediction */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-lg bg-card"
              >
                <h3 className="text-sm font-medium">{t('analytics.nextDay')}</h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(predictions.nextDay.predictedValue, currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('analytics.confidenceInterval')}: 
                  {formatCurrency(predictions.nextDay.confidenceInterval.lower, currency)} - 
                  {formatCurrency(predictions.nextDay.confidenceInterval.upper, currency)}
                </p>
              </motion.div>

              {/* Next Week Prediction */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-lg bg-card"
              >
                <h3 className="text-sm font-medium">{t('analytics.nextWeek')}</h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(predictions.nextWeek.predictedValue, currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('analytics.confidenceInterval')}: 
                  {formatCurrency(predictions.nextWeek.confidenceInterval.lower, currency)} - 
                  {formatCurrency(predictions.nextWeek.confidenceInterval.upper, currency)}
                </p>
              </motion.div>
            </div>

            <div className="h-[300px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  predictions.nextHour,
                  predictions.nextDay,
                  predictions.nextWeek
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedValue"
                    stroke="#8884d8"
                    name={t('analytics.predictedValue')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}