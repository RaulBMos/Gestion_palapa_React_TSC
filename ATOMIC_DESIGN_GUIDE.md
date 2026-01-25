# Estructura Atomic Design - CasaGestión

## 🏗️ Arquitectura de Componentes

El proyecto ahora sigue **Atomic Design** para máxima escalabilidad y mantenibilidad.

```
src/components/
├── atoms/          # Componentes atómicos (más pequeños)
├── molecules/       # Combinación de átomos
├── organisms/       # Componentes complejos de UI
├── templates/       # Layouts y wrappers
└── index.ts         # Exportaciones centralizadas
```

## 📁 Categorías

### 🧩 Atoms
Componentes UI más básicos e indepen client es:
- `Button.tsx` - Botón reutilizable con variantes
- `Input.tsx` - Campo de formulario con validación

### 🔬 Molecules
Combinaciones de átomos que forman funcionalidades simples:
- `DashboardCharts.tsx` - Gráficos para el dashboard

### 🦠 Organisms
Componentes complejos con lógica de negocio:
- `Dashboard.tsx` - Panel principal con KPIs y análisis
- `Reservations.tsx` - Gestión completa de reservas
- `Finances.tsx` - Gestión de transacciones financieras  
- `Clients.tsx` - Gestión de clientes
- `AIAnalysisPanel.tsx` - Panel de análisis con IA

### 📋 Templates
Layouts y estructuras que envuelven la aplicación:
- `Layout.tsx` - Estructura principal con navegación
- `ErrorBoundary.tsx` - Captura de errores
- `SuspenseWrapper.tsx` - Wrapper para carga lazy

## 🎣 Hooks Personalizados

La lógica de negocio está extraída en hooks personalizados:

```
src/hooks/
├── useDashboardLogic.ts     # Lógica del Dashboard (KPIs, IA)
├── useReservationLogic.ts   # Lógica de reservas (calendario, forms)
├── useCalendarUtils.ts       # Utilidades de calendario
├── useData.ts              # Conexión con Context API
└── useSafeLocalStorage.ts  # LocalStorage seguro
```

## 🔄 Principios Aplicados

### 1. Separación de Responsabilidades
- **Components**: Solo UI y presentacional
- **Hooks**: Toda la lógica de negocio
- **Services**: Comunicación con APIs externas

### 2. Componentes Presentacionales
Los componentes ahora son mayormente "dumb":
```tsx
// ✅ Bien - Solo renderizado
const Dashboard = () => {
  const { data, actions } = useDashboardLogic();
  return <UI data={data} {...actions} />;
};
```

### 3. Lógica Reutilizable
Los hooks personalizados permiten reutilizar lógica:
```tsx
// En cualquier componente
const {
  aiAnalysis,
  handleAiAnalysis,
  financialBalance
} = useDashboardLogic(transactions, reservations, cabins);
```

## 📦 Importaciones

Usar el index centralizado para imports limpios:

```tsx
import { 
  Button, 
  Input, 
  Dashboard, 
  Layout 
} from '@/components';
```

## 🧠 Beneficios

1. **Escalabilidad**: Fácil añadir nuevos componentes
2. **Mantenibilidad**: Lógica centralizada en hooks
3. **Testabilidad**: Componentes más fáciles de testear
4. **Reusabilidad**: Hooks y componentes desacoplados
5. **Claridad**: Estructura predecible y documentada

## 🚀 Próximos Pasos

- [ ] Añadir más átomos (Select, Modal, etc.)
- [ ] Crear molecules para formularios complejos
- [ ] Implementar tests unitarios para hooks
- [ ] Optimizar lazy loading con React 19 `use` hook