import { useState, useSyncExternalStore } from 'react';
import { Terminal } from 'lucide-react';
import { clearLogs, formatLogs, getLogs, subscribeLogs } from '../lib/logger';

const COLOR: Record<string, string> = {
  info: 'text-sky-300',
  ok: 'text-emerald-300',
  warn: 'text-amber-300',
  error: 'text-red-300',
};

const descargar = () => {
  const sello = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const blob = new Blob([formatLogs()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bella-registro-${sello}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// Ícono del header del panel: abre la consola y muestra la cantidad de errores
export const ConsoleButton = ({ open, onToggle }: { open: boolean; onToggle: () => void }) => {
  const logs = useSyncExternalStore(subscribeLogs, getLogs, getLogs);
  const errores = logs.filter(l => l.level === 'error').length;

  return (
    <button
      onClick={onToggle}
      title="Registro de la app"
      className={
        'relative p-2 rounded-full border transition-colors ' +
        (open
          ? 'bg-brand-pink text-white border-brand-pink'
          : 'bg-bg-primary text-text-secondary border-border-main hover:text-brand-pink hover:border-brand-pink')
      }
    >
      <Terminal size={18} />
      {errores > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
          {errores > 99 ? '99+' : errores}
        </span>
      )}
    </button>
  );
};

// Consola del panel: se abre desde el ícono del header y muestra todo lo registrado
export const DevConsole = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const logs = useSyncExternalStore(subscribeLogs, getLogs, getLogs);
  const [copiado, setCopiado] = useState(false);

  if (!open) return null;

  const errores = logs.filter(l => l.level === 'error').length;

  return (
    <div className="fixed bottom-24 right-4 z-[400] w-[min(94vw,460px)] max-h-[70vh] flex flex-col rounded-2xl border border-black/40 bg-[#0f1115] text-white shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#171a21] border-b border-white/10">
        <span className="text-[10px] font-black uppercase tracking-widest">
          Registro · {logs.length}
          {errores > 0 && <span className="text-red-300"> · {errores} error{errores === 1 ? '' : 'es'}</span>}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(formatLogs());
                setCopiado(true);
                setTimeout(() => setCopiado(false), 1500);
              } catch {
                setCopiado(false);
              }
            }}
            className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 transition-colors"
          >
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
          <button
            onClick={descargar}
            className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 transition-colors"
          >
            Descargar
          </button>
          <button
            onClick={clearLogs}
            className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 transition-colors"
          >
            Limpiar
          </button>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
      <div className="overflow-auto px-3 py-2 space-y-1 font-mono text-[11px] leading-snug">
        {logs.length === 0 && <p className="text-white/40 py-4 text-center">Sin movimientos todavía.</p>}
        {[...logs].reverse().map(e => (
          <div key={e.id} className="border-b border-white/5 py-1">
            <span className="text-white/40">{new Date(e.at).toLocaleTimeString()} </span>
            <span className={COLOR[e.level]}>{e.level.toUpperCase()}</span>
            <span className="text-white/90"> {e.msg}</span>
            {e.detail && <div className="text-white/50 whitespace-pre-wrap break-words">{e.detail}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};
