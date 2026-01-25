# 🚀 INSTRUCCIONES RÁPIDAS - CasaGestión Backend

## TL;DR - Lo esencial en 5 minutos

### ✅ Lo que se hizo

Se movió la API Key de Google Gemini del frontend al servidor para **proteger tu aplicación**.

**Antes:** ❌ API Key visible en DevTools  
**Ahora:** ✅ API Key segura en el servidor

---

## 🎬 EMPEZAR AHORA

### Paso 1: Obtén tu API Key (2 min)

1. Ve a: https://ai.google.dev/aistudio
2. Click: "Get API key"
3. Copia la clave

### Paso 2: Configura el Servidor (3 min)

```bash
# Terminal 1 - Servidor
cd server
npm install
cp .env.example .env

# Abre .env y pega tu API Key aquí:
# GEMINI_API_KEY=tu-clave-aqui
```

### Paso 3: Inicia Todo (1 min)

**Opción A - Windows (Recomendado):**
```powershell
.\dev.ps1
```

**Opción B - Mac/Linux:**
```bash
chmod +x dev.sh
./dev.sh
```

**Opción C - Manual (2 terminales):**
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
npm run dev
```

### Paso 4: Prueba (1 min)

1. Abre http://localhost:5173
2. Click "Generar Análisis con IA"
3. ¡Listo! ✅

---

## 📁 Lo que Cambió

| Archivo | Cambio |
|---------|--------|
| `services/geminiService.ts` | ✅ Ahora usa fetch al servidor |
| `components/Dashboard.tsx` | ✅ Maneja nueva respuesta |
| `package.json` | ✅ Removido @google/genai |
| `.env` | ✅ URL del servidor |
| `/server` | 🆕 Nuevo servidor Express |

---

## 🔧 Comandos Clave

```bash
# Iniciar todo (Windows)
.\dev.ps1

# Iniciar servidor solo
cd server && npm run dev

# Iniciar frontend solo
npm run dev

# Probar endpoint
curl http://localhost:3001/api/health
```

---

## ⚠️ Errores Comunes

| Error | Solución |
|-------|----------|
| "No se puede conectar" | Asegúrate que `cd server && npm run dev` está corriendo |
| "API Key error" | Copia `.env.example` a `.env` y llena GEMINI_API_KEY |
| "CORS error" | Verifica que frontend está en http://localhost:5173 |
| "Port already in use" | Cambia PORT en `server/.env` |

---

## 📚 Documentación Completa

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Instalación detallada
- [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) - Lista de verificación
- [QUICK_START.md](./QUICK_START.md) - Explicación ejecutiva
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) - Diagramas

---

## ✨ ¡Hecho!

Tu app ahora es **segura y profesional**. 🎉

Preguntas: Lee [SETUP_GUIDE.md](./SETUP_GUIDE.md#solución-de-problemas)
