import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, MapPin } from "lucide-react";
import type { Table } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface TableSelectorProps {
  selectedTable: Table | null;
  onTableSelect: (table: Table | null) => void;
  allowOccupiedTables?: boolean;
}

export default function TableSelector({ selectedTable, onTableSelect, allowOccupiedTables = false }: TableSelectorProps) {
  const { t } = useTranslation();
  const { currentShop } = useShop();
  const [isOpen, setIsOpen] = useState(false);

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["tables", currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/tables`);
      if (!response.ok) throw new Error(t('restaurant.fetchTablesError'));
      return response.json();
    },
    enabled: !!currentShop?.id,
  });

  const availableTables = tables.filter((table: Table) => 
    allowOccupiedTables ? true : table.status === "available"
  );

  const handleTableSelect = (table: Table) => {
    onTableSelect(table);
    setIsOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-red-100 text-red-800";
      case "reserved":
        return "bg-blue-100 text-blue-800";
      case "cleaning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <MapPin className="h-4 w-4 mr-2" />
          {selectedTable ? `${t('restaurant.table')} ${selectedTable.number}` : t('restaurant.selectTable')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {allowOccupiedTables ? t('restaurant.selectTableOccupied') : t('restaurant.selectTable')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {selectedTable && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('restaurant.currentTable', { tableNumber: selectedTable.number })}</span>
                <Badge className={getStatusColor(selectedTable.status)}>
                  {t(`restaurant.status.${selectedTable.status}`)}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => onTableSelect(null)}>
                {t('restaurant.clearSelection')}
              </Button>
            </div>
          )}
          
          {isLoading ? (
            <div className="text-center py-4">{t('restaurant.loadingTables')}</div>
          ) : availableTables.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">{t('restaurant.noAvailableTables')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {availableTables.map((table: Table) => (
                <Card
                  key={table.id}
                  className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                    table.status === "occupied" ? "border-orange-300 bg-orange-50" : ""
                  }`}
                  onClick={() => handleTableSelect(table)}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">{t('restaurant.table')} {table.number}</div>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {t('restaurant.seats', { count: table.capacity })}
                    </div>
                    {table.section && (
                      <div className="text-xs text-muted-foreground mt-1">{table.section}</div>
                    )}
                    <Badge className={`${getStatusColor(table.status)} mt-2`} variant="outline">
                      {t(`restaurant.status.${table.status}`)}
                    </Badge>
                    {table.status === "occupied" && allowOccupiedTables && (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        {t('restaurant.willAddToExistingOrder')}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}