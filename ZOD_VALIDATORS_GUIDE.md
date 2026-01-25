# 📋 ZOD VALIDATORS - GUÍA COMPLETA

**Archivo:** `/utils/validators.ts`

Validación robusta de datos con Zod para ClientSchema, ReservationSchema, y TransactionSchema.

---

## 🎯 ¿QUÉ ES ZOD?

Zod es una librería de validación de datos con soporte para TypeScript. Permite:
- ✅ Validar datos en tiempo de ejecución
- ✅ Generar tipos TypeScript automáticamente
- ✅ Mensajes de error descriptivos
- ✅ Validaciones personalizadas

---

## 📦 ESQUEMAS DISPONIBLES

### 1. **ClientSchema** - Validar Clientes

```tsx
import { validateData, ClientSchema } from '../utils/validators';

// ✅ Datos válidos
const validClient = {
  id: '1',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '+52 555 1234567',
  notes: 'Cliente VIP',
};

// ✅ Validar
const client = validateData(ClientSchema, validClient);
// Resultado: { id: '1', name: 'Juan Pérez', email: '...', phone: '...', notes: '...' }
```

**Validaciones incluidas:**
- ✅ `id` - Requerido, string no vacío
- ✅ `name` - 2-100 caracteres
- ✅ `email` - Formato email válido
- ✅ `phone` - Mínimo 10 dígitos
- ✅ `notes` - Opcional, máximo 500 caracteres

---

### 2. **ReservationSchema** - Validar Reservaciones

```tsx
import { validateData, ReservationSchema } from '../utils/validators';

const validReservation = {
  id: '101',
  clientId: '1',
  cabinCount: 2,
  startDate: '2026-02-01',
  endDate: '2026-02-10',
  adults: 4,
  children: 2,
  totalAmount: 5000,
  status: 'Confirmada',
};

const reservation = validateData(ReservationSchema, validReservation);
```

**Validaciones incluidas:**
- ✅ `id` - Requerido
- ✅ `clientId` - Requerido
- ✅ `cabinCount` - 1-10 cabañas
- ✅ `startDate` - Formato ISO (YYYY-MM-DD)
- ✅ `endDate` - Formato ISO (YYYY-MM-DD)
- ✅ `endDate > startDate` - **✨ Validación personalizada**
- ✅ Duración máxima 365 días - **✨ Validación personalizada**
- ✅ `adults` - Mínimo 1, máximo 50
- ✅ `children` - 0-50
- ✅ `totalAmount` - Positivo
- ✅ `status` - Uno de: Información, Confirmada, Completada, Cancelada

**Ejemplo con error (endDate inválida):**
```tsx
const invalidReservation = {
  id: '101',
  clientId: '1',
  cabinCount: 2,
  startDate: '2026-02-10',
  endDate: '2026-02-01', // ❌ Antes de startDate
  adults: 4,
  children: 2,
  totalAmount: 5000,
  status: 'Confirmada',
};

try {
  validateData(ReservationSchema, invalidReservation);
} catch (error) {
  console.error(error.message);
  // Resultado: Validación fallida:
  //           endDate: La fecha de fin debe ser posterior a la fecha de inicio
}
```

---

### 3. **TransactionSchema** - Validar Transacciones

```tsx
import { validateData, TransactionSchema } from '../utils/validators';

const validTransaction = {
  id: 't1',
  date: '2026-01-25',
  amount: 5000,
  type: 'Ingreso',
  category: 'Renta',
  description: 'Reserva enero',
  paymentMethod: 'Transferencia',
  reservationId: '101',
};

const transaction = validateData(TransactionSchema, validTransaction);
```

**Validaciones incluidas:**
- ✅ `id` - Requerido
- ✅ `date` - Formato ISO (YYYY-MM-DD)
- ✅ `amount` - Positivo
- ✅ `type` - Ingreso o Gasto
- ✅ `category` - 1-50 caracteres
- ✅ `description` - 1-300 caracteres
- ✅ `paymentMethod` - Efectivo o Transferencia
- ✅ `reservationId` - Opcional

---

## 🛠️ FUNCIONES DE VALIDACIÓN

### **validateData<T>()** - Validación Estricta

Lanza error si la validación falla.

```tsx
try {
  const client = validateData(ClientSchema, userData);
  console.log('Cliente válido:', client);
} catch (error) {
  console.error('Error:', error.message);
}
```

**Mejor para:**
- Cuando NECESITAS que los datos sean válidos
- Operaciones críticas
- API calls

---

### **safeValidateData<T>()** - Validación Segura

No lanza error, retorna objeto con resultado.

```tsx
const result = safeValidateData(ClientSchema, userData);

if (result.success) {
  console.log('Datos válidos:', result.data);
} else {
  console.log('Errores:', result.errors);
  // Resultado: ['name: El nombre debe tener al menos 2 caracteres']
}
```

**Mejor para:**
- Forms y UX
- Mostrar errores al usuario
- Validaciones no-críticas

---

### **partialValidateData<T>()** - Validación Parcial

Valida solo las propiedades proporcionadas.

```tsx
// Actualización parcial - solo cambiar el nombre
const partialUpdate = {
  name: 'Juan Nuevo',
};

const updatedClient = partialValidateData(ClientSchema, partialUpdate);
// Resultado: { name: 'Juan Nuevo' }
```

**Mejor para:**
- PUT/PATCH requests
- Actualizaciones parciales
- Edición de formularios

---

## 📚 EJEMPLOS PRÁCTICOS

### Ejemplo 1: Validar form de cliente

```tsx
import { safeValidateData, ClientSchema } from '../utils/validators';

function AddClientForm() {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validar datos
    const result = safeValidateData(ClientSchema, formData);

    if (result.success) {
      console.log('Cliente agregado:', result.data);
      // Guardar en DB/storage
    } else {
      setErrors(result.errors || []);
      // Mostrar errores en UI
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Nombre"
      />
      {errors.length > 0 && (
        <ul className="errors">
          {errors.map((err) => <li key={err}>{err}</li>)}
        </ul>
      )}
      <button type="submit">Guardar</button>
    </form>
  );
}
```

---

### Ejemplo 2: Validar reservación con .refine()

```tsx
import { validateData, ReservationSchema } from '../utils/validators';

function BookingForm() {
  const [booking, setBooking] = useState({
    startDate: '2026-02-01',
    endDate: '2026-02-01', // ❌ Misma fecha
  });

  const handleBook = () => {
    try {
      // ✅ El esquema valida automáticamente que endDate > startDate
      const reservation = validateData(ReservationSchema, booking);
      console.log('Reservación válida:', reservation);
    } catch (error) {
      // Error personalizado por .refine()
      console.error(error.message);
      // "Validación fallida: endDate: La fecha de fin debe ser posterior..."
    }
  };

  return (
    <button onClick={handleBook}>
      Reservar del {booking.startDate} al {booking.endDate}
    </button>
  );
}
```

---

### Ejemplo 3: Mostrar errores en el formulario

```tsx
import { safeValidateData, TransactionSchema } from '../utils/validators';

function TransactionForm() {
  const [formData, setFormData] = useState({
    id: 't1',
    date: '2026-01-25',
    amount: -100, // ❌ Negativo
    type: 'Ingreso',
    category: 'Renta',
    description: 'Test',
    paymentMethod: 'Transferencia',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // ✅ Validar en tiempo real
    const result = safeValidateData(TransactionSchema, {
      ...formData,
      [name]: value,
    });

    if (!result.success) {
      console.log('Errores actuales:', result.errors);
    }
  };

  return (
    <input
      name="amount"
      type="number"
      value={formData.amount}
      onChange={handleChange}
      placeholder="Monto"
    />
  );
}
```

---

### Ejemplo 4: Actualización parcial

```tsx
import { partialValidateData, ClientSchema } from '../utils/validators';

function EditClientForm() {
  const handleUpdate = async (clientId: string, updates: Partial<Client>) => {
    // ✅ Validar solo los campos que se actualizan
    const validUpdates = partialValidateData(ClientSchema, updates);

    // Enviar al servidor
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(validUpdates),
    });
  };

  // Uso: Actualizar solo el email
  handleUpdate('1', { email: 'nuevo@example.com' });
  // ✅ No valida nombre, teléfono, etc.
}
```

---

## ✨ TIPOS EXPORTADOS

Zod genera tipos automáticamente:

```tsx
import {
  ValidatedClient,
  ValidatedReservation,
  ValidatedTransaction,
} from '../utils/validators';

// Usar tipos para type safety
const client: ValidatedClient = {
  id: '1',
  name: 'Juan',
  email: 'juan@example.com',
  phone: '+52 555 1234567',
};

// TypeScript sugiere las propiedades correctas
```

---

## 🔍 MENSAJES DE ERROR

### Errores automáticos:

```tsx
// Email inválido
{ email: 'juan' }
// Error: "email: El email debe ser válido"

// Nombre muy corto
{ name: 'J' }
// Error: "name: El nombre debe tener al menos 2 caracteres"

// Teléfono incompleto
{ phone: '555' }
// Error: "phone: El teléfono debe tener al menos 10 dígitos"

// endDate antes de startDate
{ startDate: '2026-02-10', endDate: '2026-02-01' }
// Error: "endDate: La fecha de fin debe ser posterior a la fecha de inicio"

// Duración > 365 días
{ startDate: '2026-02-01', endDate: '2027-02-02' }
// Error: "endDate: La reservación no puede ser mayor a 365 días"

// Monto negativo
{ amount: -100 }
// Error: "amount: El monto debe ser positivo"
```

---

## 📊 COMPARACIÓN DE FUNCIONES

| Función | Lanza Error | Retorna Resultado | Mejor Para |
|---------|------------|-------------------|-----------|
| `validateData()` | ✅ Sí | Datos | Operaciones críticas |
| `safeValidateData()` | ❌ No | Objeto con éxito | Forms y UX |
| `partialValidateData()` | ✅ Sí | Datos parciales | Actualizaciones |

---

## ✅ MEJORES PRÁCTICAS

### 1. Usa `safeValidateData()` en forms

```tsx
// ✅ Bueno - No interrompe UX
const result = safeValidateData(ClientSchema, formData);
if (result.success) {
  // Guardar
} else {
  // Mostrar errores
}

// ❌ Evita - Interrumpe si hay error
const data = validateData(ClientSchema, formData);
```

### 2. Valida en tiempo real

```tsx
// ✅ Bueno - Feedback inmediato
const handleChange = (e) => {
  const newData = { ...formData, [e.target.name]: e.target.value };
  const result = safeValidateData(ClientSchema, newData);
  setErrors(result.errors || []);
};
```

### 3. Usa tipos generados

```tsx
// ✅ Bueno - Type safety
const client: ValidatedClient = { /* ... */ };

// ❌ Evita - Pierde información de tipo
const client: any = { /* ... */ };
```

---

## 🐛 DEBUGGING

Ver esquema en la consola:

```tsx
import { ClientSchema } from '../utils/validators';

// Ver estructura del esquema
console.log(ClientSchema.description);
console.log(ClientSchema.shape);
```

Ver errores detallados:

```tsx
try {
  validateData(ClientSchema, invalidData);
} catch (error) {
  console.log('Errores completos:');
  console.error(error);
}
```

---

## 🎯 CASOS DE USO

**Usa `validateData()` para:**
- API calls
- Guardado en BD
- Operaciones críticas

**Usa `safeValidateData()` para:**
- Formularios
- Validación en tiempo real
- UX interactiva

**Usa `partialValidateData()` para:**
- PATCH requests
- Ediciones parciales
- Actualizaciones

---

## 🚀 INTEGRACIÓN CON COMPONENTES

En tus componentes actuales, puedes usar así:

```tsx
import { useSafeLocalStorage } from './hooks/useSafeLocalStorage';
import { safeValidateData, ClientSchema } from './utils/validators';

function ClientList() {
  const [clients, setClients] = useSafeLocalStorage('clients', []);

  const addClient = (newClient: any) => {
    // ✅ Validar antes de guardar
    const result = safeValidateData(ClientSchema, newClient);

    if (result.success) {
      setClients([...clients, result.data]);
    } else {
      console.error('Cliente inválido:', result.errors);
    }
  };

  return /* ... */;
}
```

---

**¡Validación robusta implementada!** ✅
