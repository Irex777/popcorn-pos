import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Users, Phone, MessageSquare, Plus, Timer } from "lucide-react";
import type { Reservation } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface WaitListEntry extends Reservation {
  waitTime?: number; // calculated wait time in minutes
}

interface AddWaitListDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function AddWaitListDialog({ isOpen, onOpenChange }: AddWaitListDialogProps) {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    partySize: 2,
    notes: ""
  });

  const addToWaitListMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      
      const reservationData = {
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        partySize: data.partySize,
        reservationTime: new Date().toISOString(), // Current time for walk-ins
        status: 'waiting',
        shopId: currentShop.id,
        specialInstructions: data.notes || null
      };
      
      const response = await fetch(`/api/shops/${currentShop.id}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      });
      
      if (!response.ok) throw new Error(t('restaurant.addToWaitListError'));
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('restaurant.addedToWaitList'),
        description: t('restaurant.addedToWaitListSuccess', { customerName: formData.customerName }),
      });
      queryClient.invalidateQueries({ queryKey: ["waitlist", currentShop?.id] });
      setFormData({ customerName: "", customerPhone: "", partySize: 2, notes: "" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('restaurant.addToWaitListError'),
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      toast({
        title: t('common.error'),
        description: t('restaurant.customerNameRequired'),
        variant: "destructive",
      });
      return;
    }
    addToWaitListMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('restaurant.addToWaitList')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customerName">{t('restaurant.customerName')} *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder={t('restaurant.customerNamePlaceholder')}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="customerPhone">{t('restaurant.phoneNumber')}</Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              placeholder={t('restaurant.phoneNumberPlaceholder')}
            />
          </div>
          
          <div>
            <Label htmlFor="partySize">{t('restaurant.partySize')} *</Label>
            <Input
              id="partySize"
              type="number"
              min="1"
              max="20"
              value={formData.partySize}
              onChange={(e) => setFormData(prev => ({ ...prev, partySize: parseInt(e.target.value) || 2 }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">{t('restaurant.specialNotes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t('restaurant.specialNotesPlaceholder')}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={addToWaitListMutation.isPending} className="flex-1">
              {addToWaitListMutation.isPending ? t('common.adding') : t('restaurant.addToWaitList')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface WaitListCardProps {
  entry: WaitListEntry;
  onSeat: (entry: WaitListEntry) => void;
  onRemove: (entry: WaitListEntry) => void;
  onNotify: (entry: WaitListEntry) => void;
}

function WaitListCard({ entry, onSeat, onRemove, onNotify }: WaitListCardProps) {
  const { t } = useTranslation();
  const getWaitTimeColor = (minutes: number) => {
    if (minutes < 20) return "bg-green-100 text-green-800";
    if (minutes < 40) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Calculate wait time from reservation time
  const waitTime = entry.waitTime || Math.floor((Date.now() - new Date(entry.reservationTime).getTime()) / (1000 * 60));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(entry.customerName)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{entry.customerName}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {t('restaurant.guests', { count: entry.partySize })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t('restaurant.waitingTime', { time: waitTime })}
              </div>
            </div>
            {(entry as any).specialInstructions && (
              <p className="text-sm text-muted-foreground mt-1">{(entry as any).specialInstructions}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getWaitTimeColor(waitTime)}>
            {t('restaurant.minutes', { count: waitTime })}
          </Badge>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSeat(entry)}>
              {t('restaurant.seatNow')}
            </Button>
            {entry.customerPhone && (
              <Button size="sm" variant="outline" onClick={() => onNotify(entry)}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => onRemove(entry)}>
              {t('common.remove')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function EnhancedWaitList() {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch wait list (reservations with status 'waiting')
  const { data: waitList = [], isLoading } = useQuery({
    queryKey: ["waitlist", currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/reservations`);
      if (!response.ok) throw new Error(t('restaurant.fetchWaitListError'));
      const reservations = await response.json();
      return reservations.filter((res: Reservation) => res.status === 'waiting');
    },
    enabled: !!currentShop?.id,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Update reservation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      
      const response = await fetch(`/api/shops/${currentShop.id}/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) throw new Error(t('restaurant.updateStatusError'));
      return response.json();
    },
    onSuccess: (_, { status }) => {
      toast({
        title: status === 'seated' ? t('restaurant.guestSeated') : status === 'notified' ? t('restaurant.guestNotified') : t('restaurant.guestRemoved'),
        description: status === 'seated' ? t('restaurant.guestSeatedSuccess') : 
                    status === 'notified' ? t('restaurant.guestNotifiedSuccess') : t('restaurant.guestRemovedSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: ["waitlist", currentShop?.id] });
      queryClient.invalidateQueries({ queryKey: ["tables", currentShop?.id] });
      queryClient.invalidateQueries({ queryKey: ["reservations", currentShop?.id] });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('restaurant.updateStatusError'),
        variant: "destructive",
      });
    }
  });

  const handleSeat = (entry: WaitListEntry) => {
    updateStatusMutation.mutate({ id: entry.id, status: 'seated' });
  };

  const handleNotify = (entry: WaitListEntry) => {
    updateStatusMutation.mutate({ id: entry.id, status: 'notified' });
    // In a real app, this would trigger SMS/notification
    toast({
      title: t('restaurant.notificationSent'),
      description: t('restaurant.notificationSentSuccess', { phone: entry.customerPhone || entry.customerName }),
    });
  };

  const handleRemove = (entry: WaitListEntry) => {
    updateStatusMutation.mutate({ id: entry.id, status: 'cancelled' });
  };

  const averageWaitTime = waitList.length > 0 
    ? Math.round(waitList.reduce((sum: number, entry: WaitListEntry) => {
        const waitTime = Math.floor((Date.now() - new Date(entry.reservationTime).getTime()) / (1000 * 60));
        return sum + waitTime;
      }, 0) / waitList.length)
    : 0;

  if (isLoading) {
    return <div className="text-center py-8">{t('restaurant.loadingWaitList')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {t('restaurant.partiesWaiting', { count: waitList.length })}
          </div>
          {waitList.length > 0 && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Timer className="h-4 w-4" />
              {t('restaurant.avgWaitTime', { time: averageWaitTime })}
            </div>
          )}
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('restaurant.addToWaitList')}
        </Button>
      </div>

      {waitList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">{t('restaurant.noCustomersWaiting')}</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('restaurant.addFirstCustomer')}
          </Button>
        </div>
      ) : (
        waitList.map((entry: WaitListEntry) => (
          <WaitListCard
            key={entry.id}
            entry={entry}
            onSeat={handleSeat}
            onRemove={handleRemove}
            onNotify={handleNotify}
          />
        ))
      )}

      <AddWaitListDialog 
        isOpen={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}