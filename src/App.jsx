import React, { useState, useEffect } from 'react';
import './index.css';
import { Copy, Check, Plane, DollarSign, Calendar, MessageSquare, Plus, Trash2, Download, Settings, Users, History, FileText, Send, GripVertical, Calculator } from 'lucide-react';
// import productsUnified from './data/products_unified.json'; // DEPRECATED: Supabase is the source of truth
// [REMEDIACIÓN 1.2] db.js TOTALMENTE DEPRECIADO — Todas las funciones ahora viven en supabase.js
// Las funciones deleteContact, cleanDuplicateProducts, cleanDuplicateContacts
// fueron marcadas como deprecated en db.js. Se eliminan sus imports para evitar crasheos.
// Si se necesita deleteContact, usar directamente supabase.from('contacts').delete().

import logo from './assets/logo.png';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { parsePriceUpdateAI, getGeminiKey, setGeminiKey } from './gemini';
import { getProviderMessage } from './data/providerTemplates';
import { 
  getProductsFromSupabase, updateProductSupabase, saveProductSupabase, deleteProductSupabase,
  saveBookingSupabase, getContactsFromSupabase, getConfirmationsFromSupabase,
  deleteConfirmationSupabase, deleteContactSupabase // [REMEDIACIÓN 1.2] deleteContactSupabase reemplaza db.js
} from './supabase';

// Modular Components & Utils
import HistoryDashboard from './components/HistoryDashboard';
import ContactsDashboard from './components/ContactsDashboard';
import FinanceDashboard from './components/FinanceDashboard';
import SettingsDashboard from './components/SettingsDashboard';
import SortableTourRow from './components/SortableTourRow';
import PassengerForm from './components/PassengerForm';
import BookingDetails from './components/BookingDetails';
import VoucherPreview from './components/VoucherPreview';
import { useBookingTotals } from './hooks/useBookingTotals';
import { usePricesMap } from './hooks/usePricesMap';
import { useAIProcessor } from './hooks/useAIProcessor';
import { useProductCatalog } from './hooks/useProductCatalog';
import { useBookingPersistence } from './hooks/useBookingPersistence';
import { formatCOP, formatDateDisplay, formatCurrency, toTitleCase } from './utils/formatters';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const INITIAL_BOOKING_STATE = {
  name: '',
  passport: '',
  cpf: '',
  address: '',
  cep: '',
  dob: '',
  email: '',
  phone: '',
  instagram: '',
  city: '',
  arrival: '',
  departure: '',
  pax: '',
  paxChildren: '',
  companions: '',
  hotel: '',
  source: '',
  nextDestination: '',
  emergency: '',
  motivoViagem: '',
  geniLink: '',
  voucherObservations: '',
  discountValue: 0,
  discountType: 'PERCENT', // or 'COP'
  childAges: [],
  companionList: [],
  tours: []
};


const App = () => {
  const [activeTab, setActiveTab] = useState('booking'); // booking, history, contacts, settings
  const [step, setStep] = useState(1);
  const [rawMessage, setRawMessage] = useState('');
  const [bookingData, setBookingData] = useState(INITIAL_BOOKING_STATE);
  const [isCopying, setIsCopying] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingPDF, setIsSavingPDF] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [contactsData, setContactsData] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);
  
  // Hook de Catálogo (Centraliza Productos y Tasas)
  const {
    pricesDb,
    setPricesDb,
    exchangeRate,
    setExchangeRate,
    manualRate,
    setManualRate,
    isProcessingAI: isProcessingCatalogAI,
    setIsProcessingAI: setIsProcessingCatalogAI,
    priceUpdateText,
    setPriceUpdateText,
    handleAIPriceUpdate,
    syncBookingWithCatalog
  } = useProductCatalog();

  const [aiKeyInput, setAiKeyInput] = useState(getGeminiKey());
  const [whatsappText, setWhatsappText] = useState('');
  const [showProviderMsgs, setShowProviderMsgs] = useState(false);
  const [toursSuggestions, setToursSuggestions] = useState([]);
  const [priceSearch, setPriceSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [contactSearch, setContactSearch] = useState('');
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [globalTaxasText, setGlobalTaxasText] = useState(localStorage.getItem('TET_GLOBAL_TAXAS_TEXT') || 'Taxas: [VALOR] por pessoa somente em dinero pesos colombianos (sujeitos a alteração)');
  const [offlineMode, setOfflineMode] = useState(false);

  // Hook Financeiro
  const {
    paymentMethod,
    setPaymentMethod,
    wiseMarkup,
    setWiseMarkup,
    financialOverrides,
    setFinancialOverrides,
    totals,
    generateWhatsAppMessage
  } = useBookingTotals(bookingData, pricesDb, exchangeRate, manualRate);

  // Hook: O(1) product catalog lookup (replaces all .find() calls on pricesDb)
  const { findProduct } = usePricesMap(pricesDb);

  // Hook: Gemini AI orchestration (processMessage, handleSmartUpdate)
  const {
    isProcessingAI: isProcessingBookingAI,
    setIsProcessingAI: setIsProcessingBookingAI,
    processMessage,
    handleSmartUpdate,
  } = useAIProcessor({
    pricesDb,
    findProduct,
    bookingData,
    setBookingData,
    setStep,
    offlineMode,
  });

  // Hook de Persistencia (Guardado y Borrado)
  const {
    isSavingData,
    handleSaveData,
    handleDeleteConfirmation
  } = useBookingPersistence({
    bookingData,
    setBookingData,
    pricesDb,
    totals,
    paymentMethod,
    notes,
    setHistoryData,
    setLoadingTab
  });

  // Derived Processing State
  const isProcessingAI = isProcessingBookingAI || isProcessingCatalogAI;
  const setIsProcessingAI = (val) => {
    setIsProcessingBookingAI(val);
    setIsProcessingCatalogAI(val);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      setBookingData((prev) => {
        const oldIndex = prev.tours.findIndex((t) => String(t.uuid) === String(active.id));
        const newIndex = prev.tours.findIndex((t) => String(t.uuid) === String(over.id));
        return {
          ...prev,
          tours: arrayMove(prev.tours, oldIndex, newIndex)
        };
      });
    }
  };

  // Auto-load data when switching to History or Contacts tab
  useEffect(() => {
    const loadTabData = async () => {
      if (activeTab === 'history') {
        setLoadingTab(true);
        const data = await getConfirmationsFromSupabase(20);
        setHistoryData(data);
        setLoadingTab(false);
      } else if (activeTab === 'contacts') {
        setLoadingTab(true);
        const data = await getContactsFromSupabase();
        setContactsData(data);
        setLoadingTab(false);
      }
    };
    loadTabData();
  }, [activeTab]);

  // Sync bookingData with pricesDb updates (e.g. from Settings)
  useEffect(() => {
    syncBookingWithCatalog(bookingData, setBookingData);
  }, [pricesDb]);

  // Date Formatter Helper for Filename
  const formatDateForFilename = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'sem-data';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Copy WhatsApp message to clipboard
  const copyToClipboard = async () => {
    if (isCopying) return;
    try {
      const text = generateWhatsAppMessage();
      await navigator.clipboard.writeText(text);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
      alert('Erro ao copiar para a área de transferência.');
    }
  };





  // Load a history item back into the booking editor
  const loadFromHistory = (item) => {
    setBookingData({
      id: item.id,
      name: item.name || '',
      passport: item.passport || '',
      cpf: item.cpf || '',
      address: item.address || '',
      cep: item.cep || '',
      dob: item.dob || '',
      email: item.email || '',
      phone: item.phone || '',
      instagram: item.instagram || '',
      city: item.city || '',
      arrival: item.arrival || '',
      departure: item.departure || '',
      pax: item.pax || '',
      paxChildren: item.paxChildren || '',
      companions: item.companions || '',
      hotel: item.hotel || '',
      source: item.source || '',
      nextDestination: item.nextDestination || '',
      emergency: item.emergency || '',
      motivoViagem: item.motivoViagem || '',
      geniLink: item.geniLink || '',
      voucherObservations: item.voucherObservations || '',
      discountValue: item.discountValue || 0,
      discountType: item.discountType || 'PERCENT',
      companionList: item.companionList || [],
      childAges: item.childAges || [],  // BUGFIX: guard against undefined crash on .map()
      tours: item.tours || []
    });
    setNotes(item.notes || '');
    setPaymentMethod(item.paymentMethod || 'entrada_saldo');
    setActiveTab('booking');
    setStep(2);
  };

  // Smart Command Handler — Gemini AI


  // Export contacts to CSV - Robust Version
  const exportContactsCSV = () => {
    if (contactsData.length === 0) {
      alert('Nenhum contato para exportar.');
      return;
    }
    const headers = [
      'Nome', 'Telefone', 'Email', 'Instagram', 'CPF', 'Passaporte',
      'Data Nascimento', 'Endereço', 'CEP', 'Cidade',
      'Hotel', 'Chegada', 'Saída', 'Pax', 'Acompanhantes',
      'Fonte', 'Emergência', 'Motivo Viagem', 'Próximo Destino'
    ];

    const escapeCsv = (val) => {
      if (!val) return '';
      const str = String(val);
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = contactsData.map(c => [
      escapeCsv(c.name), escapeCsv(c.phone), escapeCsv(c.email), escapeCsv(c.instagram), escapeCsv(c.cpf), escapeCsv(c.passport),
      escapeCsv(c.dob), escapeCsv(c.address), escapeCsv(c.cep), escapeCsv(c.city),
      escapeCsv(c.hotel), escapeCsv(c.arrival), escapeCsv(c.departure), escapeCsv(c.pax), escapeCsv(c.companions),
      escapeCsv(c.source), escapeCsv(c.emergency), escapeCsv(c.motivoViagem), escapeCsv(c.nextDestination)
    ]);

    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contatos_TET_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert(`Exportados ${contactsData.length} contatos com sucesso!`);
  };

  const handleNewBooking = () => {
    setActiveTab('booking');
    setStep(1);
    setBookingData(INITIAL_BOOKING_STATE);
    setRawMessage('');
    setNotes('');
    setFinancialOverrides({});
    setPaymentMethod('entrada_saldo');
  };

  const handleConvertToBooking = (calcData) => {
    setBookingData({
      ...bookingData,
      name: calcData.name,
      pax: calcData.pax,
      paxChildren: 0,
      tours: calcData.tours.map(t => ({
        ...t,
        uuid: t.uuid || (Date.now().toString() + Math.random().toString(36).substring(7)),
        'Valor de venda (COP)': t.Valor_venda_COP || 0,
        'ENTRADA': t.ENTRADA || 0,
        'Preço custo (COP)': t.Preco_custo_COP || 0,
        Local: t.Local || '',
        Hora: t.Hora || '',
        Taxas_valor: t.Taxas_valor || 0,
        Ciudad: t.Ciudad || '',
        hasVariableTime: Boolean(t.hasVariableTime)
      }))
    });
    setStep(2); // Jump direct to details
    setActiveTab('booking');
    setRawMessage('');
    setNotes('');
  };

  const handleStartCalculator = () => {
    handleNewBooking(); // Reset state
    setStep(2); // Go straight to the grid
    setActiveTab('calculator'); // Keep 'calculator' active for the sidebar highlight
  };

  const handleGeneratePDF = async () => {
    if (isSavingPDF) return;
    setIsSavingPDF(true);
    const toursCount = bookingData.tours.length;
    if (toursCount > 0) {
      try {
        await new Promise(r => setTimeout(r, 600)); // Ensure UI is painted and fonts loaded
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < toursCount; i++) {
          const el = document.getElementById(`voucher-tour-${i}`);
          if (!el) continue;

          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.85);
          const pageHeight = (canvas.height * pdfWidth) / canvas.width;

          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pageHeight, undefined, 'FAST');
        }

        const filename = `VOUCHERS_${bookingData.name?.replace(/\s+/g, '_') || 'PAX'}_${formatDateForFilename(new Date())}.pdf`;
        pdf.save(filename);
        alert('Reserva salva e PDF gerado com sucesso!');
      } catch (err) {
        console.error('PDF Generation Error:', err);
        alert('Erro ao gerar PDF: ' + err.message + '. Tentando impressão nativa...');
        window.print();
      } finally {
        setIsSavingPDF(false);
      }
    } else {
      alert('Nenhum passeio para gerar voucher.');
      setIsSavingPDF(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-area">
          <img src={logo} alt="TET Logo" className="sidebar-logo" />
        </div>
        <nav className="nav-menu">
          <button className={`nav-item ${activeTab === 'booking' ? 'active' : ''}`} onClick={handleNewBooking}>
            <Plus size={20} /> <span>Nova Reserva</span>
          </button>
          <button className={`nav-item ${activeTab === 'calculator' ? 'active' : ''}`} onClick={handleStartCalculator}>
            <Calculator size={20} /> <span>Calculadora</span>
          </button>
          <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <History size={20} /> <span>Histórico</span>
          </button>
          <button className={`nav-item ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
            <DollarSign size={20} /> <span>Financeiro</span>
          </button>
          <button className={`nav-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
            <Users size={20} /> <span>Contatos</span>
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> <span>Configuração</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {(activeTab === 'booking' || activeTab === 'calculator') && (
          <div className="booking-flow">
            {step === 1 && activeTab === 'booking' && (
              <PassengerForm 
                rawMessage={rawMessage} 
                setRawMessage={setRawMessage} 
                processMessage={processMessage}
                offlineMode={offlineMode}
                setOfflineMode={setOfflineMode}
              />
            )}

            {(step === 2 || activeTab === 'calculator') && (
              <BookingDetails 
                bookingData={bookingData}
                setBookingData={setBookingData}
                pricesDb={pricesDb}
                totals={totals}
                wiseMarkup={wiseMarkup}
                setWiseMarkup={setWiseMarkup}
                manualRate={manualRate}
                setManualRate={setManualRate}
                exchangeRate={exchangeRate}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                financialOverrides={financialOverrides}
                setFinancialOverrides={setFinancialOverrides}
                step={step}
                setStep={setStep}
                sensors={sensors}
                handleDragEnd={handleDragEnd}
                notes={notes}
                setNotes={setNotes}
                isProcessingAI={isProcessingAI}
                isCalculatorMode={activeTab === 'calculator'}
                generateWhatsAppMessage={generateWhatsAppMessage}
                handleConvertToBooking={handleConvertToBooking}
                handleSmartUpdate={handleSmartUpdate}
                handleSaveData={handleSaveData}
                isSavingData={isSavingData}
              />
            )}

            {step === 3 && (
              <VoucherPreview 
                bookingData={bookingData}
                setBookingData={setBookingData}
                pricesDb={pricesDb}
                whatsappText={whatsappText}
                setWhatsappText={setWhatsappText}
                generateWhatsAppMessage={generateWhatsAppMessage}
                copyToClipboard={copyToClipboard}
                isCopying={isCopying}
                handleGeneratePDF={handleGeneratePDF}
                isSavingPDF={isSavingPDF}
                handleSaveData={handleSaveData}
                isSavingData={isSavingData}
                paymentMethod={paymentMethod}
                logo={logo}
                globalTaxasText={globalTaxasText}
                showProviderMsgs={showProviderMsgs}
                setShowProviderMsgs={setShowProviderMsgs}
                getProviderMessage={getProviderMessage}
                handleSmartUpdate={handleSmartUpdate}
                isProcessingAI={isProcessingAI}
                notes={notes}
                setNotes={setNotes}
                setStep={setStep}
              />
            )}
          </div>
        )}

        {/* Histórico Tab */}
        {activeTab === 'history' && (
          <HistoryDashboard
            historyData={historyData}
            loadingTab={loadingTab}
            historySearch={historySearch}
            setHistorySearch={setHistorySearch}
            expandedHistoryId={expandedHistoryId}
            setExpandedHistoryId={setExpandedHistoryId}
            handleDeleteConfirmation={handleDeleteConfirmation}
            loadFromHistory={loadFromHistory}
            getConfirmations={getConfirmationsFromSupabase}
            setHistoryData={setHistoryData}
            setLoadingTab={setLoadingTab}
          />
        )}

        {/* Contatos Tab */}
        {activeTab === 'contacts' && (
          <ContactsDashboard
            contactsData={contactsData}
            loadingTab={loadingTab}
            contactSearch={contactSearch}
            setContactSearch={setContactSearch}
            expandedContactId={expandedContactId}
            setExpandedContactId={setExpandedContactId}
            exportContactsCSV={exportContactsCSV}
            getContacts={getContactsFromSupabase}
            setContactsData={setContactsData}
            setLoadingTab={setLoadingTab}
            deleteContact={deleteContactSupabase}
            setHistorySearch={setHistorySearch}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Dashoard Financiero (Full) */}
        {activeTab === 'finance' && (
          <FinanceDashboard
            historyData={historyData}
            loadingTab={loadingTab}
            getConfirmations={getConfirmationsFromSupabase}
            setHistoryData={setHistoryData}
            setLoadingTab={setLoadingTab}
            formatCOP={formatCOP}
          />
        )}

        {/* Configurações Tab */}
        {activeTab === 'settings' && (
          <SettingsDashboard
            aiKeyInput={aiKeyInput}
            setAiKeyInput={setAiKeyInput}
            saveGeminiKey={setGeminiKey}
            getGeminiKey={getGeminiKey}
            manualRate={manualRate}
            setManualRate={setManualRate}
            exchangeRate={exchangeRate}
            setExchangeRate={setExchangeRate}
            wiseMarkup={wiseMarkup}
            setWiseMarkup={setWiseMarkup}
            priceSearch={priceSearch}
            setPriceSearch={setPriceSearch}
            pricesDb={pricesDb}
            setPricesDb={setPricesDb}
            formatCOP={formatCOP}
            deleteProduct={deleteProductSupabase}
            updateProduct={updateProductSupabase}
            saveProduct={saveProductSupabase}
            cleanDuplicateProducts={async () => alert('⚠️ Función migrada a Supabase Dashboard. Use el panel de administración para esta operación.')}
            getProducts={getProductsFromSupabase}
            priceUpdateText={priceUpdateText}
            setPriceUpdateText={setPriceUpdateText}
            handleAIPriceUpdate={handleAIPriceUpdate}
            isProcessingAI={isProcessingAI}
            getConfirmations={getConfirmationsFromSupabase}
            getContacts={getContactsFromSupabase}
            setHistoryData={setHistoryData}
            setContactsData={setContactsData}
            cleanDuplicateContacts={async () => alert('⚠️ Función migrada a Supabase Dashboard. Use el panel de administración para esta operación.')}
            loadingTab={loadingTab}
            setLoadingTab={setLoadingTab}
            globalTaxasText={globalTaxasText}
            setGlobalTaxasText={(txt) => {
              setGlobalTaxasText(txt);
              localStorage.setItem('TET_GLOBAL_TAXAS_TEXT', txt);
            }}
          />
        )}
      </main >
    </div >
  );
};

export default App;
