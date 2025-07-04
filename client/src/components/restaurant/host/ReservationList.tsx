import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Users, Phone } from "lucide-react";
import type { Reservation } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface ReservationCardProps {
  reservation: Reservation;
  onSeat: (reservation: Reservation) => void;
  onCancel: (reservation: Reservation) => void;
}

function ReservationCard({ reservation, onSeat, onCancel }: ReservationCardProps) {
  const { t } = useTranslation();
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "seated":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no_show":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(reservation.customerName)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{reservation.customerName}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(reservation.reservationTime)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {t('restaurant.guests', { count: reservation.partySize })}
              </div>
              {reservation.customerPhone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {reservation.customerPhone}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(reservation.status)}>
            {t(`restaurant.status.${reservation.status.replace('_', '-')}`)}
          </Badge>
          {reservation.status === "confirmed" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onSeat(reservation)}>
                {t('restaurant.seatNow')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onCancel(reservation)}>
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function ReservationList() {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservations", currentShop?.id, today],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/reservations?date=${today}`);
      if (!response.ok) throw new Error(t('restaurant.fetchReservationsError'));
      return response.json();
    },
    enabled: !!currentShop?.id,
  });

  // Mutation to update reservation status
  const updateReservationMutation = useMutation({
    mutationFn: async ({ reservationId, updates }: { reservationId: number; updates: Partial<Reservation> }) => {
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      
      const response = await fetch(`/api/shops/${currentShop.id}/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error(t('restaurant.updateReservationError'));
      return response.json();
    },
    onSuccess: (_, { updates }) => {
      toast({
        title: t('restaurant.reservationUpdated'),
        description: updates.status === 'seated' 
          ? t('restaurant.guestSeatedSuccess') 
          : t('restaurant.reservationCancelledSuccess'),
      });
      // Refresh both reservations and tables data
      queryClient.invalidateQueries({ queryKey: ["reservations", currentShop?.id, today] });
      queryClient.invalidateQueries({ queryKey: ["tables", currentShop?.id] });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('restaurant.updateReservationError'),
        variant: "destructive",
      });
    }
  });

  const handleSeat = (reservation: Reservation) => {
    updateReservationMutation.mutate({
      reservationId: reservation.id,
      updates: { status: 'seated' }
    });
  };

  const handleCancel = (reservation: Reservation) => {
    updateReservationMutation.mutate({
      reservationId: reservation.id,
      updates: { status: 'cancelled' }
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-48">{t('restaurant.loadingReservations')}</div>;
  }

  const sortedReservations = reservations.sort((a: Reservation, b: Reservation) => 
    new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedReservations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">{t('restaurant.noReservationsToday')}</p>
          <Button>{t('restaurant.newReservation')}</Button>
        </div>
      ) : (
        sortedReservations.map((reservation: Reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            onSeat={handleSeat}
            onCancel={handleCancel}
          />
        ))
      )}
    </div>
  );
}