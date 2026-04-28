import React from 'react';
import { Users, Download, Trash2 } from 'lucide-react';

export default function ContactsDashboard({
  contactsData,
  loadingTab,
  contactSearch,
  setContactSearch,
  expandedContactId,
  setExpandedContactId,
  exportContactsCSV,
  getContacts,
  setContactsData,
  setLoadingTab,
  deleteContact,
  setHistorySearch,
  setActiveTab
}) {
  return (
    <div className="booking-flow">
      <div className="card fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3><Users size={20} className="inline-icon" /> Contatos</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" style={{ padding: '8px 16px' }} onClick={async () => {
              setLoadingTab(true);
              const data = await getContacts(50);
              setContactsData(data);
              setLoadingTab(false);
            }}>Atualizar</button>
            <button className="btn-primary" style={{ padding: '8px 16px' }} onClick={exportContactsCSV}>
              <Download size={14} style={{ display: 'inline', marginRight: '4px' }} /> Exportar CSV
            </button>
          </div>
        </div>

        <input
          className="input-field mb-4"
          placeholder="🔍 Buscar por nome, telefone, email ou hotel..."
          value={contactSearch}
          onChange={e => setContactSearch(e.target.value)}
        />

        {loadingTab && <p>Carregando...</p>}
        {contactsData.length === 0 && !loadingTab && <p style={{ color: 'var(--text-light)' }}>Nenhum contato salvo ainda. Processe uma mensagem de WhatsApp para popular.</p>}
        {contactsData
          .filter(c => {
            if (!contactSearch) return true;
            const s = contactSearch.toLowerCase();
            return (
              (c.name || '').toLowerCase().includes(s) ||
              (c.phone || '').toLowerCase().includes(s) ||
              (c.email || '').toLowerCase().includes(s) ||
              (c.hotel || '').toLowerCase().includes(s)
            );
          })
          .map((c, idx) => (
            <div key={c.id || idx} className="tour-item-edit card" style={{ margin: '8px 0', padding: '12px', cursor: 'pointer' }} onClick={() => setExpandedContactId(expandedContactId === c.id ? null : c.id)}>
              <div className="flex justify-between items-center">
                <strong>{c.name || '—'}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{c.phone || '—'}</span>
                  <button className="text-red-500 hover:text-red-700 transition-colors p-1" onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm(`Deseja excluir o contato ${c.name} permanentemente ? `)) {
                      setLoadingTab(true);
                      try {
                        await deleteContact(c.id);
                        const data = await getContacts(50);
                        setContactsData(data);
                      } catch (err) {
                        alert('Erro ao excluir contato.');
                      } finally {
                        setLoadingTab(false);
                      }
                    }
                  }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {expandedContactId === c.id && (
                <div style={{ marginTop: '10px', padding: '14px', background: '#f9fafb', borderRadius: '10px', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dados Pessoais</div>
                  <div className="grid-2" style={{ gap: '8px' }}>
                    <div><span className="label">Telefone</span><br />{c.phone || '—'}</div>
                    <div><span className="label">Email</span><br />{c.email || '—'}</div>
                    <div><span className="label">CPF</span><br />{c.cpf || '—'}</div>
                    <div><span className="label">Passaporte / RG</span><br />{c.passport || '—'}</div>
                    <div><span className="label">Data de Nascimento</span><br />{c.dob || '—'}</div>
                    <div><span className="label">Instagram</span><br />{c.instagram ? `@${c.instagram} ` : '—'}</div>
                    <div><span className="label">Endereço</span><br />{c.address || '—'}</div>
                    <div><span className="label">CEP</span><br />{c.cep || '—'}</div>
                    <div><span className="label">Cidade</span><br />{c.city || '—'}</div>
                  </div>
                  <hr style={{ margin: '12px 0', borderColor: '#e5e7eb' }} />
                  <div style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dados da Viagem</div>
                  <div className="grid-2" style={{ gap: '8px' }}>
                    <div><span className="label">Hotel / Hospedagem</span><br />{c.hotel || '—'}</div>
                    <div><span className="label">Chegada</span><br />{c.arrival || '—'}</div>
                    <div><span className="label">Saída</span><br />{c.departure || '—'}</div>
                    <div><span className="label">Pax</span><br />{c.pax || '—'}</div>
                    <div><span className="label">Acompanhantes</span><br /><span style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{c.companions || '—'}</span></div>
                    <div><span className="label">Motivo da Viagem</span><br />{c.motivoViagem || '—'}</div>
                    <div><span className="label">Próximo Destino</span><br />{c.nextDestination || '—'}</div>
                    <div><span className="label">Contato de Emergência</span><br />{c.emergency || '—'}</div>
                  </div>
                  <hr style={{ margin: '12px 0', borderColor: '#e5e7eb' }} />
                  <div style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Origem & Marketing</div>
                  <div className="grid-2" style={{ gap: '8px' }}>
                    <div><span className="label">Como Conheceu</span><br />{c.source || '—'}</div>
                    <div><span className="label">Tipo</span><br /><span style={{ background: '#fdf2f8', color: '#be185d', padding: '2px 8px', borderRadius: '4px' }}>{c.role || 'client'}</span></div>
                    <div><span className="label">Última Atualização</span><br />{c.updatedAt?.toDate ? c.updatedAt.toDate().toLocaleDateString('pt-BR') : '—'}</div>
                  </div>
                  <div style={{ marginTop: '14px', borderTop: '1px dashed #e5e7eb', paddingTop: '10px' }}>
                    <button className="btn-secondary w-full" onClick={(e) => {
                      e.stopPropagation();
                      setHistorySearch(c.name); // Filter history by this name
                      setActiveTab('history'); // Switch tab
                    }}>
                      📅 Ver Reservas de {c.name.split(' ')[0]}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
