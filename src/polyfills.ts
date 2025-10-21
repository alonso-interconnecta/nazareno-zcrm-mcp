// Polyfills for Web APIs expected by undici/fetch in some Node.js environments
import { Blob, File, FormData } from 'undici';

const g: any = globalThis as any;

if (typeof g.File === 'undefined') {
  g.File = File;
}

if (typeof g.Blob === 'undefined') {
  g.Blob = Blob;
}

if (typeof g.FormData === 'undefined') {
  g.FormData = FormData;
}


