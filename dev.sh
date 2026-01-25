#!/bin/bash
# Script para iniciar tanto el servidor backend como el frontend

echo "🚀 Iniciando CasaGestión (Frontend + Backend)..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que existe la carpeta server
if [ ! -d "server" ]; then
  echo "❌ Carpeta 'server' no encontrada"
  exit 1
fi

# Verificar que existe node_modules en server
if [ ! -d "server/node_modules" ]; then
  echo "⚠️  Instalando dependencias del servidor..."
  cd server
  npm install
  cd ..
fi

# Iniciar el servidor backend en background
echo -e "${BLUE}📦 Iniciando servidor backend en puerto 3001...${NC}"
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Esperar un segundo para que el servidor se inicie
sleep 2

# Iniciar el frontend Vite
echo -e "${BLUE}⚛️  Iniciando frontend Vite en puerto 5173...${NC}"
npm run dev

# Limpiar: detener el servidor cuando se cierre el frontend
kill $SERVER_PID 2>/dev/null

echo -e "${GREEN}✅ Aplicación cerrada${NC}"
