import React from 'react';
import { MessageSquare, Plane, WifiOff, Wifi } from 'lucide-react';

const PassengerForm = ({ rawMessage, setRawMessage, processMessage, offlineMode, setOfflineMode }) => {
  return (
    <div className="card fade-in">
      <div className="flex justify-between items-center mb-2">
        <h3 className="mb-0"><MessageSquare size={20} className="inline-icon" /> Importar do WhatsApp</h3>
        {/* Offline mode toggle — disables Gemini API for local testing */}
        <button
          onClick={() => setOfflineMode(!offlineMode)}
          title={offlineMode ? 'Modo Offline ATIVO — clique para reativar IA' : 'Clicar para desativar IA (modo local)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            border: offlineMode ? '2px solid #f59e0b' : '2px solid #e2e8f0',
            background: offlineMode ? '#fef3c7' : '#f8fafc',
            color: offlineMode ? '#b45309' : '#64748b',
            transition: 'all 0.2s'
          }}
        >
          {offlineMode ? <WifiOff size={14} /> : <Wifi size={14} />}
          {offlineMode ? 'Offline (sem IA)' : 'Online (com IA)'}
        </button>
      </div>
      {offlineMode && (
        <p style={{ fontSize: '0.72rem', color: '#b45309', marginBottom: '8px', background: '#fef3c7', padding: '6px 10px', borderRadius: '8px' }}>
          ⚠️ Modo Offline ativo. O parsing será feito por regex local (sem API Gemini). Use para testes de usabilidade.
        </p>
      )}
      <textarea
        className="input-field"
        rows="10"
        placeholder="Cole a mensagem do WhatsApp aqui..."
        value={rawMessage}
        onChange={(e) => setRawMessage(e.target.value)}
      />
      <button className="btn-primary w-full mt-4" onClick={processMessage}>
        Processar Mensagem <Plane size={18} />
      </button>
    </div>
  );
};

export default PassengerForm;
