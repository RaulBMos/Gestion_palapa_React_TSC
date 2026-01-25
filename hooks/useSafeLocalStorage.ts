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
  // Estado para el valor actual
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
        // Validar que localStorage está disponible
        if (typeof window === 'undefined') {
          console.warn('[useSafeLocalStorage] localStorage no disponible');
          setStoredValue(value);
          return;
        }

        // Convertir a JSON
        const valueToStore = JSON.stringify(value);

        // Guardar en localStorage
        window.localStorage.setItem(key, valueToStore);

        // Actualizar estado
        setStoredValue(value);
      } catch (error) {
        console.error(`[useSafeLocalStorage] Error al escribir "${key}" en localStorage:`, error);

        // Si falla (ej: cuota superada), al menos actualizar el estado local
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
 * Hook para obtener el tamaño de localStorage
 * Útil para debugging y monitoreo
 * 
 * @returns Objeto con información del almacenamiento
 * 
 * @example
 * const { used, available, percentage } = useLocalStorageSize();
 */
export function useLocalStorageSize() {
  const [size, setSize] = useState({ used: 0, available: 0, percentage: 0 });

  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      let totalSize = 0;

      // Calcular tamaño total
      for (const key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          const value = window.localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }

      // Estimación de límite (usualmente 5-10MB)
      // 5MB = 5 * 1024 * 1024 bytes
      const estimatedLimit = 5 * 1024 * 1024;
      const percentage = (totalSize / estimatedLimit) * 100;

      setSize({
        used: totalSize,
        available: estimatedLimit - totalSize,
        percentage: Math.round(percentage),
      });
    } catch (error) {
      console.warn('[useLocalStorageSize] Error al calcular tamaño:', error);
    }
  }, []);

  return size;
}

export default useSafeLocalStorage;
