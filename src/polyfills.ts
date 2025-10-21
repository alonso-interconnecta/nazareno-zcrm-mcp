// Polyfills for Web APIs expected by undici/fetch in some Node.js environments
import { FormData } from 'undici';

const g: any = globalThis as any;

// Only polyfill FormData from undici, Blob and File are not available
if (typeof g.FormData === 'undefined') {
  g.FormData = FormData;
}

// For Blob and File, we'll use Node.js built-ins if available
if (typeof g.Blob === 'undefined' && typeof globalThis.Blob !== 'undefined') {
  g.Blob = globalThis.Blob;
}

if (typeof g.File === 'undefined' && typeof globalThis.File !== 'undefined') {
  g.File = globalThis.File;
}