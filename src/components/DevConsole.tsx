import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { clearLogs, formatLogs, getLogs, subscribeLogs } from '../lib/logger';

const COLOR: Record<string, string> = {
  info: 'text-sky-300',
  ok: 'text-emerald-300',
  warn: 'text-amber-300',
  error: 'text-red-300',
};

// Consola visible: solo se muestra en el panel de admin o con ?debug=1 en la URL
export const DevConsole = ({ visible }: { visible: boolean }) => {
  const logs = useSyncExternalStore(subscribeLogs, getLogs, getLogs);
  const [open, setOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const erroresPrevios = useRef(0);

  const errores = logs.filter(l => l.level === 'error').length;

  // Si aparece un error nuevo, se abre sola para que no pase desapercibido
  useEffect(() => {
    if (!visible) return;
    if (errores > erroresPrevios.current && erroresPrevios.current > 0) setOpen(true);
    erroresPrevios.current = errores;
  }, [errores, visible]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[400] flex flex-col items-end gap-2">
      {open && (
        <div className="w-[min(92vw,420px)] max-h-[70vh] flex flex-col rounded-2xl border border-black/40 bg-[#0f1115] text-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#171a21] border-b border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest">
              Registro · {logs.length} {errores > 0 && <span className="text-red-300">· {errores} error{errores === 1 ? '' : 'es'}</span>}
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
                onClick={clearLogs}
                className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={() => setOpen(false)}
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
      )}
      <button
        onClick={() => setOpen(o => !o)}
        title="Registro de la app"
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#0f1115] text-white text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/15 hover:bg-[#171a21] transition-colors"
      >
        <span className={errores > 0 ? 'text-red-300' : 'text-emerald-300'}>●</span>
        {errores > 0 ? `${errores} error${errores === 1 ? '' : 'es'}` : 'Registro'}
      </button>
    </div>
  );
};
