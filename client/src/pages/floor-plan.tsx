import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Eye, Edit3, Palette, Save, RotateCcw, Grid, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useShop } from "@/lib/shop-context";
import { useToast } from "@/hooks/use-toast";
import AddTableDialog from "@/components/restaurant/host/AddTableDialog";
import type { Table } from "@shared/schema";
import { useTranslation } from "react-i18next";

type LayoutMode = 'view' | 'edit' | 'arrange';
type ColorTheme = 'modern' | 'classic' | 'vibrant' | 'minimal';

export default function FloorPlan() {
  const { t } = useTranslation();
  const [showAddTable, setShowAddTable] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('view');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('modern');
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const { currentShop } = useShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const updateTablePositionMutation = useMutation({
    mutationFn: async ({ tableId, xPosition, yPosition }: { tableId: number; xPosition: number; yPosition: number }) => {
      if (!currentShop?.id) throw new Error(t('common.shop.noAssigned'));
      
      const response = await fetch(`/api/shops/${currentShop.id}/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xPosition, yPosition }),
      });

      if (!response.ok) {
        throw new Error(t('restaurant.updateTablePositionError'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", currentShop?.id] });
      toast({
        title: t('restaurant.tableUpdated'),
        description: t('restaurant.tableStatusUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('restaurant.updateTablePositionError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Color themes configuration
  const colorThemes = {
    modern: {
      name: 'Modern',
      canvas: 'bg-slate-50',
      available: "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-lg",
      occupied: "bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-lg", 
      reserved: "bg-blue-500 hover:bg-blue-600 text-white border-blue-600 shadow-lg",
      cleaning: "bg-amber-500 hover:bg-amber-600 text-black border-amber-600 shadow-lg"
    },
    classic: {
      name: 'Classic',
      canvas: 'bg-amber-50',
      available: "bg-green-600 hover:bg-green-700 text-white border-green-700 shadow-md",
      occupied: "bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-md",
      reserved: "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-md",
      cleaning: "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-600 shadow-md"
    },
    vibrant: {
      name: 'Vibrant',
      canvas: 'bg-purple-50',
      available: "bg-lime-400 hover:bg-lime-500 text-lime-900 border-lime-500 shadow-xl",
      occupied: "bg-pink-400 hover:bg-pink-500 text-pink-900 border-pink-500 shadow-xl",
      reserved: "bg-cyan-400 hover:bg-cyan-500 text-cyan-900 border-cyan-500 shadow-xl",
      cleaning: "bg-orange-400 hover:bg-orange-500 text-orange-900 border-orange-500 shadow-xl"
    },
    minimal: {
      name: 'Minimal',
      canvas: 'bg-gray-100',
      available: "bg-white hover:bg-gray-50 text-gray-900 border-gray-300 shadow-sm",
      occupied: "bg-gray-800 hover:bg-gray-900 text-white border-gray-900 shadow-sm",
      reserved: "bg-gray-600 hover:bg-gray-700 text-white border-gray-700 shadow-sm",
      cleaning: "bg-gray-400 hover:bg-gray-500 text-white border-gray-500 shadow-sm"
    }
  };

  const currentTheme = colorThemes[colorTheme];

  // Mode handlers
  const handleModeChange = useCallback((mode: LayoutMode) => {
    console.log('Changing layout mode from', layoutMode, 'to', mode);
    setLayoutMode(mode);
    setSelectedTable(null);
    toast({
      title: `${mode === 'view' ? 'View' : mode === 'edit' ? 'Edit' : 'Arrange'} Mode`,
      description: `Switched to ${mode} mode`,
    });
  }, [layoutMode, toast]);

  const handleThemeChange = useCallback((theme: ColorTheme) => {
    setColorTheme(theme);
    toast({
      title: 'Theme Changed',
      description: `Applied ${colorThemes[theme].name} theme`,
    });
  }, [toast]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, table: Table) => {
    if (layoutMode !== 'arrange') return;
    setDraggedTable(table);
    e.dataTransfer.effectAllowed = 'move';
  }, [layoutMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTable || layoutMode !== 'arrange') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const tableWidth = 140;
    const tableHeight = 110;
    const padding = 16;
    
    const xPosition = Math.max(padding, Math.min(rect.width - tableWidth - padding, e.clientX - rect.left - tableWidth / 2));
    const yPosition = Math.max(padding, Math.min(rect.height - tableHeight - padding, e.clientY - rect.top - tableHeight / 2));

    // Check for collisions with other tables
    const hasCollision = tables.some((table: Table) => {
      if (table.id === draggedTable.id) return false;
      const tableX = table.xPosition || 50;
      const tableY = table.yPosition || 50;
      
      return (
        xPosition < tableX + tableWidth + padding &&
        xPosition + tableWidth + padding > tableX &&
        yPosition < tableY + tableHeight + padding &&
        yPosition + tableHeight + padding > tableY
      );
    });

    if (!hasCollision) {
      updateTablePositionMutation.mutate({
        tableId: draggedTable.id,
        xPosition,
        yPosition
      });
    } else {
      toast({
        title: t('restaurant.positionBlocked'),
        description: t('restaurant.tableCollisionWarning'),
        variant: "destructive",
      });
    }

    setDraggedTable(null);
  }, [draggedTable, layoutMode, tables, updateTablePositionMutation, toast, t]);

  const handleSaveLayout = useCallback(() => {
    setLayoutMode('view');
    toast({
      title: t('restaurant.layoutSaved'),
      description: t('restaurant.layoutSavedSuccess'),
    });
  }, [toast, t]);

  const resetTablePositions = useCallback(() => {
    // Reset all tables to default grid positions
    tables.forEach((table: Table, index: number) => {
      const defaultX = 50 + (index % 4) * 160;
      const defaultY = 50 + Math.floor(index / 4) * 130;
      
      updateTablePositionMutation.mutate({
        tableId: table.id,
        xPosition: defaultX,
        yPosition: defaultY
      });
    });
  }, [tables, updateTablePositionMutation]);

  // Stats
  const totalCapacity = tables.reduce((sum: number, table: Table) => sum + table.capacity, 0);
  const statusCounts = tables.reduce((acc: Record<string, number>, table: Table) => {
    acc[table.status] = (acc[table.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('restaurant.loadingFloorPlan')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🏢 NEW Floor Plan Manager v2.0</h1>
            <p className="text-gray-600">✨ Redesigned interface for restaurant layout management</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mode Selector */}
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <Button
                variant={layoutMode === 'view' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('view')}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button
                variant={layoutMode === 'edit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('edit')}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant={layoutMode === 'arrange' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('arrange')}
                className="flex items-center gap-2"
              >
                <Grid className="h-4 w-4" />
                Arrange
              </Button>
            </div>

            {/* Action Buttons */}
            <Button onClick={() => setShowAddTable(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Table
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Layout Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Color Theme</label>
                  <div className="flex gap-2">
                    {Object.entries(colorThemes).map(([key, theme]) => (
                      <Button
                        key={key}
                        variant={colorTheme === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange(key as ColorTheme)}
                      >
                        {theme.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {layoutMode === 'arrange' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Quick Actions</label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={resetTablePositions}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Layout
                      </Button>
                      <Button size="sm" onClick={handleSaveLayout}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Layout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Main Floor Plan */}
          <div className="xl:col-span-3">
            <Card className="h-[700px] overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Restaurant Layout
                    <Badge variant={layoutMode === 'view' ? 'secondary' : 'default'}>
                      {layoutMode === 'view' ? 'View Mode' : layoutMode === 'edit' ? 'Edit Mode' : 'Arrange Mode'}
                    </Badge>
                  </CardTitle>
                  {layoutMode === 'arrange' && (
                    <div className="text-sm text-gray-500">
                      Drag tables to rearrange layout
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  className={`relative h-[600px] ${currentTheme.canvas} border-t`}
                  style={{
                    backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                  }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {tables.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Plus className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tables configured</h3>
                        <p className="text-gray-500 mb-4">Start by adding your first table to the floor plan</p>
                        <Button onClick={() => setShowAddTable(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Table
                        </Button>
                      </div>
                    </div>
                  ) : (
                    tables.map((table: Table, index: number) => {
                      const defaultX = 50 + (index % 4) * 160;
                      const defaultY = 50 + Math.floor(index / 4) * 130;
                      
                      return (
                        <div
                          key={table.id}
                          className={`absolute transition-all duration-200 ${
                            layoutMode === 'arrange' ? 'cursor-move' : 'cursor-pointer'
                          } ${selectedTable?.id === table.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                          style={{
                            left: table.xPosition ?? defaultX,
                            top: table.yPosition ?? defaultY,
                            width: '140px',
                            height: '110px',
                            zIndex: draggedTable?.id === table.id ? 50 : 10
                          }}
                          draggable={layoutMode === 'arrange'}
                          onDragStart={(e) => handleDragStart(e, table)}
                          onClick={() => layoutMode === 'edit' && setSelectedTable(table)}
                        >
                          <Card className={`w-full h-full ${currentTheme[table.status as keyof typeof currentTheme]} transition-all hover:scale-105`}>
                            <CardContent className="p-3 h-full flex flex-col justify-center items-center text-center">
                              <div className="font-bold text-lg mb-1">Table {table.number}</div>
                              <div className="text-sm opacity-90 mb-1">{table.capacity} seats</div>
                              {table.section && (
                                <div className="text-xs opacity-75">{table.section}</div>
                              )}
                              <Badge variant="secondary" className="mt-2 text-xs">
                                {t(`restaurant.status.${table.status}`)}
                              </Badge>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{tables.length}</div>
                    <div className="text-sm text-gray-500">Total Tables</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{totalCapacity}</div>
                    <div className="text-sm text-gray-500">Total Seats</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Available</span>
                    <Badge variant="secondary">{statusCounts.available || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Occupied</span>
                    <Badge variant="secondary">{statusCounts.occupied || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reserved</span>
                    <Badge variant="secondary">{statusCounts.reserved || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cleaning</span>
                    <Badge variant="secondary">{statusCounts.cleaning || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Status Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${currentTheme.available}`}></div>
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${currentTheme.occupied}`}></div>
                  <span className="text-sm">Occupied</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${currentTheme.reserved}`}></div>
                  <span className="text-sm">Reserved</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${currentTheme.cleaning}`}></div>
                  <span className="text-sm">Cleaning</span>
                </div>
              </CardContent>
            </Card>

            {/* Mode Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Mode Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {layoutMode === 'view' && (
                  <div>
                    <div className="font-medium text-green-600 mb-2">👁️ View Mode</div>
                    <p className="text-gray-600">View-only mode for monitoring table status and layout.</p>
                  </div>
                )}
                {layoutMode === 'edit' && (
                  <div>
                    <div className="font-medium text-blue-600 mb-2">✏️ Edit Mode</div>
                    <p className="text-gray-600">Click tables to edit their properties, status, and details.</p>
                  </div>
                )}
                {layoutMode === 'arrange' && (
                  <div>
                    <div className="font-medium text-purple-600 mb-2">🎯 Arrange Mode</div>
                    <p className="text-gray-600">Drag and drop tables to rearrange the floor plan layout.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddTableDialog 
        isOpen={showAddTable}
        onOpenChange={setShowAddTable}
      />
    </div>
  );
}