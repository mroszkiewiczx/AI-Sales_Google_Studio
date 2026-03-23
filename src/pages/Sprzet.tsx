import React from "react";
import { motion } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Save, 
  RefreshCw, 
  Info,
  Server,
  Cpu,
  HardDrive,
  Monitor,
  MousePointer2,
  Package
} from "lucide-react";
import { useHardwareCalculator } from "@/hooks/useHardwareCalculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SprzetPage: React.FC = () => {
  const { 
    items, 
    total, 
    addItem, 
    updateItem, 
    removeItem, 
    clearItems, 
    calculate, 
    isCalculating 
  } = useHardwareCalculator();

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <Server className="w-10 h-10 text-blue-600" />
              Kalkulator Sprzętu
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Dobór infrastruktury sprzętowej i urządzeń peryferyjnych.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={clearItems}
              className="border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Wyczyść
            </Button>
            <Button 
              onClick={() => calculate()}
              disabled={isCalculating || items.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
            >
              {isCalculating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Zapisz Kalkulację
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-bottom border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">Pozycje Sprzętowe</CardTitle>
                    <CardDescription>Dodaj serwery, terminale, czytniki i inne urządzenia.</CardDescription>
                  </div>
                  <Button 
                    onClick={addItem}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj Pozycję
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                      <TableHead className="w-[60px] text-center">Lp.</TableHead>
                      <TableHead className="min-w-[200px]">Nazwa Urządzenia</TableHead>
                      <TableHead className="min-w-[250px]">Specyfikacja / Opis</TableHead>
                      <TableHead className="w-[150px] text-right">Cena Jedn. (PLN)</TableHead>
                      <TableHead className="w-[100px] text-center">Ilość</TableHead>
                      <TableHead className="w-[150px] text-right">Suma (PLN)</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="w-12 h-12 opacity-20" />
                            <p>Brak dodanych pozycji sprzętowych.</p>
                            <Button variant="link" onClick={addItem} className="text-blue-600">
                              Kliknij tutaj, aby dodać pierwszą pozycję
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                          <TableCell className="text-center font-medium text-slate-400">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={item.nazwa}
                              onChange={(e) => updateItem(item.id, { nazwa: e.target.value })}
                              placeholder="np. Serwer Dell PowerEdge"
                              className="border-transparent focus:border-blue-500 bg-transparent hover:bg-white transition-all"
                            />
                          </TableCell>
                          <TableCell>
                            <Textarea 
                              value={item.opis}
                              onChange={(e) => updateItem(item.id, { opis: e.target.value })}
                              placeholder="Specyfikacja techniczna..."
                              className="min-h-[40px] border-transparent focus:border-blue-500 bg-transparent hover:bg-white transition-all resize-none py-2"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={item.cena}
                              onChange={(e) => updateItem(item.id, { cena: parseFloat(e.target.value) || 0 })}
                              className="text-right border-transparent focus:border-blue-500 bg-transparent hover:bg-white transition-all"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={item.ilosc}
                              onChange={(e) => updateItem(item.id, { ilosc: parseInt(e.target.value) || 0 })}
                              className="text-center border-transparent focus:border-blue-500 bg-transparent hover:bg-white transition-all"
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-700">
                            {item.subtotal.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-blue-100 font-medium uppercase tracking-wider text-sm">Całkowity Koszt Sprzętu</p>
                  <h2 className="text-4xl font-bold">
                    {total.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} <span className="text-2xl font-normal opacity-80">PLN Netto</span>
                  </h2>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1">
                  Gotowy do eksportu
                </Badge>
                <p className="text-blue-100 text-sm italic opacity-80">
                  * Ceny nie zawierają podatku VAT (23%)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  Wskazówki
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="flex gap-3">
                  <Cpu className="w-5 h-5 text-slate-400 shrink-0" />
                  <p>Dobierz serwer z zapasem mocy obliczeniowej pod bazę danych SQL.</p>
                </div>
                <div className="flex gap-3">
                  <HardDrive className="w-5 h-5 text-slate-400 shrink-0" />
                  <p>Zalecamy dyski SSD NVMe dla optymalnej wydajności systemu.</p>
                </div>
                <div className="flex gap-3">
                  <Monitor className="w-5 h-5 text-slate-400 shrink-0" />
                  <p>Terminale produkcyjne powinny posiadać klasę szczelności IP65.</p>
                </div>
                <div className="flex gap-3">
                  <MousePointer2 className="w-5 h-5 text-slate-400 shrink-0" />
                  <p>Pamiętaj o czytnikach kodów kreskowych / RFID dla operatorów.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  Uwaga
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-700">
                Wszystkie pozycje w tym kalkulatorze są traktowane jako "Custom Items". Nie są one powiązane z konkretnymi produktami w HubSpot, ale zostaną wyeksportowane jako pozycje oferty.
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SprzetPage;
