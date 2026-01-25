# 🛡️ ERROR BOUNDARY & SAFE STORAGE - GUÍA DE USO

## 📍 Lo que se implementó

### 1. **ErrorBoundary Component** (`/components/ErrorBoundary.tsx`)
- Captura errores no controlados de componentes hijos
- Muestra UI amigable al usuario
- Diferencia entre desarrollo y producción
- Botones para recuperarse del error

### 2. **useSafeLocalStorage Hook** (`/hooks/useSafeLocalStorage.ts`)
- localStorage seguro con try-catch
- Validación de JSON antes de parsear
- Sincronización entre pestañas
- 3 hooks disponibles

---

## 🎯 ERRORBOUND ARY

### ¿Qué hace?

Cuando un componente hijo falla, ErrorBoundary:
```
Componente Falla
     │
     ▼
ErrorBoundary lo captura
     │
     ▼
Muestra pantalla amigable (no crash total)
     │
     ├─ Error message
     ├─ Botón "Intentar de nuevo"
     ├─ Botón "Volver al inicio"
     └─ Tips de ayuda
```

### Cómo se implementó

Ya está envuelto en `App.tsx`:
```tsx
return (
  <ErrorBoundary>
    <Layout>
      {/* Tu contenido */}
    </Layout>
  </ErrorBoundary>
);
```

### Envolve secciones específicas (Opcional)

Si quieres atrapar errores de componentes específicos:

```tsx
import ErrorBoundary from './components/ErrorBoundary';

function MyPage() {
  return (
    <div>
      {/* Esta sección está protegida */}
      <ErrorBoundary>
        <ExpensiveComponent />
      </ErrorBoundary>

      {/* Esta no */}
      <OtherComponent />
    </div>
  );
}
```

### Qué errores captura

✅ Captura:
- Errores en render
- Errores en lifecycle methods
- Errores en event handlers (si los cierres dentro)

❌ NO captura:
- Errores asíncronos
- Event listeners
- setTimeout/setInterval

**Para errores asíncronos, usa try-catch normal:**
```tsx
const handleAsync = async () => {
  try {
    await fetchData();
  } catch (error) {
    console.error(error);
  }
};
```

---

## 🔒 USESAFELOCALSTORA GE

### ¿Qué hace?

Reemplaza `localStorage` directo por un hook seguro:

```tsx
// ❌ ANTES (inseguro)
const [user, setUser] = useState(() => {
  const saved = localStorage.getItem('user');
  return saved ? JSON.parse(saved) : null; // Puede fallar
});

// ✅ AHORA (seguro)
const [user, setUser] = useSafeLocalStorage('user', null);
```

### Hook #1: `useSafeLocalStorage` (Básico)

**Sintaxis:**
```tsx
const [value, setValue] = useSafeLocalStorage<T>(key, initialValue);
```

**Ejemplo 1: Guardar número**
```tsx
function Counter() {
  const [count, setCount] = useSafeLocalStorage('counter', 0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Incrementar
      </button>
    </div>
  );
}
```

**Ejemplo 2: Guardar objeto**
```tsx
interface User {
  id: string;
  name: string;
  email: string;
}

function UserProfile() {
  const [user, setUser] = useSafeLocalStorage<User>('currentUser', {
    id: '0',
    name: 'Guest',
    email: 'guest@example.com',
  });

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button
        onClick={() => setUser({
          id: '1',
          name: 'Juan',
          email: 'juan@example.com',
        })}
      >
        Login
      </button>
    </div>
  );
}
```

**Ejemplo 3: Guardar array**
```tsx
function TodoList() {
  const [todos, setTodos] = useSafeLocalStorage<string[]>('todos', []);

  return (
    <div>
      <ul>
        {todos.map(todo => (
          <li key={todo}>{todo}</li>
        ))}
      </ul>
      <button onClick={() => setTodos([...todos, 'New todo'])}>
        Add Todo
      </button>
    </div>
  );
}
```

### Hook #2: `useClearStorage` (Limpiar)

**Sintaxis:**
```tsx
const clearStorage = useClearStorage(keys?: string[]);
```

**Ejemplo 1: Limpiar claves específicas**
```tsx
function UserMenu() {
  const clearUserData = useClearStorage(['currentUser', 'preferences']);

  const handleLogout = () => {
    clearUserData(); // Limpia solo esas claves
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

**Ejemplo 2: Limpiar todo**
```tsx
function ResetApp() {
  const clearAll = useClearStorage(); // Sin argumentos

  const handleReset = () => {
    clearAll(); // Borra todo localStorage
  };

  return <button onClick={handleReset}>Reset App</button>;
}
```

### Hook #3: `useLocalStorageSize` (Monitoreo)

**Sintaxis:**
```tsx
const { used, available, percentage } = useLocalStorageSize();
```

**Ejemplo: Mostrar uso de storage**
```tsx
function StorageMonitor() {
  const { used, available, percentage } = useLocalStorageSize();

  return (
    <div className="p-4 bg-blue-50 rounded">
      <p>Almacenamiento usado: {(used / 1024).toFixed(2)} KB</p>
      <p>Disponible: {(available / 1024).toFixed(2)} KB</p>
      <p>Porcentaje: {percentage}%</p>
      
      {/* Barra de progreso */}
      <div className="w-full h-2 bg-gray-300 rounded mt-2">
        <div
          className="h-2 bg-blue-500 rounded"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

---

## 🔍 VALIDACIÓN INTERNA

El hook valida automáticamente:

```tsx
// ✅ JSON válido → Funciona
const [data, setData] = useSafeLocalStorage('key', {});
// localStorage tiene: {"name":"Juan"}
// Resultado: { name: "Juan" }

// ✅ Valor nulo → Retorna inicial
const [data, setData] = useSafeLocalStorage('key', []);
// localStorage tiene: null
// Resultado: []

// ✅ JSON inválido → Retorna inicial (+ warning)
const [data, setData] = useSafeLocalStorage('key', 'default');
// localStorage tiene: "esto no es json válido"
// Resultado: 'default'
// Console: [useSafeLocalStorage] JSON inválido...

// ✅ Storage no disponible → Retorna inicial
// (En SSR o navegadores sin localStorage)
const [data, setData] = useSafeLocalStorage('key', {});
// Resultado: {}
```

---

## 📊 EJEMPLO COMPLETO

Componente con ErrorBoundary + useSafeLocalStorage:

```tsx
import { useSafeLocalStorage } from '../hooks/useSafeLocalStorage';

interface PreferencesType {
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  notifications: boolean;
}

function SettingsPanel() {
  // Seguro desde el inicio
  const [preferences, setPreferences] = useSafeLocalStorage<PreferencesType>(
    'appPreferences',
    {
      theme: 'light',
      language: 'es',
      notifications: true,
    }
  );

  const toggleTheme = () => {
    setPreferences({
      ...preferences,
      theme: preferences.theme === 'light' ? 'dark' : 'light',
    });
  };

  const toggleNotifications = () => {
    setPreferences({
      ...preferences,
      notifications: !preferences.notifications,
    });
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Configuración</h2>

      <div className="space-y-4">
        {/* Tema */}
        <div className="flex items-center justify-between">
          <label>Tema: {preferences.theme.toUpperCase()}</label>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Cambiar
          </button>
        </div>

        {/* Idioma */}
        <div>
          <label>Idioma:</label>
          <select
            value={preferences.language}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                language: e.target.value as 'es' | 'en',
              })
            }
            className="ml-2 p-2 border rounded"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Notificaciones */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={preferences.notifications}
            onChange={toggleNotifications}
            className="mr-2"
          />
          <label>Habilitar notificaciones</label>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
```

---

## 🐛 DEBUGGING

### Ver errores en console

Los hooks loguean automáticamente:

```
[useSafeLocalStorage] JSON inválido para clave "user"
[useSafeLocalStorage] Error al leer "user" de localStorage
[useClearStorage] Error al limpiar localStorage
[useLocalStorageSize] Error al calcular tamaño
```

### Desarrollo vs Producción

ErrorBoundary muestra detalles técnicos solo en desarrollo:

```tsx
if (process.env.NODE_ENV === 'development') {
  // Mostrar error completo y componentStack
}
// En producción: solo mensaje amigable
```

---

## ✅ MEJORES PRÁCTICAS

### 1. Siempre proporciona valor inicial
```tsx
// ✅ Bueno
const [user, setUser] = useSafeLocalStorage('user', null);

// ❌ Evita
const [user, setUser] = useSafeLocalStorage('user', undefined);
```

### 2. Usa tipos genéricos
```tsx
// ✅ Bueno
const [user, setUser] = useSafeLocalStorage<User>('user', defaultUser);

// ❌ Evita (pierde type safety)
const [user, setUser] = useSafeLocalStorage('user', defaultUser);
```

### 3. Maneja errores de async
```tsx
// ❌ ErrorBoundary no lo captura
const handleAsync = async () => {
  const result = await fetchData(); // Error aquí no se captura
};

// ✅ Usa try-catch
const handleAsync = async () => {
  try {
    const result = await fetchData();
  } catch (error) {
    console.error(error);
  }
};
```

### 4. Limpia storage en logout
```tsx
const handleLogout = () => {
  const clearAuth = useClearStorage(['token', 'user']);
  clearAuth();
  navigate('/login');
};
```

---

## 🎓 RESUMEN

| Feature | Qué hace | Cuándo usar |
|---------|----------|-----------|
| ErrorBoundary | Captura errores render | Envuelve componentes principales |
| useSafeLocalStorage | localStorage seguro | En lugar de localStorage directo |
| useClearStorage | Limpia storage | En logout o reset |
| useLocalStorageSize | Monitorea uso | Debug o advertencias |

---

**Implementación lista. ¡Tu app es más robusta ahora! 🛡️**
