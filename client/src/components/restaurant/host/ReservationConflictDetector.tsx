import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Users } from "lucide-react";
import type { Reservation, Table } from "@shared/schema";

interface ConflictDetectorProps {
  proposedTime: Date;
  partySize: number;
  selectedTable?: Table | null;
  excludeReservationId?: number;
}

interface Conflict {
  type: 'time_overlap' | 'capacity_issue' | 'table_unavailable' | 'peak_hours';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedReservation?: Reservation;
  suggestedAction?: string;
}

export function useReservationConflictDetector({
  proposedTime,
  partySize,
  selectedTable,
  excludeReservationId
}: ConflictDetectorProps) {
  const { currentShop } = useShop();

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations", currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/reservations`);
      if (!response.ok) throw new Error("Failed to fetch reservations");
      return response.json();
    },
    enabled: !!currentShop?.id,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ["tables", currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/tables`);
      if (!response.ok) throw new Error("Failed to fetch tables");
      return response.json();
    },
    enabled: !!currentShop?.id,
  });

  const conflicts = useMemo(() => {
    const detectedConflicts: Conflict[] = [];
    const proposedTimeMs = proposedTime.getTime();
    const bufferTime = 90 * 60 * 1000; // 90 minutes buffer between reservations

    // Filter out the current reservation if editing
    const activeReservations = reservations.filter((res: Reservation) => 
      res.id !== excludeReservationId && 
      ['confirmed', 'seated'].includes(res.status)
    );

    // Check for time overlaps with same table
    if (selectedTable) {
      const tableReservations = activeReservations.filter((res: Reservation) => 
        res.tableId === selectedTable.id
      );

      tableReservations.forEach((res: Reservation) => {
        const resTimeMs = new Date(res.reservationTime).getTime();
        const timeDiff = Math.abs(proposedTimeMs - resTimeMs);

        if (timeDiff < bufferTime) {
          detectedConflicts.push({
            type: 'time_overlap',
            severity: timeDiff < 60 * 60 * 1000 ? 'high' : 'medium',
            message: `Table ${selectedTable.number} has a reservation at ${new Date(res.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            affectedReservation: res,
            suggestedAction: timeDiff < 60 * 60 * 1000 ? 'Choose different time or table' : 'Consider 30min buffer'
          });
        }
      });

      // Check table capacity
      if (selectedTable.capacity < partySize) {
        detectedConflicts.push({
          type: 'capacity_issue',
          severity: 'high',
          message: `Table ${selectedTable.number} only seats ${selectedTable.capacity}, but party size is ${partySize}`,
          suggestedAction: 'Select a larger table'
        });
      }

      // Check if table is currently unavailable
      if (!['available', 'reserved'].includes(selectedTable.status)) {
        detectedConflicts.push({
          type: 'table_unavailable',
          severity: selectedTable.status === 'occupied' ? 'high' : 'medium',
          message: `Table ${selectedTable.number} is currently ${selectedTable.status}`,
          suggestedAction: selectedTable.status === 'cleaning' ? 'Table will be available soon' : 'Choose different table'
        });
      }
    }

    // Check for peak hours congestion
    const proposedHour = proposedTime.getHours();
    const isPeakHour = (proposedHour >= 12 && proposedHour <= 14) || (proposedHour >= 18 && proposedHour <= 21);
    
    if (isPeakHour) {
      const sameHourReservations = activeReservations.filter((res: Reservation) => {
        const resHour = new Date(res.reservationTime).getHours();
        return resHour === proposedHour;
      });

      const totalCapacityNeeded = sameHourReservations.reduce((sum: number, res: any) => sum + res.partySize, 0) + partySize;
      const totalAvailableCapacity = tables.reduce((sum: number, table: Table) => sum + table.capacity, 0);

      if (totalCapacityNeeded > totalAvailableCapacity * 0.8) {
        detectedConflicts.push({
          type: 'peak_hours',
          severity: totalCapacityNeeded > totalAvailableCapacity ? 'high' : 'medium',
          message: `Peak hour (${proposedHour}:00) - High demand expected`,
          suggestedAction: 'Consider off-peak times or add to wait list'
        });
      }
    }

    // Check for general availability
    const availableTables = tables.filter((table: Table) => 
      table.status === 'available' && table.capacity >= partySize
    );

    if (availableTables.length === 0) {
      detectedConflicts.push({
        type: 'table_unavailable',
        severity: 'high',
        message: `No tables available for party of ${partySize}`,
        suggestedAction: 'Add to wait list or suggest different time'
      });
    }

    return detectedConflicts;
  }, [proposedTime, partySize, selectedTable, reservations, tables, excludeReservationId]);

  const hasHighSeverityConflicts = conflicts.some(c => c.severity === 'high');
  const hasMediumSeverityConflicts = conflicts.some(c => c.severity === 'medium');

  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
    hasHighSeverityConflicts,
    hasMediumSeverityConflicts,
    canProceed: !hasHighSeverityConflicts
  };
}

export default function ReservationConflictDetector(props: ConflictDetectorProps) {
  const { conflicts, hasConflicts, hasHighSeverityConflicts, canProceed } = useReservationConflictDetector(props);

  if (!hasConflicts) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <AlertDescription className="text-green-800">
            No conflicts detected - reservation looks good!
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Users className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className={`h-4 w-4 ${hasHighSeverityConflicts ? 'text-red-600' : 'text-yellow-600'}`} />
        <span className="font-medium text-sm">
          {hasHighSeverityConflicts ? 'Conflicts Detected' : 'Potential Issues'}
        </span>
        <Badge variant={hasHighSeverityConflicts ? 'destructive' : 'secondary'}>
          {conflicts.length} issue{conflicts.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-2">
        {conflicts.map((conflict, index) => (
          <Alert key={index} className={getSeverityColor(conflict.severity)}>
            <div className="flex items-start gap-3">
              {getSeverityIcon(conflict.severity)}
              <div className="flex-1">
                <AlertDescription className="text-sm">
                  <div className="font-medium">{conflict.message}</div>
                  {conflict.suggestedAction && (
                    <div className="text-xs mt-1 opacity-80">
                      💡 {conflict.suggestedAction}
                    </div>
                  )}
                  {conflict.affectedReservation && (
                    <div className="text-xs mt-1 opacity-80">
                      Conflicts with: {conflict.affectedReservation.customerName} 
                      ({conflict.affectedReservation.partySize} guests)
                    </div>
                  )}
                </AlertDescription>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  conflict.severity === 'high' ? 'border-red-300 text-red-700' :
                  conflict.severity === 'medium' ? 'border-yellow-300 text-yellow-700' :
                  'border-blue-300 text-blue-700'
                }`}
              >
                {conflict.severity}
              </Badge>
            </div>
          </Alert>
        ))}
      </div>

      {!canProceed && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Cannot proceed:</strong> Please resolve high-severity conflicts before creating this reservation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}