# 🚀 Guía de Despliegue Local - Casa Gestión PWA

## ⚡ Quick Start (1 minuto)

```bash
npm install
npm run dev
```

Luego abre: **http://localhost:5173**

---

## 📋 Pasos Detallados

### 1. Requisitos Previos
```bash
# Verifica que tengas Node.js instalado
node --version  # Debe ser v18+
npm --version   # Debe ser v9+
```

Si no tienes Node.js, descárgalo de: https://nodejs.org/

---

### 2. Instalación de Dependencias
```bash
cd "C:\Proyectos Python\Proyecto Palapa gestion servicios"
npm install
```

**Primera ejecución**: Espera 2-3 minutos mientras instala ~500 paquetes
**Ejecuciones posteriores**: ~10 segundos

---

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

**Salida esperada**:
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

### 4. Abrir en el Navegador
Haz clic en: http://localhost:5173/

O copia y pega la URL en tu navegador

---

## 📚 Comandos Disponibles

### Desarrollo
```bash
npm run dev          # Servidor local con hot reload
npm run build        # Compilar para producción
npm run preview      # Ver compilación de producción
```

### Testing
```bash
npm run test         # Tests en modo watch
npm run test:run     # Tests de una sola ejecución
npm run test:coverage # Reporte de cobertura
```

### Build
```bash
npm run build        # Genera carpeta dist/
npm run preview      # Previsualiza el build
```

---

## 🎯 Características Disponibles

### En el Dashboard
- 📊 Panel de control con KPIs
- 💰 Resumen financiero
- 📈 Gráficos de flujo de caja
- 🤖 Análisis con IA (Gemini)

### Gestión de Datos
- 👥 Administrar clientes
- 📅 Gestionar reservaciones
- 💸 Registrar transacciones
- 💾 Persistencia automática (localStorage)

---

## 🔧 Troubleshooting

### Problema: Puerto 5173 ya en uso
```bash
# Usa un puerto diferente
npm run dev -- --port 3000
```

### Problema: npm install falla
```bash
# Limpia caché y reintentas
npm cache clean --force
npm install
```

### Problema: Cambios no aparecen
```bash
# El hot reload debe ser automático, pero si no:
# 1. Presiona Ctrl+C en la terminal
# 2. Ejecuta npm run dev nuevamente
```

### Problema: Módulos no encontrados
```bash
# Reconstruye los módulos
rm -r node_modules
npm install
npm run dev
```

---

## 📂 Estructura de Carpetas

```
proyecto/
├── src/
│   ├── components/      # Componentes React
│   ├── contexts/        # Context API
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utilidades y cálculos
│   ├── services/        # Servicios (AI, etc)
│   └── App.tsx          # Componente principal
├── public/              # Archivos estáticos
├── dist/                # Build de producción
├── package.json         # Dependencias
└── vite.config.ts      # Configuración Vite
```

---

## 🌐 Acceso a la Aplicación

### Local
- URL: http://localhost:5173/
- Host: Tu máquina
- Puerto: 5173

### Data Persistencia
- Tipo: localStorage del navegador
- Ubicación: DevTools → Application → localStorage
- Permanencia: Se mantiene entre sesiones

---

## 🧪 Verificar que Todo Funciona

```bash
# 1. Inicia la aplicación
npm run dev

# 2. En otra terminal, ejecuta tests
npm run test:run

# 3. Verifica salida
# ✓ 30 passed (30)
```

---

## 💡 Tips Útiles

### Hot Reload
- Los cambios en archivos se reflejan automáticamente
- No necesitas recargar la página

### DevTools
- Abre DevTools: F12
- Ve a Application → Storage → localStorage
- Aquí están todos tus datos guardados

### Limpiar Datos
```javascript
// En la consola del navegador:
localStorage.clear();
location.reload();
```

---

## 🎬 Workflow Típico

1. **Abrir terminal**
```bash
cd "C:\Proyectos Python\Proyecto Palapa gestion servicios"
```

2. **Instalar dependencias (primera vez)**
```bash
npm install
```

3. **Iniciar servidor**
```bash
npm run dev
```

4. **Abre en navegador**
- http://localhost:5173/

5. **Desarrolla y ve cambios en vivo**
- Modifica archivos en src/
- Los cambios aparecen automáticamente

6. **Ejecutar tests**
```bash
npm run test:run
```

---

## 📊 Performance Local

| Métrica | Valor |
|---------|-------|
| npm install (primera) | 2-3 min |
| npm install (después) | 10 seg |
| npm run dev startup | 200-500ms |
| Hot reload | <100ms |
| Tests | ~2 seg |

---

## 🚀 Producción (Cuando estés listo)

```bash
# 1. Build para producción
npm run build

# 2. Ver el build localmente
npm run preview

# 3. Desplegar carpeta dist/ a hosting
# (Vercel, Netlify, etc)
```

---

## 📞 Variables de Entorno

Si necesitas configurar variables (como API keys):

1. Crea archivo `.env` en la raíz
2. Agrega variables:
```
VITE_API_URL=http://localhost:3000
VITE_GEMINI_API_KEY=tu-clave
```

3. Accede en el código:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## ✅ Checklist Local

- ✅ Node.js v18+ instalado
- ✅ npm install ejecutado
- ✅ npm run dev funciona
- ✅ http://localhost:5173 abre sin errores
- ✅ Puedes crear datos (clientes, reservas)
- ✅ Los datos persisten al recargar
- ✅ npm run test:run pasa todos los tests

---

**¡Listo para desarrollar! 🎉**
