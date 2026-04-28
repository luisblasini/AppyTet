import React from 'react';
import { 
  Check, 
  Copy, 
  Download, 
  MessageSquare,
  Users,
  Trash2,
  Plane
} from 'lucide-react';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { getVoucherRules } from '../data/voucherRules';

const VoucherPreview = ({ 
  bookingData, 
  setBookingData, 
  pricesDb,
  whatsappText, 
  setWhatsappText, 
  generateWhatsAppMessage, 
  copyToClipboard, 
  isCopying, 
  handleGeneratePDF, 
  isSavingPDF,
  handleSaveData,
  isSavingData,
  paymentMethod,
  logo,
  showProviderMsgs,
  setShowProviderMsgs,
  getProviderMessage,
  handleSmartUpdate,
  isProcessingAI,
  notes,
  setNotes,
  setStep,
  globalTaxasText
}) => {
  return (
    <div className="animate-in">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3>Texto para WhatsApp</h3>
          <div className="flex gap-2">
            <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => setWhatsappText(generateWhatsAppMessage())}>
              ↺ Regenerar
            </button>
            <button className="btn-icon" onClick={copyToClipboard}>{isCopying ? <Check size={18} color="green" /> : <Copy size={18} />}</button>
          </div>
        </div>
        <textarea
          className="input-field"
          rows="14"
          style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', background: '#f8fafc' }}
          value={whatsappText || generateWhatsAppMessage()}
          onChange={(e) => setWhatsappText(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3>Vouchers Individualizados</h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
            {(bookingData.tours || []).length} {(bookingData.tours || []).length === 1 ? 'passeio' : 'passeios'} detectados
          </div>
        </div>

        <div className="vouchers-container mt-4">
          {(bookingData.tours || []).map((t, idx) => {
            const tourPax = t.paxOverride !== undefined && t.paxOverride !== ''
              ? parseInt(t.paxOverride)
              : ((parseInt(bookingData.pax) || 0) + (parseInt(bookingData.paxChildren) || 0));

            const isTotalPix = paymentMethod === 'total_pix';
            const isAlwaysPaid = t.siemprePago === true || t.siemprePago === 'true';
            const isManuallyPaid = !!t.isPaid;
            const statusPago = isTotalPix || isAlwaysPaid || isManuallyPaid;

            const saldo = statusPago ? 0 : ((t['Valor de venda (COP)'] || 0) - (t['ENTRADA'] || 0)) * tourPax;

            const rules = getVoucherRules(t.Passeio);
            const defaultObs = rules
              ? (rules.observacoes ? `Obs: ${rules.observacoes}` : '')
              : 'Obs: Lembramos que coolers, alimentos e bebidas alcoólicas não são permitidos em beach clubs e praias privadas.';

            // --- CHD Inheritance Logic ---
            let displayMeetPoint = t.meet_point || t.Local || (rules && rules.pontoEncontro);
            let displayTime = t.time || t.Hora;
            let displayFeesInfo = t.fees_info || t.Taxas_info;
            let displayFeesValue = t.fees_value || t.Taxas_valor || (rules && rules.valorTaxas);
            let displayObs = t.voucherObs !== undefined ? t.voucherObs : (t.voucher_obs || defaultObs);

            // If it is a child product and missing logistics, find parent in pricesDb
            if (pricesDb && t.Passeio && /chd|criança|menor/i.test(t.Passeio)) {
              if (!displayMeetPoint || !displayTime) {
                const parentNameQuery = t.Passeio.replace(/chd|criança|menor/gi, '').trim().toLowerCase();
                const parentTour = pricesDb.find(dbT => 
                  dbT.Passeio && 
                  dbT.Passeio.toLowerCase().includes(parentNameQuery) && 
                  !/chd|criança|menor/i.test(dbT.Passeio)
                );
                
                if (parentTour) {
                  if (!displayMeetPoint) displayMeetPoint = parentTour.meet_point || parentTour.Local;
                  if (!displayTime) displayTime = parentTour.time || parentTour.Hora;
                  if (!displayFeesInfo && !displayFeesValue) {
                    displayFeesInfo = parentTour.fees_info || parentTour.Taxas_info;
                    displayFeesValue = parentTour.fees_value || parentTour.Taxas_valor;
                  }
                  if (!t.voucherObs && !t.voucher_obs && (!rules || !rules.observacoes)) {
                     displayObs = parentTour.voucher_obs || defaultObs;
                  }
                }
              }
            }

            // --- Walking Tour Specific Dynamic Logic ---
            if (t.Passeio && t.Passeio.toLowerCase().includes('walking tour')) {
              const timeStr = `${displayTime || '—'}hs`;
              if (displayMeetPoint && displayMeetPoint.includes('recepção') && !displayMeetPoint.includes(timeStr)) {
                displayMeetPoint = `Apresentar-se as ${timeStr} na recepção do hotel para encontrar com o guia.`;
              } else if (!displayMeetPoint) {
                displayMeetPoint = `Apresentar-se as ${timeStr} na recepção do hotel para encontrar com o guia.`;
              }
            }

            return (
              <div key={t.uuid || idx} style={{ position: 'relative', marginBottom: '2rem' }}>
                {/* Botón flotante para marcar como PAGO que NO sale en el PDF */}
                <button
                  style={{
                    position: 'absolute',
                    top: '-15px',
                    right: '25px',
                    zIndex: 10,
                    background: statusPago ? '#dcfce7' : 'white',
                    color: statusPago ? '#166534' : '#6b7280',
                    border: statusPago ? '2px solid #166534' : '2px solid #e5e7eb',
                    fontSize: '0.8rem',
                    padding: '4px 12px',
                    fontWeight: 'bold',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => {
                    setBookingData(prev => ({
                      ...prev,
                      tours: prev.tours.map((tour, i) => 
                        i === idx ? { ...tour, isPaid: !tour.isPaid } : tour
                      )
                    }));
                  }}
                  data-html2canvas-ignore="true"
                >
                  {statusPago ? '✅ PAGO' : 'MARCAR PAGO'}
                </button>

                <div id={`voucher-tour-${idx}`} className="voucher-excel shadow-sm" style={{ fontFamily: "'Montserrat', sans-serif", padding: '0', maxWidth: '100%', background: '#fff' }}>
                  {/* Thin turquoise top bar */}
                  <div style={{ background: '#26c6da', padding: '12px 0' }}></div>

                  {/* Title + Logo row */}
                  <div style={{ padding: '10px 24px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ color: '#e91e8b', fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>Voucher The Experience Travel</h2>
                    <img src={logo} alt="Logo" style={{ height: '140px' }} />
                  </div>

                  {/* Passenger + Pessoas — v4 exact format */}
                  <div style={{ padding: '4px 24px 10px', fontSize: '0.95rem', borderBottom: '1px solid #ddd', marginBottom: '0' }}>
                    <div style={{ marginBottom: '2px' }}>Titular da reserva: <span contentEditable suppressContentEditableWarning style={{ fontWeight: '600' }}>{bookingData.name || '—'}</span></div>
                    <div>Número de pessoas: <span contentEditable suppressContentEditableWarning style={{ fontWeight: '600' }}>{String(tourPax).padStart(2, '0')}</span></div>
                  </div>

                  {/* Main table */}
                  <div style={{ padding: '0 24px 10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '8px 12px', width: '55%' }}>
                            <div style={{ fontWeight: 'bold' }}>Data: <span contentEditable suppressContentEditableWarning>{formatDateDisplay(t.date || bookingData.arrival)}</span></div>
                          </td>
                          <td style={{ border: '1px solid #ccc', padding: '8px 12px' }}>
                            <div style={{ fontWeight: 'bold' }}>Hora: <span contentEditable suppressContentEditableWarning>{displayTime ? `${displayTime}hs` : '—'}</span></div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '8px 12px' }}>
                            <div style={{ fontWeight: 'bold' }}>Tour: <span contentEditable suppressContentEditableWarning>{t.Passeio}</span></div>
                          </td>
                          <td style={{ border: '1px solid #ccc', padding: '8px 12px' }}>
                            <div style={{ fontWeight: 'bold' }} contentEditable suppressContentEditableWarning>
                              Valor a pagar: {statusPago ? <span style={{ color: '#2e7d32' }}>PAGO</span> : formatCurrency(saldo, 'COP')}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '0.85rem' }}>
                            <div contentEditable suppressContentEditableWarning>{displayMeetPoint || 'A confirmar com o guia/operador.'}</div>
                          </td>
                          <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '0.85rem' }}>
                            {(() => {
                              if (displayFeesInfo) {
                                return (
                                  <div contentEditable suppressContentEditableWarning>
                                    {displayFeesInfo}
                                  </div>
                                );
                              }
                              if (displayFeesValue > 0) {
                                return (
                                  <div contentEditable suppressContentEditableWarning>
                                    Valor Taxas: {formatCurrency(displayFeesValue, 'COP')} em pesos colombianos por pessoa (somente dinheiro) - sujeito a alteração
                                  </div>
                                );
                              }
                              return <div style={{ minHeight: '1.2em' }}></div>;
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Observations */}
                  <div style={{ padding: '0 24px 8px' }}>
                    <textarea
                      style={{ width: '100%', border: 'none', fontSize: '0.8rem', color: '#555', resize: 'vertical', minHeight: '28px', fontFamily: "'Montserrat', sans-serif" }}
                      value={displayObs}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBookingData(prev => ({
                          ...prev,
                          tours: prev.tours.map((tour, i) => 
                            i === idx ? { ...tour, voucherObs: val } : tour
                          )
                        }));
                      }}
                      placeholder="Notas..."
                    />
                  </div>

                  {/* Thin turquoise bottom bar with contact */}
                  <div style={{ background: '#26c6da', padding: '10px 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', fontSize: '0.85rem', color: '#333' }}>
                    <span>📞 (55) 11 981758504</span>
                    <span>www.thexperiencetravel.com</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>

          <button className="btn-secondary" style={{ flex: 1, backgroundColor: '#f59e0b', border: 'none', color: 'white' }} onClick={() => setShowProviderMsgs(!showProviderMsgs)}>
            📲 Fornecedores
          </button>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={handleGeneratePDF} disabled={isSavingPDF}>
            {isSavingPDF ? 'Gerando PDF...' : <><Download size={18} /> Baixar PDF</>}
          </button>
        </div>

        {showProviderMsgs && (
          <div className="card mt-4 animate-in" style={{ border: '1px solid #f59e0b', background: '#fffbeb' }}>
            <div className="flex justify-between items-center mb-4">
              <h4 style={{ color: '#92400e' }}>📩 Mensagens para Fornecedores</h4>
              <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => setShowProviderMsgs(false)}>Fechar</button>
            </div>
            <div className="provider-msgs-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {(bookingData.tours || []).map((t, idx) => {
                const msg = getProviderMessage(t.Passeio, bookingData, t);
                return (
                  <div key={idx} style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#b45309' }}>{t.Passeio.toUpperCase()}</span>
                      <button className="btn-icon-subtle" onClick={(e) => {
                        const textToCopy = document.getElementById(`provider-msg-${idx}`).value;
                        navigator.clipboard.writeText(textToCopy);
                        const btn = e.currentTarget;
                        const originalSvg = btn.innerHTML;
                        btn.innerHTML = '<span style="font-size:0.7rem;color:green;">✅</span>';
                        setTimeout(() => btn.innerHTML = originalSvg, 2000);
                      }}><Copy size={16} /></button>
                    </div>
                    <textarea 
                      id={`provider-msg-${idx}`}
                      key={msg}
                      defaultValue={msg}
                      style={{ width: '100%', minHeight: '180px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#444', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="flex justify-between items-center mb-2">
            <h4 className="flex items-center gap-2 m-0"><MessageSquare size={16} /> Assistente IA / Notas</h4>
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#e2e8f0' }}
              onClick={handleSmartUpdate}
              disabled={isProcessingAI}
            >
              {isProcessingAI ? '🪄 Pensando...' : '🪄 Aplicar Comando'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>Escreva ordens em lenguaje natural (ex: "Adiciones Bora Bora y cambia la fecha para mañana").</p>
          <textarea
            className="input-field"
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ordem para a IA ou anotação interna..."
          />
          <button className="btn-icon mt-2 w-full" onClick={() => setStep(2)}>Voltar e Editar</button>
        </div>
      </div>
    </div>
  );
};

export default VoucherPreview;
