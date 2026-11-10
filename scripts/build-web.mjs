// Empacota Three.js + o jogo num único script clássico.
// WebView abre file:// e módulo ES quebra por CORS — o bundle IIFE não.
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['game-src/main.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2018'],
  outfile: 'app/src/main/assets/www/js/game.js',
  legalComments: 'none',
  charset: 'utf8',
  logLevel: 'info',
});
