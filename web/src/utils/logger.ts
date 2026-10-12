const PREFIX = '[AexTrace]';
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

export const log = {
  info:  (...args: unknown[]) => { if (isDev) console.log(PREFIX, ...args); },
  warn:  (...args: unknown[]) => { if (isDev) console.warn(PREFIX, ...args); },
  error: (...args: unknown[]) => { console.error(PREFIX, ...args); },
};