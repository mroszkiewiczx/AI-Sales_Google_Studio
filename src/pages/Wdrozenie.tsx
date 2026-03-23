import React, { useState, useMemo } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { useImplementationCalculator, useImplementationProducts, ImplementationRow } from "@/hooks/useImplementationCalculator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wrench, 
  Plus, 
  Trash2, 
  GripVertical, 
  Search, 
  Calculator, 
  Save, 
  RotateCcw,
  Package,
  ShieldCheck,
  HeartPulse,
  GraduationCap,
  Truck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SortableRowProps {
  row: ImplementationRow;
  index: number;
  onUpdate: (id: string, updates: Partial<ImplementationRow>) => void;
  onRemove: (id: string) => void;
}

const SortableRow = ({ row, index, onUpdate, onRemove }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style}
      className={cn(isDragging && "bg-muted/50")}
    >
      <TableCell className="w-10">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="w-12 font-mono text-xs text-muted-foreground">
        {index + 1}
      </TableCell>
      <TableCell className="min-w-[200px]">
        <Input 
          value={row.nazwa} 
          onChange={(e) => onUpdate(row.id, { nazwa: e.target.value })}
          className="h-8"
        />
      </TableCell>
      <TableCell className="min-w-[250px]">
        <Input 
          value={row.opis} 
          onChange={(e) => onUpdate(row.id, { opis: e.target.value })}
          className="h-8"
          placeholder="Opcjonalny opis..."
        />
      </TableCell>
      <TableCell className="w-[140px]">
        <Select 
          value={row.model} 
          onValueChange={(val: any) => onUpdate(row.id, { model: val })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Jednorazowo">Jednorazowo</SelectItem>
            <SelectItem value="Miesięcznie">Miesięcznie</SelectItem>
            <SelectItem value="Rocznie">Rocznie</SelectItem>
            <SelectItem value="Ratalna">Ratalna</SelectItem>
            <SelectItem value="Leasing">Leasing</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="w-[120px]">
        <Input 
          type="number"
          value={row.cena} 
          onChange={(e) => onUpdate(row.id, { cena: parseFloat(e.target.value) || 0 })}
          className="h-8 text-right"
        />
      </TableCell>
      <TableCell className="w-[80px]">
        <Input 
          type="number"
          value={row.ilosc} 
          onChange={(e) => onUpdate(row.id, { ilosc: parseFloat(e.target.value) || 0 })}
          className="h-8 text-center"
        />
      </TableCell>
      <TableCell className="w-[120px] text-right font-medium">
        {(row.cena * row.ilosc).toLocaleString('pl-PL', { minimumFractionDigits: 2 })}
      </TableCell>
      <TableCell className="w-10">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(row.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

// Helper components for Table structure
const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("w-full overflow-auto", className)}>
    <table className="w-full caption-bottom text-sm">
      {children}
    </table>
  </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="[&_tr]:border-b">
    {children}
  </thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="[&_tr:last-child]:border-0">
    {children}
  </tbody>
);

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th className={cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)}>
    {children}
  </th>
);

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export default function WdrozeniePage() {
  const { t } = useI18n();
  const { 
    rows, 
    addRow, 
    removeRow, 
    updateRow, 
    reorderRows, 
    clearRows,
    results, 
    calculateMutation,
    isCalculating 
  } = useImplementationCalculator();
  
  const { data: products = [] } = useImplementationProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rows.findIndex((r) => r.id === active.id);
      const newIndex = rows.findIndex((r) => r.id === over.id);
      reorderRows(oldIndex, newIndex);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => 
      p.nazwa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.grupa.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredProducts.forEach(p => {
      if (!groups[p.grupa]) groups[p.grupa] = [];
      groups[p.grupa].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'Pakiety': return <Package className="h-4 w-4" />;
      case 'Bezpieczne': return <ShieldCheck className="h-4 w-4" />;
      case 'Opieka': return <HeartPulse className="h-4 w-4" />;
      case 'Szkolenia': return <GraduationCap className="h-4 w-4" />;
      case 'Zwroty': return <Truck className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("wdrozenie.title")}</h1>
          <p className="text-muted-foreground">Konfiguracja usług wdrożeniowych, szkoleń i opieki serwisowej.</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("wdrozenie.search")}
                  className="pl-9 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <ScrollArea className="h-80">
                <div className="p-2 space-y-4">
                  {Object.entries(groupedProducts).map(([group, items]) => (
                    <div key={group} className="space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 rounded">
                        {getGroupIcon(group)}
                        {group}
                      </div>
                      {items.map(product => (
                        <button
                          key={product.id}
                          className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => {
                            addRow({
                              nazwa: product.nazwa,
                              cena: product.cena_bazowa,
                              model: product.model,
                              product_id: product.id
                            });
                            setPopoverOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span>{product.nazwa}</span>
                            <span className="text-xs font-mono text-muted-foreground">
                              {product.cena_bazowa.toLocaleString()} PLN
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nie znaleziono produktów
                    </div>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Button onClick={() => addRow()} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("wdrozenie.addRow")}
          </Button>
          <Button onClick={clearRows} variant="ghost" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
            <RotateCcw className="h-4 w-4" />
            {t("wdrozenie.clear")}
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="w-12">Lp.</TableHead>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Opis</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Cena (PLN)</TableHead>
                  <TableHead className="text-center">Ilość</TableHead>
                  <TableHead className="text-right">Suma</TableHead>
                  <TableHead className="w-10">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext 
                  items={rows.map(r => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence initial={false}>
                    {rows.map((row, index) => (
                      <SortableRow 
                        key={row.id} 
                        row={row} 
                        index={index} 
                        onUpdate={updateRow}
                        onRemove={removeRow}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Wrench className="h-8 w-8 opacity-20" />
                        <p>Brak pozycji w kalkulacji. Dodaj pozycję ręcznie lub wyszukaj produkt.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("wdrozenie.sumaJdn")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(results?.sumaJdn || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("wdrozenie.sumaMies")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(results?.sumaMies || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
            </div>
            <p className="text-xs text-muted-foreground">/ miesięcznie</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("wdrozenie.sumaRocz")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(results?.sumaRocz || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
            </div>
            <p className="text-xs text-muted-foreground">/ rocznie</p>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2 justify-center">
          <Button 
            size="lg" 
            className="w-full gap-2 shadow-lg shadow-primary/20" 
            onClick={() => calculateMutation.mutate({ save: false })}
            disabled={isCalculating || rows.length === 0}
          >
            <Calculator className={cn("h-4 w-4", isCalculating && "animate-spin")} />
            {t("wdrozenie.calculate")}
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full gap-2" 
            onClick={() => calculateMutation.mutate({ save: true })}
            disabled={isCalculating || rows.length === 0}
          >
            <Save className="h-4 w-4" />
            {t("wdrozenie.saveToOffer")}
          </Button>
        </div>
      </div>
    </div>
  );
}
