# Cinema Watch

Detecta nuevos horarios de cine (Kinoheld) y avisa por Telegram. Corre en GitHub Actions —
no depende de tu PC estar prendida.

## 1. Crear el repositorio

1. Ve a https://github.com/new
2. Nombre: `cinema-watch` (o el que quieras), puede ser privado o público
3. Crea el repo vacío (sin README, sin .gitignore)

## 2. Subir estos archivos

Desde tu PC, en la carpeta donde tengas estos archivos:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/cinema-watch.git
git push -u origin main
```

(O simplemente arrastra los archivos desde la interfaz web de GitHub: "Add file" → "Upload files".)

## 3. Crear tu bot de Telegram

1. Abre Telegram, busca **@BotFather** y mándale `/newbot`
2. Dale un nombre y un username (debe terminar en `bot`, ej. `cinema_watch_bot`)
3. BotFather te da un **token** como `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxx` — cópialo
4. Ahora busca tu bot recién creado en Telegram (por su username) y mándale cualquier mensaje, ej. "hola"
   (esto es necesario para que el bot pueda escribirte a ti)
5. Para obtener tu **chat ID**, abre esta URL en el navegador (reemplaza `TU_TOKEN`):
   `https://api.telegram.org/botTU_TOKEN/getUpdates`
6. Busca en el JSON que te devuelve el campo `"chat":{"id":123456789,...}` — ese número es tu `chat_id`

Si quieres que el bot avise a un **grupo** en vez de a ti directamente: agrega el bot al grupo,
manda un mensaje en el grupo, y repite el paso 5-6 (el `chat_id` de un grupo suele ser negativo, ej. `-100123456789`).

## 4. Configurar los "Secrets"

En tu repo: **Settings → Secrets and variables → Actions → New repository secret**

Crea estos dos secrets:

| Nombre               | Valor                                      |
| --------------------- | ------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`  | El token que te dio BotFather                |
| `TELEGRAM_CHAT_ID`    | Tu chat ID (o el del grupo)                  |

## 5. Primera ejecución

- Ve a la pestaña **Actions** de tu repo
- Selecciona el workflow "Watch Cinema Shows"
- Clic en **Run workflow** (botón manual) para probarlo ahora mismo, sin esperar los 20 minutos
- La primera corrida solo guarda la línea base (no manda mensaje)
- Las siguientes corridas (automáticas cada 20 min, o manuales) sí avisan si hay horarios nuevos

## 6. Verificar que funciona

- En la pestaña **Actions**, cada corrida muestra logs — ahí puedes ver si detectó cambios o hubo errores
- El archivo `cinema-shows-state.json` se actualiza solo en cada corrida (commit automático del bot)

## Vigilar otro cine o varias películas

Edita `CINEMA_IDS` en `index.js` para agregar más ids de cine (el endpoint acepta varios
`cinemaIds[]=` en la misma URL). El script detecta shows nuevos de cualquier película en esos cines,
no solo "Die Odyssee".

## Nota sobre frecuencia

GitHub Actions no garantiza que el cron corra exactamente cada 20 min (puede haber algunos minutos
de retraso en horas pico). Para este caso de uso (avisos de cartelera) no es un problema.
Los repos públicos tienen minutos de Actions ilimitados; los privados tienen 2,000 min/mes gratis
en el plan Free, que alcanza de sobra para un cron cada 20 min.
