import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import type { Table, Reservation } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface TableSuggestion {
  table: Table;
  score: number;
  reasons: string[];
}

interface UseTableAssignmentProps {
  partySize: number;
  reservationTime?: Date;
  preferredSection?: string;
}

export function useTableAssignmentOptimizer({ 
  partySize, 
  reservationTime, 
  preferredSection 
}: UseTableAssignmentProps) {
  const { t } = useTranslation();
  const { currentShop } = useShop();

  const { data: tables = [] } = useQuery({
    queryKey: ["tables", currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/tables`);
      if (!response.ok) throw new Error(t('restaurant.fetchTablesError'));
      return response.json();
    },
    enabled: !!currentShop?.id,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations", currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/reservations`);
      if (!response.ok) throw new Error(t('restaurant.fetchReservationsError'));
      return response.json();
    },
    enabled: !!currentShop?.id,
  });

  const suggestions = useMemo(() => {
    if (!tables.length) return [];

    const availableTables = tables.filter((table: Table) => 
      table.status === 'available' || table.status === 'cleaning'
    );

    const scoredTables: TableSuggestion[] = availableTables.map((table: Table) => {
      let score = 0;
      const reasons: string[] = [];

      // Capacity scoring (prefer exact match or slightly larger)
      const capacityDiff = table.capacity - partySize;
      if (capacityDiff === 0) {
        score += 100;
        reasons.push(t('restaurant.reasons.perfectCapacity'));
      } else if (capacityDiff === 1) {
        score += 80;
        reasons.push(t('restaurant.reasons.optimalCapacity'));
      } else if (capacityDiff === 2) {
        score += 60;
        reasons.push(t('restaurant.reasons.goodCapacity'));
      } else if (capacityDiff > 2) {
        score += Math.max(20, 60 - (capacityDiff - 2) * 10);
        reasons.push(t('restaurant.reasons.largeTable', { count: capacityDiff }));
      } else {
        // Table too small
        score -= 50;
        reasons.push(t('restaurant.reasons.tableTooSmall'));
      }

      // Section preference
      if (preferredSection && table.section === preferredSection) {
        score += 30;
        reasons.push(t('restaurant.reasons.inPreferredSection', { section: preferredSection }));
      }

      // Status preference (available > cleaning)
      if (table.status === 'available') {
        score += 20;
        reasons.push(t('restaurant.reasons.immediatelyAvailable'));
      } else if (table.status === 'cleaning') {
        score += 10;
        reasons.push(t('restaurant.reasons.availableAfterCleaning'));
      }

      // Check for nearby reservation conflicts
      if (reservationTime) {
        const conflictWindow = 2 * 60 * 60 * 1000; // 2 hours
        const hasNearbyReservation = reservations.some((res: Reservation) => {
          if (res.tableId !== table.id) return false;
          const resTime = new Date(res.reservationTime).getTime();
          const targetTime = reservationTime.getTime();
          return Math.abs(resTime - targetTime) < conflictWindow;
        });

        if (hasNearbyReservation) {
          score -= 40;
          reasons.push(t('restaurant.reasons.hasNearbyReservation'));
        } else {
          score += 15;
          reasons.push(t('restaurant.reasons.noSchedulingConflicts'));
        }
      }

      // Table number preference (lower numbers often preferred)
      const tableNum = parseInt(table.number);
      if (!isNaN(tableNum) && tableNum <= 10) {
        score += 5;
        reasons.push(t('restaurant.reasons.primeTableNumber'));
      }

      return {
        table,
        score: Math.max(0, score),
        reasons
      };
    });

    // Sort by score (highest first) and filter out very low scores
    return scoredTables
      .filter(suggestion => suggestion.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 suggestions
  }, [tables, partySize, preferredSection, reservationTime, reservations, t]);

  const bestTable = suggestions[0]?.table || null;
  const hasConflicts = suggestions.some(s => 
    s.reasons.some(r => r.includes("conflict") || r.includes("too small"))
  );

  return {
    suggestions,
    bestTable,
    hasConflicts,
    availableCount: tables.filter((t: Table) => t.status === 'available').length
  };
}

interface TableAssignmentOptimizerProps {
  partySize: number;
  reservationTime?: Date;
  preferredSection?: string;
  onTableSelect: (table: Table) => void;
  selectedTable?: Table | null;
}

export default function TableAssignmentOptimizer({
  partySize,
  reservationTime,
  preferredSection,
  onTableSelect,
  selectedTable
}: TableAssignmentOptimizerProps) {
  const { t } = useTranslation();
  const { suggestions, bestTable, hasConflicts } = useTableAssignmentOptimizer({
    partySize,
    reservationTime,
    preferredSection
  });

  if (!suggestions.length) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-2">{t('restaurant.noAvailableTables')}</h3>
        <p className="text-red-600 text-sm">
          {t('restaurant.noTablesForParty', { partySize })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasConflicts && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            {t('restaurant.conflictWarning')}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">{t('restaurant.recommendedTables')}</h3>
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.table.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedTable?.id === suggestion.table.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${index === 0 ? 'ring-2 ring-green-200' : ''}`}
            onClick={() => onTableSelect(suggestion.table)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t('restaurant.table')} {suggestion.table.number}</span>
                  {index === 0 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {t('restaurant.bestMatch')}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {t('restaurant.score', { score: suggestion.score })}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {t('restaurant.seats', { count: suggestion.table.capacity })}
                  {suggestion.table.section && ` • ${suggestion.table.section}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  {suggestion.table.status}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {suggestion.reasons.map((reason, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {bestTable && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            💡 <strong>{t('restaurant.recommendation')}:</strong> {t('restaurant.optimalChoice', { tableNumber: bestTable.number, partySize })}
          </p>
        </div>
      )}
    </div>
  );
}