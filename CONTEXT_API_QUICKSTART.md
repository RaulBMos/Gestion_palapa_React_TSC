# 🏗️ GUÍA RÁPIDA: NUEVA ESTRUCTURA CON CONTEXT API

## 📋 QUICK START

### 1️⃣ El proyecto ya está refactorizado

Todos los cambios ya están hechos. Solo necesitas entender cómo funciona.

### 2️⃣ Visualiza la estructura

```
App.tsx
├── ErrorBoundary (atrapa errores)
└── DataProvider (provee datos)
    └── AppContent (routing)
        ├── Dashboard (usa useDataState())
        ├── Clients (usa useClients())
        ├── Reservations (usa useData())
        └── Finances (usa useTransactions())
```

### 3️⃣ Sin props drilling

**❌ ANTES:**
```tsx
<Dashboard 
  transactions={transactions} 
  reservations={reservations}
  totalAvailableCabins={TOTAL_CABINS}
/>
```

**✅ AHORA:**
```tsx
<Dashboard />  // Dashboard usa useDataState() adentro
```

---

## 🎯 COMO USAR EN COMPONENTES

### Caso 1: Leer datos (recomendado para dashboards)

```tsx
import { useDataState } from '../hooks/useData';

function Dashboard() {
  const { transactions, reservations, totalCabins } = useDataState();
  
  return (
    <div>
      <p>Total cabañas: {totalCabins}</p>
      <p>Reservas: {reservations.length}</p>
    </div>
  );
}
```

### Caso 2: Leer y modificar clientes

```tsx
import { useClients } from '../hooks/useData';

function ClientList() {
  const { clients, addClient, editClient, deleteClient } = useClients();
  
  const handleAdd = () => {
    addClient({
      id: '4',
      name: 'Juan',
      email: 'juan@example.com',
      phone: '+52 555 1234567'
    });
  };
  
  return (
    <div>
      {clients.map(c => (
        <div key={c.id}>
          {c.name}
          <button onClick={() => editClient({...c, name: 'Carlos'})}>
            Editar
          </button>
          <button onClick={() => deleteClient(c.id)}>
            Eliminar
          </button>
        </div>
      ))}
      <button onClick={handleAdd}>Agregar</button>
    </div>
  );
}
```

### Caso 3: Acceso completo (usa cuando necesites todo)

```tsx
import { useData } from '../hooks/useData';

function ComplexComponent() {
  const {
    clients,
    reservations,
    transactions,
    totalCabins,
    addClient,
    addReservation,
    addTransaction,
    // ... todas las acciones
  } = useData();
  
  // Usar todo aquí
}
```

---

## 🪝 HOOKS DISPONIBLES

| Hook | Qué proporciona | Cuándo usar |
|------|-----------------|------------|
| `useData()` | TODO (estado + acciones) | Cuando necesitas todo |
| `useClients()` | Clientes + acciones | Formularios de clientes |
| `useReservations()` | Reservaciones + acciones | Gestión de reservas |
| `useTransactions()` | Transacciones + acciones | Finanzas |
| `useDataState()` | Solo datos, sin acciones | Dashboards, reportes |

---

## 💡 EJEMPLOS PRÁCTICOS

### Agregar un cliente

```tsx
import { useClients } from '../hooks/useData';

function AddClientForm() {
  const { addClient } = useClients();
  const [name, setName] = React.useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    addClient({
      id: Date.now().toString(),
      name,
      email: 'auto@generated.com',
      phone: '0000000000'
    });
    setName('');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
      />
      <button type="submit">Agregar</button>
    </form>
  );
}
```

### Mostrar transacciones

```tsx
import { useTransactions } from '../hooks/useData';

function TransactionList() {
  const { transactions } = useTransactions();
  
  return (
    <ul>
      {transactions.map(t => (
        <li key={t.id}>
          {t.description}: ${t.amount}
        </li>
      ))}
    </ul>
  );
}
```

### Filtrar reservaciones archivadas

```tsx
import { useReservations } from '../hooks/useData';

function ActiveReservations() {
  const { reservations } = useReservations();
  
  const active = reservations.filter(r => !r.isArchived);
  
  return (
    <div>
      <h2>Reservas Activas ({active.length})</h2>
      {active.map(r => (
        <div key={r.id}>{r.id}</div>
      ))}
    </div>
  );
}
```

---

## ⚠️ ERRORES COMUNES

### Error 1: "Cannot find module 'react' while using context"
```
❌ Olvidaste envolver con DataProvider
✅ Solución: Asegúrate que DataProvider está en App.tsx
```

### Error 2: "useData() must be called inside DataProvider"
```
❌ Intentas usar el hook fuera del DataProvider
✅ Solución: El componente debe estar dentro del árbol de DataProvider
```

### Error 3: "clients is undefined"
```tsx
❌ const { clients } = useClients();  // Incorrecto
✅ const { clients, addClient } = useClients();
```

---

## 🔍 DEBUGGING

### Ver qué hay en el contexto

```tsx
const data = useData();
console.log('Contexto completo:', data);
console.log('Clientes:', data.clients);
console.log('Acciones:', {
  addClient: data.addClient,
  editClient: data.editClient
});
```

### Verificar si localStorage funciona

```tsx
function CheckStorage() {
  React.useEffect(() => {
    console.log('Clientes en localStorage:', 
      localStorage.getItem('cg_clients'));
  }, []);
}
```

---

## 📊 COMPARACIÓN ANTES vs DESPUÉS

### ANTES (Props Drilling)

```tsx
// App.tsx
const [clients, setClients] = useState([]);
const [reservations, setReservations] = useState([]);
const [transactions, setTransactions] = useState([]);

<Reservations 
  reservations={reservations}
  clients={clients}
  totalAvailableCabins={TOTAL_CABINS}
  addReservation={addReservation}
  editReservation={editReservation}
  updateReservationStatus={updateReservationStatus}
  archiveReservation={archiveReservation}
/>

// Reservations.tsx
interface ReservationsProps {
  reservations: Reservation[];
  clients: Client[];
  totalAvailableCabins: number;
  addReservation: (res: Reservation) => void;
  editReservation: (res: Reservation) => void;
  updateReservationStatus: (id: string, status: ReservationStatus) => void;
  archiveReservation: (id: string) => void;
}

export const Reservations: React.FC<ReservationsProps> = ({ 
  reservations, 
  clients, 
  totalAvailableCabins,
  addReservation, 
  editReservation,
  updateReservationStatus,
  archiveReservation
}) => {
  // ... usar props
}
```

### AHORA (Context API)

```tsx
// App.tsx
<DataProvider>
  <AppContent />
</DataProvider>

// AppContent.tsx
<Reservations />  // Sin props

// Reservations.tsx
import { useData } from '../hooks/useData';

export const Reservations: React.FC = () => {
  const { 
    reservations, 
    clients, 
    totalCabins,
    addReservation, 
    editReservation,
    updateReservationStatus,
    archiveReservation
  } = useData();
  
  // ... usar datos del contexto
}
```

---

## ✅ CHECKLIST: SI QUIERO CREAR UN COMPONENTE NUEVO

- [ ] Creo el archivo en `/components`
- [ ] Importo el hook necesario:
  - Para leer datos: `import { useDataState }`
  - Para clientes: `import { useClients }`
  - Para reservaciones: `import { useReservations }`
  - Para todo: `import { useData }`
- [ ] Uso el hook en el componente
- [ ] NO paso props desde App.tsx (ya están en el contexto)
- [ ] Pruebo en el navegador

---

## 🧪 TESTING

### Componente puede usarse sin props

```tsx
// En App.tsx
<Dashboard />  // ✅ Funciona, usa useDataState()

// En un test
render(<Dashboard />);  // ✅ Necesita DataProvider pero no props
```

### Con DataProvider en test

```tsx
import { render } from '@testing-library/react';
import { DataProvider } from '../contexts/DataContext';
import Dashboard from '../components/Dashboard';

test('Dashboard renderiza', () => {
  render(
    <DataProvider>
      <Dashboard />
    </DataProvider>
  );
});
```

---

## 🚀 PATRONES RECOMENDADOS

### Patrón 1: Componente que solo lee

```tsx
import { useDataState } from '../hooks/useData';

export function Stats() {
  const { clients, reservations } = useDataState();
  return <div>Clientes: {clients.length}</div>;
}
```

### Patrón 2: Componente que modifica

```tsx
import { useClients } from '../hooks/useData';

export function ClientForm() {
  const { addClient } = useClients();
  // ... formulario que llama addClient()
}
```

### Patrón 3: Componente complejo

```tsx
import { useData } from '../hooks/useData';

export function Dashboard() {
  const data = useData();
  // Acceso a TODO el contexto
}
```

---

## 📖 DOCUMENTOS RELACIONADOS

- [REFACTORING_GUIDE.md](REFACTORING_GUIDE.md) - Guía completa de migración
- [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) - Resumen técnico
- [ZOD_VALIDATORS_GUIDE.md](ZOD_VALIDATORS_GUIDE.md) - Validación de datos

---

## 🎓 RECURSOS

- [React Context API Documentation](https://react.dev/reference/react/useContext)
- [React Hooks Documentation](https://react.dev/reference/react/hooks)
- [Custom Hooks Patterns](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Puedo mezclar props y useData()?**
- R: Sí, los componentes tienen retrocompatibilidad. Si pasas props, se usan. Si no, se usa el hook.

**P: ¿Qué sucede con el localStorage?**
- R: DataContext usa useSafeLocalStorage automáticamente. Los datos se guardan cuando cambias estado.

**P: ¿Necesito limpiar el contexto manualmente?**
- R: No, se limpia automáticamente cuando el componente se desmonta.

**P: ¿Puedo tener múltiples DataProviders?**
- R: Sí, pero generalmente no es necesario. Uno solo es suficiente.

**P: ¿Cómo depuro si algo no funciona?**
- R: Usa `useData()` en tu componente y haz console.log del resultado.

---

**¡Listo para usar! 🎉**
