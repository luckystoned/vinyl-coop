# Vinyl Coop

Asistente mobile-first y determinista para selección y práctica de mezclas con colecciones de vinilos físicos.

---

## 1. Instalación de dependencias

Requisitos previos: Node.js (v18+ recomendado).

```bash
npm install
```

---

## 2. Ejecución local

Inicia el entorno de desarrollo local con Vite y los endpoints API emulados:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`. Si las credenciales de Google Sheets no están configuradas, la app iniciará automáticamente en **Modo Demo Local**, utilizando una colección de prueba y permitiendo practicar sin dependencias externas.

---

## 3. Configuración de variables de entorno

Copia el archivo `.env.example` a `.env.local` o `.env`:

```bash
cp .env.example .env
```

Variables requeridas:

```env
# ID del spreadsheet existente con las pestañas "Vinyl Inventory" y "Practice_Log"
GOOGLE_SHEET_ID=1oXiGomNeglmygM6hHFqbpmz28v5JySONhxWppVujjCg

# Credenciales de Service Account de Google Cloud
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-cuenta-de-servicio@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Contraseña privada para ingresar a la aplicación (por defecto en local: vinylcoop)
APP_PASSWORD=tu_clave_secreta

# Secreto para firmar cookies de sesión (HMAC SHA-256)
SESSION_SECRET=un_secreto_aleatorio_de_al_menos_32_caracteres
```

---

## 4. Crear una Cuenta de Servicio en Google Cloud

1. Ingresa a la [Consola de Google Cloud](https://console.cloud.google.com/).
2. Crea un proyecto nuevo o selecciona uno existente.
3. Habilita la **Google Sheets API**:
   - Ve a *APIs & Services* > *Library*.
   - Busca "Google Sheets API" y haz clic en **Enable**.
4. Crea la Service Account:
   - Ve a *APIs & Services* > *Credentials*.
   - Haz clic en **Create Credentials** > **Service Account**.
   - Asigna un nombre (ej. `vinyl-coop-service`) y haz clic en **Done**.
5. Genera la clave privada:
   - Haz clic sobre la Service Account creada.
   - Ve a la pestaña **Keys** > **Add Key** > **Create new key**.
   - Selecciona formato **JSON** y descarga el archivo.
   - Del JSON descargado, extrae el `client_email` para `GOOGLE_SERVICE_ACCOUNT_EMAIL` y `private_key` para `GOOGLE_PRIVATE_KEY`.

---

## 5. Compartir el Spreadsheet con la Cuenta de Servicio

1. Abre el spreadsheet en Google Sheets:  
   `https://docs.google.com/spreadsheets/d/1oXiGomNeglmygM6hHFqbpmz28v5JySONhxWppVujjCg/edit`
2. Haz clic en el botón verde **Compartir** (esquina superior derecha).
3. Pega la dirección de email de tu Service Account (`tu-cuenta@...iam.gserviceaccount.com`).
4. asígnale el rol de **Editor**.
5. Desmarca la opción de notificar por correo y confirma.

*Nota: La aplicación lee la pestaña `Vinyl Inventory` de manera estrictamente no destructiva y solo escribe transiciones en `Practice_Log` mediante inserciones con `valueInputOption: 'RAW'` para proteger los datos.*

---

## 6. Despliegue en Vercel

### Opción A: Vercel CLI

```bash
npx vercel
```

### Opción B: Vercel Dashboard (Git)

1. Conecta el repositorio de GitHub en Vercel.
2. Vercel detectará automáticamente el framework **Vite**.
3. En la sección **Environment Variables**, agrega:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (recuerda mantener los saltos de línea `\n` o pegar la clave completa)
   - `APP_PASSWORD`
   - `SESSION_SECRET`
4. Haz clic en **Deploy**.

---

## 7. Ejecución de pruebas

Ejecuta el conjunto completo de pruebas unitarias y de integración:

```bash
npm test
```

Para ejecutar con interfaz interactiva:

```bash
npx vitest
```

Para verificar compilación TypeScript estricta y empaquetado de producción:

```bash
npm run build
```
