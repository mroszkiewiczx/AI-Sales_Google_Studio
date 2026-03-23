import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  FileText, 
  Search, 
  Building2, 
  User, 
  Users, 
  Calculator, 
  CreditCard, 
  Save, 
  Send, 
  FileDown, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Info,
  ArrowRight,
  RefreshCw,
  LayoutDashboard
} from "lucide-react";
import { useOfferSummary, OfferSummary } from "@/hooks/useOfferSummary";
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const OfertaSumPage: React.FC = () => {
  const { summaryId } = useParams<{ summaryId: string }>();
  const navigate = useNavigate();
  const { 
    summary, 
    isLoading, 
    save, 
    isSaving, 
    lookupCompany, 
    isLookingUp, 
    createHubSpotDeal, 
    isCreatingDeal, 
    exportPdf, 
    isExportingPdf 
  } = useOfferSummary(summaryId);

  const [formData, setFormData] = useState<Partial<OfferSummary>>({
    client_name: "",
    client_nip: "",
    client_krs: "",
    client_regon: "",
    client_address: "",
    client_contact_person: "",
    client_contact_date: new Date().toISOString().split('T')[0],
    decision_makers: [],
    payment_schedule: [],
    notes: "",
  });

  useEffect(() => {
    if (summary) {
      setFormData(summary);
    }
  }, [summary]);

  const handleLookup = async () => {
    if (!formData.client_nip) return;
    try {
      const data = await lookupCompany({ nip: formData.client_nip });
      setFormData(prev => ({
        ...prev,
        client_name: data.name,
        client_regon: data.regon,
        client_krs: data.krs,
        client_address: data.address,
      }));
    } catch (e) {
      console.error("Lookup failed", e);
    }
  };

  const addDecisionMaker = () => {
    setFormData(prev => ({
      ...prev,
      decision_makers: [...(prev.decision_makers || []), { name: "", role: "", email: "", phone: "" }]
    }));
  };

  const updateDecisionMaker = (index: number, updates: any) => {
    const newMakers = [...(formData.decision_makers || [])];
    newMakers[index] = { ...newMakers[index], ...updates };
    setFormData(prev => ({ ...prev, decision_makers: newMakers }));
  };

  const removeDecisionMaker = (index: number) => {
    const newMakers = [...(formData.decision_makers || [])];
    newMakers.splice(index, 1);
    setFormData(prev => ({ ...prev, decision_makers: newMakers }));
  };

  const addPaymentInstallment = () => {
    setFormData(prev => ({
      ...prev,
      payment_schedule: [...(prev.payment_schedule || []), { date: "", amount: 0, description: "", paid: false }]
    }));
  };

  const updatePaymentInstallment = (index: number, updates: any) => {
    const newSchedule = [...(formData.payment_schedule || [])];
    newSchedule[index] = { ...newSchedule[index], ...updates };
    setFormData(prev => ({ ...prev, payment_schedule: newSchedule }));
  };

  const removePaymentInstallment = (index: number) => {
    const newSchedule = [...(formData.payment_schedule || [])];
    newSchedule.splice(index, 1);
    setFormData(prev => ({ ...prev, payment_schedule: newSchedule }));
  };

  const handleSave = () => {
    save(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <FileText className="w-10 h-10 text-blue-600" />
              Podsumowanie Oferty
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Zbiorcze zestawienie wszystkich modułów i warunków handlowych.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleSave}
              disabled={isSaving}
              className="border-slate-200 hover:bg-slate-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Zapisz Szkic
            </Button>
            <Button 
              onClick={() => createHubSpotDeal()}
              disabled={isCreatingDeal || !summaryId}
              className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200"
            >
              {isCreatingDeal ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LayoutDashboard className="w-4 h-4 mr-2" />
              )}
              Generuj Deal HubSpot
            </Button>
            <Button 
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Eksport PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Client Data & Decision Makers */}
          <div className="lg:col-span-2 space-y-8">
            {/* Client Data Section */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Dane Klienta
                </CardTitle>
                <CardDescription>Wyszukaj firmę po NIP lub wprowadź dane ręcznie.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nip">NIP Firmy</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="nip"
                        placeholder="Wpisz NIP..."
                        value={formData.client_nip}
                        onChange={(e) => setFormData(prev => ({ ...prev, client_nip: e.target.value }))}
                        className="bg-slate-50/50"
                      />
                      <Button 
                        variant="secondary" 
                        onClick={handleLookup}
                        disabled={isLookingUp || !formData.client_nip}
                        className="shrink-0"
                      >
                        {isLookingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="krs">KRS (opcjonalnie)</Label>
                    <Input 
                      id="krs"
                      placeholder="Wpisz KRS..."
                      value={formData.client_krs}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_krs: e.target.value }))}
                      className="bg-slate-50/50"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="name">Pełna Nazwa Firmy</Label>
                    <Input 
                      id="name"
                      placeholder="Nazwa firmy..."
                      value={formData.client_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                      className="bg-slate-50/50"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address">Adres Siedziby</Label>
                    <Textarea 
                      id="address"
                      placeholder="Ulica, nr, kod pocztowy, miasto..."
                      value={formData.client_address}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_address: e.target.value }))}
                      className="bg-slate-50/50 min-h-[80px]"
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Osoba Kontaktowa</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        id="contact"
                        placeholder="Imię i Nazwisko"
                        value={formData.client_contact_person}
                        onChange={(e) => setFormData(prev => ({ ...prev, client_contact_person: e.target.value }))}
                        className="pl-10 bg-slate-50/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data Kontaktu</Label>
                    <Input 
                      id="date"
                      type="date"
                      value={formData.client_contact_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_contact_date: e.target.value }))}
                      className="bg-slate-50/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Decision Makers Section */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Osoby Decyzyjne
                  </CardTitle>
                  <CardDescription>Komitet zakupowy po stronie klienta.</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addDecisionMaker}
                  className="border-slate-200 hover:bg-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj Osobę
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30">
                      <TableHead>Imię i Nazwisko</TableHead>
                      <TableHead>Rola / Stanowisko</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.decision_makers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-400 italic">
                          Brak zdefiniowanych osób decyzyjnych.
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.decision_makers?.map((dm, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input 
                              value={dm.name}
                              onChange={(e) => updateDecisionMaker(idx, { name: e.target.value })}
                              className="border-none bg-transparent focus:bg-white"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={dm.role}
                              onChange={(e) => updateDecisionMaker(idx, { role: e.target.value })}
                              className="border-none bg-transparent focus:bg-white"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={dm.email}
                              onChange={(e) => updateDecisionMaker(idx, { email: e.target.value })}
                              className="border-none bg-transparent focus:bg-white"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={dm.phone}
                              onChange={(e) => updateDecisionMaker(idx, { phone: e.target.value })}
                              className="border-none bg-transparent focus:bg-white"
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeDecisionMaker(idx)}
                              className="text-slate-300 hover:text-red-600"
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

            {/* Payment Schedule Section */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Harmonogram Płatności
                  </CardTitle>
                  <CardDescription>Planowane raty i terminy płatności.</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addPaymentInstallment}
                  className="border-slate-200 hover:bg-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj Ratę
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30">
                      <TableHead className="w-[150px]">Termin</TableHead>
                      <TableHead className="w-[150px] text-right">Kwota (PLN)</TableHead>
                      <TableHead>Opis / Etap</TableHead>
                      <TableHead className="w-[100px] text-center">Zapłacono</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.payment_schedule?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-400 italic">
                          Brak zdefiniowanego harmonogramu.
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.payment_schedule?.map((p, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input 
                              type="date"
                              value={p.date}
                              onChange={(e) => updatePaymentInstallment(idx, { date: e.target.value })}
                              className="border-none bg-transparent focus:bg-white"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={p.amount}
                              onChange={(e) => updatePaymentInstallment(idx, { amount: parseFloat(e.target.value) || 0 })}
                              className="text-right border-none bg-transparent focus:bg-white"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={p.description}
                              onChange={(e) => updatePaymentInstallment(idx, { description: e.target.value })}
                              className="border-none bg-transparent focus:bg-white"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input 
                              type="checkbox"
                              checked={p.paid}
                              onChange={(e) => updatePaymentInstallment(idx, { paid: e.target.checked })}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removePaymentInstallment(idx)}
                              className="text-slate-300 hover:text-red-600"
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
          </div>

          {/* Right Column: Calculator Aggregation & Status */}
          <div className="space-y-8">
            {/* Status Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Status Oferty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status:</span>
                  <Badge className={
                    formData.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                    formData.status === 'generated' ? 'bg-orange-100 text-orange-600' :
                    'bg-emerald-100 text-emerald-600'
                  }>
                    {formData.status === 'draft' ? 'Szkic' : 
                     formData.status === 'generated' ? 'Deal HubSpot' : 'Wysłano'}
                  </Badge>
                </div>
                
                {formData.hubspot_deal_id && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-800 font-medium">HubSpot Deal ID:</span>
                      <span className="text-orange-600 font-mono">{formData.hubspot_deal_id}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-orange-600/70">
                      <span>Zsynchronizowano:</span>
                      <span>{new Date(formData.hubspot_synced_at!).toLocaleString()}</span>
                    </div>
                    <Button variant="link" className="p-0 h-auto text-xs text-orange-700 hover:text-orange-800 flex items-center gap-1">
                      Otwórz w HubSpot <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notatki wewnętrzne</Label>
                  <Textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Wpisz uwagi do oferty..."
                    className="min-h-[100px] bg-slate-50/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calculator Aggregation */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Składniki Oferty
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {/* Licencje */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">Licencje Systemowe</p>
                      <div className="flex items-center gap-2">
                        {summary?.license_calc_id ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] py-0">Gotowe</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 text-[10px] py-0">Brak</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {summary?.license_calculations?.total_net?.toLocaleString() || "0"} zł
                      </p>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs text-blue-600" onClick={() => navigate('/licencje')}>
                        Edytuj <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Wdrożenie */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">Usługi Wdrożeniowe</p>
                      <div className="flex items-center gap-2">
                        {summary?.implementation_calc_id ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] py-0">Gotowe</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 text-[10px] py-0">Brak</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {summary?.implementation_calculations?.suma_jdn?.toLocaleString() || "0"} zł
                      </p>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs text-blue-600" onClick={() => navigate('/wdrozenie')}>
                        Edytuj <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Programowanie */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">Prace Programistyczne</p>
                      <div className="flex items-center gap-2">
                        {summary?.dev_calc_id ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] py-0">Gotowe</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 text-[10px] py-0">Brak</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {summary?.dev_calculations?.total?.toLocaleString() || "0"} zł
                      </p>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs text-blue-600" onClick={() => navigate('/programowanie')}>
                        Edytuj <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Sprzęt */}
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">Infrastruktura i Sprzęt</p>
                      <div className="flex items-center gap-2">
                        {summary?.hardware_calc_id ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] py-0">Gotowe</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 text-[10px] py-0">Brak</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {summary?.hardware_calculations?.total?.toLocaleString() || "0"} zł
                      </p>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs text-blue-600" onClick={() => navigate('/sprzet')}>
                        Edytuj <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-blue-600 text-white">
                  <p className="text-blue-100 text-xs uppercase tracking-wider font-medium mb-1">Suma Całkowita Netto</p>
                  <p className="text-3xl font-bold">
                    {(
                      (summary?.license_calculations?.total_net || 0) +
                      (summary?.implementation_calculations?.suma_jdn || 0) +
                      (summary?.dev_calculations?.total || 0) +
                      (summary?.hardware_calculations?.total || 0)
                    ).toLocaleString()} <span className="text-lg font-normal opacity-80 text-blue-100">PLN</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ROI Snapshot */}
            <Card className="border-emerald-100 bg-emerald-50/30 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Analiza ROI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-700">Zwrot z inwestycji:</span>
                  <span className="font-bold text-emerald-900">{summary?.roi_calculations?.payback_months || "—"} msc</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-700">Roczne oszczędności:</span>
                  <span className="font-bold text-emerald-900">{summary?.roi_calculations?.total_gain?.toLocaleString() || "0"} zł</span>
                </div>
                <Button variant="link" size="sm" className="w-full text-emerald-700 hover:text-emerald-800 p-0 h-auto text-xs" onClick={() => navigate('/roi')}>
                  Przejdź do kalkulatora ROI <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OfertaSumPage;
