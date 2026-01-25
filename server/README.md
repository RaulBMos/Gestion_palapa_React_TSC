# CasaGestión Backend Server

Servidor Express en TypeScript que actúa como proxy seguro para la API de Google Gemini.

## 🚀 Quick Start

### 1. Instalación de Dependencias

```bash
cd server
npm install
```

### 2. Configuración de Variables de Entorno

```bash
# Copiar .env.example a .env
cp .env.example .env

# Editar .env y agregar:
GEMINI_API_KEY=tu-api-key-aqui
FRONTEND_URL=http://localhost:5173  # Tu URL del frontend
```

### 3. Desarrollo

```bash
npm run dev
```

El servidor estará en `http://localhost:3001`

### 4. Build para Producción

```bash
npm run build
npm start
```

---

## 📋 API Endpoints

### GET /api/health

Health check del servidor.

```bash
curl http://localhost:3001/api/health
```

Respuesta:
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T10:30:00.000Z"
}
```

### POST /api/analyze

Analiza datos financieros usando Gemini AI.

**Body:**
```json
{
  "transactions": [
    {
      "id": "t1",
      "date": "2024-01-15",
      "amount": 5000,
      "type": "Ingreso",
      "category": "Renta",
      "description": "Reserva #101",
      "paymentMethod": "Transferencia",
      "reservationId": "101"
    }
  ],
  "reservations": [
    {
      "id": "101",
      "clientId": "1",
      "cabinCount": 1,
      "startDate": "2024-01-15",
      "endDate": "2024-01-20",
      "adults": 2,
      "children": 0,
      "totalAmount": 5000,
      "status": "Confirmada"
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": "# Análisis de Inteligencia Artificial\n\n..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Descripción del error"
}
```

---

## 🔒 Seguridad

### ✅ Implementado

- **API Key Local**: La API Key de Gemini se mantiene en el servidor, nunca se expone al frontend
- **CORS Configurado**: Solo permite solicitudes desde tu dominio frontend
- **Rate Limiting**: Protege contra abuse (20 requests por 15 min)
- **Validación de Input**: Zod valida todos los datos recibidos
- **Error Handling**: Errores específicos sin exponer detalles internos
- **HTTPS Ready**: Compatible con HTTPS en producción

### Variables de Entorno

```bash
GEMINI_API_KEY=...          # API Key de Google Gemini
FRONTEND_URL=...            # URL del frontend (CORS)
PORT=3001                   # Puerto del servidor
NODE_ENV=development        # development o production
RATE_LIMIT_WINDOW_MS=900000 # Ventana de rate limiting
RATE_LIMIT_MAX_REQUESTS=20  # Max requests por ventana
```

---

## 📦 Estructura

```
server/
├── src/
│   ├── index.ts            # Entry point
│   ├── app.ts              # Configuración Express
│   ├── config.ts           # Variables de entorno
│   ├── types.ts            # Tipos TypeScript
│   ├── validators.ts       # Validación con Zod
│   ├── middleware/
│   │   └── index.ts        # CORS, rate limiting, etc.
│   ├── routes/
│   │   ├── index.ts        # Router principal
│   │   └── analyze.ts      # Handler de análisis
│   └── services/
│       └── GeminiService.ts # Lógica de Gemini AI
├── dist/                   # Compilado (después de build)
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🧪 Testing

### Health Check

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Test
curl http://localhost:3001/api/health
```

### Análisis de Datos

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {"id":"1","date":"2024-01-15","amount":5000,"type":"Ingreso","category":"Renta","description":"Test","paymentMethod":"Transferencia"}
    ],
    "reservations": [
      {"id":"1","clientId":"1","cabinCount":1,"startDate":"2024-01-15","endDate":"2024-01-20","adults":2,"children":0,"totalAmount":5000,"status":"Confirmada"}
    ]
  }'
```

---

## 🚨 Errores Comunes

### "API Key de Gemini no configurada"
→ Asegúrate de tener `GEMINI_API_KEY` en `.env`

### "Not allowed by CORS"
→ Verifica que `FRONTEND_URL` en `.env` coincida con tu dominio frontend

### "Timeout excedido"
→ La solicitud a Gemini tardó más de 30 segundos. Intenta de nuevo.

### "Demasiadas solicitudes"
→ Alcanzaste el límite de rate limiting. Espera 15 minutos.

---

## 📚 Referencia de Tipos

Ver `src/types.ts` para los tipos de Transaction y Reservation.

---

## 🔄 Integración con Frontend

Ver `../services/geminiService.ts` en el frontend para cómo llamar este servidor.

---

**Servidor listo para producción** ✅

