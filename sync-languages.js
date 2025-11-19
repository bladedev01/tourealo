// Script para sincronizar los idiomas soportados desde el backend
// Ejecuta este script antes de cada build para mantener SUPPORTED_LANGUAGES actualizado


const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config({
  path: [
    path.join(__dirname, '.env.local'),
    path.join(__dirname, '.env.production'),
    path.join(__dirname, '.env'),
    path.join(__dirname, '.env.example'),
    path.join(__dirname, '.env.production.example'),
  ].find(fs.existsSync)
});

const API_URL = process.env.LANG_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_URL) {
  console.error('ERROR: Debes definir LANG_API_URL o NEXT_PUBLIC_API_BASE_URL en tu .env para sincronizar los idiomas.');
  process.exit(1);
}
const OUTPUT_PATH = path.join(__dirname, 'src', 'lib', 'language-shared.ts');

const getModule = API_URL.startsWith('https') ? https : http;
getModule.get(API_URL, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const langs = Array.isArray(json.availableLanguages) ? json.availableLanguages : [];
      const defaultLang = json.defaultLanguage || 'en';
      const content = `// Archivo generado automáticamente. No editar a mano\nexport const SUPPORTED_LANGUAGES = ${JSON.stringify(langs, null, 2)};\nexport const DEFAULT_LANGUAGE = '${defaultLang}';\n`;
      fs.writeFileSync(OUTPUT_PATH, content, 'utf8');
      console.log('Idiomas sincronizados:', langs, 'Default:', defaultLang);
    } catch (e) {
      console.error('Error al parsear respuesta de idiomas:', e);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('Error al consultar el backend:', err);
  process.exit(1);
});
