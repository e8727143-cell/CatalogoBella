// Registro de todo lo que pasa en la app: acciones, avisos y errores.
// Se guarda en memoria (últimas 400 entradas) y se puede ver desde el panel de registro.

export type LogLevel = 'info' | 'ok' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  at: number;
  level: LogLevel;
  msg: string;
  detail?: string;
}

const MAX = 400;
let entries: LogEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const emitir = () => listeners.forEach(l => l());

const texto = (v: unknown): string => {
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean' || v == null) return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

export const log = (level: LogLevel, msg: string, detail?: unknown): LogEntry => {
  const entry: LogEntry = {
    id: nextId++,
    at: Date.now(),
    level,
    msg,
    detail: detail === undefined ? undefined : texto(detail).slice(0, 1500),
  };
  entries = [...entries.slice(-(MAX - 1)), entry];
  emitir();
  return entry;
};

export const logInfo = (msg: string, detail?: unknown) => log('info', msg, detail);
export const logOk = (msg: string, detail?: unknown) => log('ok', msg, detail);
export const logWarn = (msg: string, detail?: unknown) => log('warn', msg, detail);
export const logError = (msg: string, detail?: unknown) => log('error', msg, detail);

export const getLogs = () => entries;

export const subscribeLogs = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const clearLogs = () => {
  entries = [];
  emitir();
};

export const formatLogs = () =>
  entries
    .map(e => {
      const hora = new Date(e.at).toLocaleTimeString();
      return `[${hora}] ${e.level.toUpperCase()} ${e.msg}${e.detail ? ' | ' + e.detail : ''}`;
    })
    .join('\n');

let instalado = false;

// Atrapa errores sueltos y todo lo que el código escriba por consola
export const installLogCapture = () => {
  if (instalado || typeof window === 'undefined') return;
  instalado = true;

  const errorOriginal = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    logError(args.map(texto).join(' '));
    errorOriginal(...args);
  };

  const warnOriginal = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    logWarn(args.map(texto).join(' '));
    warnOriginal(...args);
  };

  window.addEventListener('error', e => {
    logError(e.message || 'Error de script', e.error ?? `${e.filename}:${e.lineno}`);
  });

  window.addEventListener('unhandledrejection', e => {
    logError('Promesa rechazada sin capturar', e.reason);
  });
};
