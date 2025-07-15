import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MapPin, Sparkles } from "lucide-react";
import type { Table } from "@shared/schema";
import TableAssignmentOptimizer from "./TableAssignmentOptimizer";

interface SmartTableSelectorProps {
  selectedTable: Table | null;
  onTableSelect: (table: Table | null) => void;
  partySize: number;
  reservationTime?: Date;
  preferredSection?: string;
}

export default function SmartTableSelector({ 
  selectedTable, 
  onTableSelect, 
  partySize,
  reservationTime,
  preferredSection 
}: SmartTableSelectorProps) {
  const { currentShop } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("smart");

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ["tables", currentShop?.id],
    queryFn: async () => {
      if (!currentShop?.id) return [];
      const response = await fetch(`/api/shops/${currentShop.id}/tables`);
      if (!response.ok) throw new Error("Failed to fetch tables");
      return response.json();
    },
    enabled: !!currentShop?.id,
  });

  const availableTables = tables.filter((table: Table) => 
    table.status === "available" || table.status === "cleaning"
  );

  const handleTableSelect = (table: Table) => {
    onTableSelect(table);
    setIsOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200";
      case "reserved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cleaning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const groupTablesBySection = (tables: Table[]) => {
    const grouped = tables.reduce((acc, table) => {
      const section = table.section || "Main Dining";
      if (!acc[section]) acc[section] = [];
      acc[section].push(table);
      return acc;
    }, {} as Record<string, Table[]>);

    // Sort tables within each section by number
    Object.keys(grouped).forEach(section => {
      grouped[section].sort((a, b) => {
        const aNum = parseInt(a.number) || 0;
        const bNum = parseInt(b.number) || 0;
        return aNum - bNum;
      });
    });

    return grouped;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <MapPin className="h-4 w-4 mr-2" />
          {selectedTable ? (
            <span className="flex items-center gap-2">
              Table {selectedTable.number}
              <Badge className={getStatusColor(selectedTable.status)} variant="outline">
                {selectedTable.status}
              </Badge>
            </span>
          ) : (
            "Select Table"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Table Selection
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="smart" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Smart Recommendations
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              All Tables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="smart" className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {selectedTable && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Current: Table {selectedTable.number}</span>
                    <Badge className={getStatusColor(selectedTable.status)} variant="outline">
                      {selectedTable.status}
                    </Badge>
                    {selectedTable.section && (
                      <span className="text-sm text-muted-foreground">• {selectedTable.section}</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onTableSelect(null)}>
                    Clear Selection
                  </Button>
                </div>
              )}

              <TableAssignmentOptimizer
                partySize={partySize}
                reservationTime={reservationTime}
                preferredSection={preferredSection}
                onTableSelect={handleTableSelect}
                selectedTable={selectedTable}
              />
            </div>
          </TabsContent>

          <TabsContent value="all" className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {selectedTable && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Current: Table {selectedTable.number}</span>
                    <Badge className={getStatusColor(selectedTable.status)} variant="outline">
                      {selectedTable.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onTableSelect(null)}>
                    Clear Selection
                  </Button>
                </div>
              )}
              
              {isLoading ? (
                <div className="text-center py-8">Loading tables...</div>
              ) : availableTables.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No available tables for party of {partySize}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupTablesBySection(availableTables)).map(([section, sectionTables]) => (
                    <div key={section}>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        {section}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {sectionTables.map((table: Table) => {
                          const isSelected = selectedTable?.id === table.id;
                          const canAccommodate = table.capacity >= partySize;
                          const capacityMatch = table.capacity === partySize;
                          
                          return (
                            <Card
                              key={table.id}
                              className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                              } ${!canAccommodate ? 'opacity-50' : ''} ${
                                capacityMatch ? 'border-green-300' : ''
                              }`}
                              onClick={() => canAccommodate && handleTableSelect(table)}
                            >
                              <div className="text-center space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold">Table {table.number}</span>
                                  {capacityMatch && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                      Perfect
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  <span className={canAccommodate ? '' : 'text-red-600 font-medium'}>
                                    {table.capacity} seats
                                  </span>
                                </div>
                                
                                <Badge className={getStatusColor(table.status)} variant="outline">
                                  {table.status}
                                </Badge>
                                
                                {!canAccommodate && (
                                  <div className="text-xs text-red-600">
                                    Too small for {partySize} guests
                                  </div>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}