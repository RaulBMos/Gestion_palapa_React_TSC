import { useState, useCallback, useEffect } from 'react';

/**
 * Hook seguro para localStorage
 * - Maneja errores de lectura/escritura
 * - Valida JSON válido antes de parsear
 * - Proporciona valores iniciales seguros
 * 
 * @param key - Clave en localStorage
 * @param initialValue - Valor inicial si no existe o hay error
 * @returns [value, setValue] similar a useState
 * 
 * @example
 * const [count, setCount] = useSafeLocalStorage('count', 0);
 * const [user, setUser] = useSafeLocalStorage('user', { name: 'Guest' });
 */
export function useSafeLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Estado para el valor actual - usando lazy initializer
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Verificar que localStorage está disponible
      if (typeof window === 'undefined') {
        return initialValue;
      }

      // Obtener el valor de localStorage
      const item = window.localStorage.getItem(key);

      if (item === null) {
        // No existe la clave, retornar valor inicial
        return initialValue;
      }

      // Validar que sea JSON válido antes de parsear
      try {
        const parsed = JSON.parse(item);
        return parsed as T;
      } catch (parseError) {
        console.warn(
          `[useSafeLocalStorage] JSON inválido para clave "${key}". Usando valor inicial.`,
          { error: parseError, storedValue: item }
        );
        return initialValue;
      }
    } catch (error) {
      console.error(`[useSafeLocalStorage] Error al leer "${key}" de localStorage:`, error);
      return initialValue;
    }
  });

  // Función para actualizar el valor
  const setValue = useCallback(
    (value: T) => {
      try {
        // Convertir a JSON
        const valueToStore = JSON.stringify(value);

        // Validar que localStorage está disponible y guardar
        if (typeof window === 'undefined') {
          console.warn('[useSafeLocalStorage] localStorage no disponible');
        } else {
          window.localStorage.setItem(key, valueToStore);
        }
      } catch (error) {
        console.error(`[useSafeLocalStorage] Error al escribir "${key}" en localStorage:`, error);
      } finally {
        // Siempre actualizar el estado local, sin importar si localStorage funcionó
        setStoredValue(value);
      }
    },
    [key]
  );

  // Sincronizar cambios de otras pestañas/ventanas
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const parsed = JSON.parse(event.newValue);
          setStoredValue(parsed as T);
        } catch (error) {
          console.warn(
            `[useSafeLocalStorage] JSON inválido del evento storage para "${key}".`,
            error
          );
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook para limpiar localStorage de forma segura
 * @param keys - Array de claves a limpiar (opcional, si no se proporciona limpia todo)
 * 
 * @example
 * const clearStorage = useClearStorage(['user', 'preferences']);
 * clearStorage(); // Limpia solo esas claves
 */
export function useClearStorage(keys?: string[]) {
  return useCallback(() => {
    try {
      if (typeof window === 'undefined') {
        console.warn('[useClearStorage] localStorage no disponible');
        return;
      }

      if (keys) {
        // Limpiar solo las claves especificadas
        keys.forEach(key => {
          window.localStorage.removeItem(key);
        });
      } else {
        // Limpiar todo
        window.localStorage.clear();
      }
    } catch (error) {
      console.error('[useClearStorage] Error al limpiar localStorage:', error);
    }
  }, [keys]);
}

/**
 * Función para calcular tamaño de localStorage
 * Extraída para reutilización y testing
 */
const calculateLocalStorageSize = () => {
  try {
    if (typeof window === 'undefined') {
      return { used: 0, available: 0, percentage: 0 };
    }

    let totalSize = 0;

    // Calcular tamaño total usando Object.keys() para evitar hasOwnProperty
    Object.keys(window.localStorage).forEach(key => {
      const value = window.localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    });

    // Estimación de límite (usualmente 5-10MB)
    // 5MB = 5 * 1024 * 1024 bytes
    const estimatedLimit = 5 * 1024 * 1024;
    const percentage = (totalSize / estimatedLimit) * 100;

    return {
      used: totalSize,
      available: estimatedLimit - totalSize,
      percentage: Math.round(percentage),
    };
  } catch (error) {
    console.warn('[useLocalStorageSize] Error al calcular tamaño:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
};

/**
 * Hook para obtener el tamaño de localStorage
 * Útil para debugging y monitoreo
 * 
 * @returns Objeto con información del almacenamiento
 * 
 * @example
 * const { used, available, percentage } = useLocalStorageSize();
 */
export function useLocalStorageSize() {
  const [size, setSize] = useState(() => {
    // Lazy initializer para calcular tamaño inicial
    return calculateLocalStorageSize();
  });

  // Efecto para recalcular tamaño cuando localStorage cambia externamente
  useEffect(() => {
    const handleStorageChange = () => {
      const newSize = calculateLocalStorageSize();
      setSize(newSize);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return size;
}

export default useSafeLocalStorage;