# 🚀 Guía de Instalación y Configuración

## CasaGestión - Migración a Arquitectura Backend

Esta guía te ayudará a configurar el proyecto con el nuevo servidor backend seguro.

---

## 📋 Requisitos Previos

- **Node.js** (v18+ recomendado)
- **npm** o **yarn**
- **Git** (opcional pero recomendado)
- **Clave API de Google Gemini** (obtén una en [ai.google.dev](https://ai.google.dev))

---

## ✅ Paso 1: Configurar el Servidor Backend

### 1.1 Navega a la carpeta del servidor
```bash
cd server
```

### 1.2 Instala las dependencias
```bash
npm install
```

### 1.3 Copia el archivo de variables de entorno
```bash
# En Windows (PowerShell)
Copy-Item .env.example -Destination .env

# En Mac/Linux (bash/sh)
cp .env.example .env
```

### 1.4 Configura la clave API
Abre `server/.env` y completa:

```env
# Tu clave API de Google Gemini
GEMINI_API_KEY=tu-api-key-aqui

# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:5173

# Puerto del servidor
PORT=3001

# Ambiente
NODE_ENV=development

# Configuración de rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=20
```

**Para obtener tu GEMINI_API_KEY:**
1. Ve a [ai.google.dev/aistudio](https://ai.google.dev/aistudio)
2. Click en "Get API key"
3. Crea un nuevo proyecto
4. Copia la clave y pégala en el `.env`

### 1.5 Verifica el servidor
```bash
npm run dev
```

Deberías ver:
```
✅ Server configuration validated
📦 Express app initialized
🚀 Server running on http://localhost:3001
```

Presiona `Ctrl+C` para detener el servidor (mantén esta ventana abierta durante el desarrollo).

---

## ✅ Paso 2: Instalar Dependencias del Frontend

### 2.1 Vuelve a la raíz del proyecto
```bash
cd ..
```

### 2.2 Instala las dependencias (si no las tienes)
```bash
npm install
```

### 2.3 Verifica el archivo `.env`
El archivo `.env` en la raíz ya está configurado con:
```env
VITE_SERVER_URL=http://localhost:3001
```

---

## ✅ Paso 3: Iniciador Desarrollo

### Opción A: En Windows (Recomendado)

Abre PowerShell y ejecuta:
```powershell
.\dev.ps1
```

Esto:
- ✅ Abre una ventana nueva con el servidor backend
- ✅ Inicia el frontend Vite en otra ventana
- ✅ Ambos están disponibles inmediatamente

### Opción B: En Mac/Linux

```bash
chmod +x dev.sh
./dev.sh
```

### Opción C: Manual (Todas las plataformas)

**Terminal 1 - Servidor Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend (en la raíz del proyecto):**
```bash
npm run dev
```

---

## ✅ Paso 4: Verifica que todo funciona

### 4.1 Frontend
- Abre [http://localhost:5173](http://localhost:5173)
- Deberías ver CasaGestión cargando

### 4.2 Servidor Backend
- El servidor estará ejecutándose en [http://localhost:3001](http://localhost:3001)

### 4.3 Prueba el endpoint de análisis
En **Terminal 3**, ejecuta:

```bash
# En Windows (PowerShell)
$body = @{
    transactions = @(@{
        id = "t1"
        date = "2024-03-10"
        amount = 5000
        type = "Ingreso"
        category = "Renta"
        description = "Test"
        paymentMethod = "Transferencia"
    })
    reservations = @(@{
        id = "r1"
        clientId = "c1"
        cabinCount = 1
        startDate = "2024-03-10"
        endDate = "2024-03-15"
        adults = 2
        children = 0
        totalAmount = 5000
        status = "Confirmada"
        isArchived = $false
    })
}

Invoke-RestMethod -Uri "http://localhost:3001/api/analyze" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body ($body | ConvertTo-Json)
```

O en **bash/sh**:

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [{
      "id": "t1",
      "date": "2024-03-10",
      "amount": 5000,
      "type": "Ingreso",
      "category": "Renta",
      "description": "Test",
      "paymentMethod": "Transferencia"
    }],
    "reservations": [{
      "id": "r1",
      "clientId": "c1",
      "cabinCount": 1,
      "startDate": "2024-03-10",
      "endDate": "2024-03-15",
      "adults": 2,
      "children": 0,
      "totalAmount": 5000,
      "status": "Confirmada",
      "isArchived": false
    }]
  }'
```

Deberías recibir una respuesta con el análisis de Gemini.

---

## 🧪 Prueba en el Frontend

1. Ve a [http://localhost:5173](http://localhost:5173)
2. En el **Panel de Control**, haz click en el botón **"Generar Análisis con IA"** (botón azul con ⚡)
3. Espera a que se cargue el análisis

---

## 🔒 Seguridad - Lo que Cambió

### ✅ ANTES (Inseguro)
- API Key en el frontend `VITE_GEMINI_API_KEY`
- Visible en el código fuente
- Expuesta en DevTools del navegador
- Riesgo: Abuso de la API

### ✅ AHORA (Seguro)
- API Key solo en el servidor (variable de entorno)
- Frontend no tiene acceso a la clave
- Solo comunica con tu servidor
- Rate limiting: 20 solicitudes por 15 minutos
- CORS: Solo acepta solicitudes del frontend

---

## 📁 Estructura del Proyecto

```
casagestión/
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── geminiService.ts    ✅ Actualizado para usar backend
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── ...
│   ├── .env                         ✅ URL del servidor
│   ├── package.json                 ✅ Sin @google/genai
│   └── ...
│
└── server/
    ├── src/
    │   ├── config.ts               ✅ Validación de env
    │   ├── validators.ts           ✅ Validación con Zod
    │   ├── services/
    │   │   └── GeminiService.ts   ✅ API Key segura
    │   ├── middleware/
    │   │   └── index.ts           ✅ CORS, rate limiting
    │   ├── routes/
    │   │   ├── analyze.ts         ✅ POST /api/analyze
    │   │   └── index.ts           ✅ Rutas principales
    │   ├── app.ts                 ✅ Config Express
    │   └── index.ts               ✅ Entry point
    ├── .env.example               ✅ Template
    ├── .env                       ⚠️  Crea este manualmente
    ├── package.json               ✅ Dependencias backend
    ├── tsconfig.json              ✅ Config TypeScript
    └── README.md                  ✅ Documentación
```

---

## ⚠️ Solución de Problemas

### Error: "No se puede conectar con el servidor"
**Solución:**
```bash
# Verifica que el servidor está corriendo
# Terminal 1: cd server && npm run dev

# Verifica el .env tiene los valores correctos
cat server/.env

# Reinicia ambos procesos
```

### Error: "GEMINI_API_KEY no configurada"
**Solución:**
1. Copia `server/.env.example` a `server/.env`
2. Obtén tu clave en [ai.google.dev/aistudio](https://ai.google.dev/aistudio)
3. Pégala en `GEMINI_API_KEY=tu-clave-aqui`

### Error: "CORS error"
**Solución:**
1. Verifica que `FRONTEND_URL` en `server/.env` sea `http://localhost:5173`
2. Verifica que tu frontend esté en `http://localhost:5173` (no en otra dirección)

### Error: "Rate limit exceeded"
**Solución:** Espera 15 minutos o modifica en `server/.env`:
```env
RATE_LIMIT_MAX_REQUESTS=50  # Aumenta el límite
```

### Puerto 3001 ya está en uso
**Solución:**
1. Opción A: Mata el proceso que ocupa el puerto
2. Opción B: Cambia el puerto en `server/.env`:
   ```env
   PORT=3002
   ```
   Y en `frontend/.env`:
   ```env
   VITE_SERVER_URL=http://localhost:3002
   ```

---

## 📚 Comandos Útiles

### Desarrollo

```bash
# Iniciar todo (Windows)
.\dev.ps1

# Iniciar todo (Mac/Linux)
./dev.sh

# Servidor solamente
cd server && npm run dev

# Frontend solamente
npm run dev

# Verificar tipos TypeScript
cd server && npm run type-check
npm run type-check
```

### Producción

```bash
# Build del frontend
npm run build

# Build del servidor
cd server && npm run build

# Ejecutar servidor en producción
cd server && npm start
```

### Linting

```bash
# Frontend
npm run lint

# Servidor
cd server && npm run lint
```

---

## 🚀 Próximos Pasos

Después de confirmar que todo funciona:

1. **Error Boundaries** - Implementa manejo robusto de errores (Ver IMPLEMENTATION_GUIDE.md)
2. **Testing** - Agrega tests unitarios (Ver COMPLETE_CHECKLIST.md)
3. **Monitoreo** - Setup de Sentry para errores en producción
4. **Deploy** - Sube el servidor a Vercel, Railway o Fly.io

---

## 📖 Referencias

- [Documentación del Servidor](./server/README.md)
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- [COMPLETE_CHECKLIST.md](./COMPLETE_CHECKLIST.md)
- [Google AI Studio](https://ai.google.dev/aistudio)
- [Express.js Docs](https://expressjs.com)
- [Vite Docs](https://vitejs.dev)

---

## ✨ Cambios Realizados

✅ Servidor backend Express con TypeScript  
✅ API segura con clave en variables de entorno  
✅ Validación con Zod en el servidor  
✅ Rate limiting y CORS configurados  
✅ Frontend actualizado para usar servidor  
✅ Dependencia @google/genai removida del frontend  
✅ Variables de entorno configuradas  

---

¡Listo! Tu aplicación ahora tiene arquitectura backend segura. 🎉
