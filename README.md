# Fuga do Belford

Runner 3D infinito, em **beta offline**, numa rua de dia da Baixada — casas, comércio, fiação e trânsito. Você desvia de moto, carro, táxi, van, ônibus e buraco. O recorde fica só no aparelho.

Não tem login, conta, anúncio, Firebase nem rede. Dá para jogar no modo avião.

Versão `0.2.0-beta`. Pacote `com.williams.fugadobelford`.

## Como jogar

O app abre em retrato.

1. Na tela inicial, toque em **Jogar**.
2. A contagem (`3`, `2`, `1`, `VAI`) solta a corrida. A rua anda sozinha.
3. **Deslize para os lados** (ou toque no terço esquerdo/direito da tela) para trocar de faixa.
4. **Deslize para cima** (ou toque no centro) para pular o buraco. Moto, carro, táxi, van e ônibus não se pulam.
5. Bater é game over. O placar é a distância, com bônus de “quase”.
6. **Jogar de novo** ou voltar ao **menu**. O **recorde** aparece nos dois.

No computador, as setas (ou A/D e espaço) fazem a mesma coisa — útil para testar o jogo no navegador.

## Como buildar o APK

Precisa de JDK 17+ e do Android SDK com `platforms;android-34` e `build-tools;34.0.0`.

```bash
export ANDROID_HOME="$HOME/android-sdk"   # ou o caminho do seu SDK
export ANDROID_SDK_ROOT="$ANDROID_HOME"
./gradlew assembleDebug
```

O APK sai em:

```text
app/build/outputs/apk/debug/app-debug.apk
```

Se o Gradle não achar o SDK, crie `local.properties` na raiz (esse arquivo não vai pro git):

```properties
sdk.dir=/caminho/para/o/android-sdk
```

`minSdk` 24, `targetSdk` 34. O WebView do aparelho precisa de WebGL (System WebView atual, o de qualquer celular de uns anos pra cá).

## O jogo em si

O 3D é **Three.js r160** dentro de um WebView. O código legível está em `game-src/`. O APK leva o bundle único `app/src/main/assets/www/js/game.js` (script clássico, porque `file://` quebra módulo ES).

Para mexer no jogo e gerar o bundle de novo:

```bash
npm install
npm run test:logic
npm run build:web
./gradlew assembleDebug
```

`npm run test:logic` garante que nenhuma fileira de obstáculos fecha as três faixas com algo que não dá para pular, e que o buraco cabe na janela do pulo.

### Pastas

| Caminho | O que é |
| --- | --- |
| `game-src/` | Jogo (cena, regras, obstáculos, UI em JS) |
| `app/src/main/assets/www/` | HTML, CSS, fontes e o bundle que o APK abre |
| `app/src/main/java/.../MainActivity.kt` | WebView, tela cheia, recorde em SharedPreferences |
| `scripts/test-logic.mjs` | Teste das regras sem GPU |

O recorde usa a ponte `AndroidScore` (SharedPreferences). No navegador, cai no `localStorage`. Nada sai do aparelho.

### Para a próxima versão

`window.Fuga` expõe `setJacketColor(hex)` e o gancho `onRecord(score)`. Dá para plugar skin e ranking depois, sem mudar o loop. Esta beta não chama rede nenhuma.
