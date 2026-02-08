# 🔐 Gestión de Usuarios (Modo Privado)

Como la aplicación es privada y el registro público está desactivado, el administrador debe crear manualmente las cuentas de usuario.

## 1. Crear un Nuevo Usuario

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. En el menú lateral, ve a **Authentication** -> **Users**
3. Haz clic en el botón verde **Invite user** o **Create user**
   - **Create user:** Creas el usuario inmediatamente con email y password. (RECOMENDADO)
     - Ingresa el Email del usuario.
     - Ingresa una Contraseña temporal (o definitiva).
     - Marca "Auto confirm user" para que el usuario pueda entrar sin verificar email.
   - **Invite user:** Envía un correo de invitación (requiere configurar servidor de correo SMTP).

## 2. Entregar Credenciales

Una vez creado el usuario, entrégale las credenciales de acceso:
- **URL de la App:** (Tu URL local o de producción)
- **Usuario:** su_email@ejemplo.com
- **Contraseña:** la_contraseña_que_asignaste

## 3. Próximos Pasos (Seguridad)

Cuando tengas usuarios creados y quieras asegurar que cada uno vea SOLO sus datos:

1. **Habilitar RLS (Row Level Security)** en las tablas.
2. **Crear Políticas de Seguridad** en Supabase:
   ```sql
   -- Ejemplo: Permitir que cada usuario vea/edite solo SUS propios registros
   create policy "Users can crud own records"
     on clients
     for all
     using (auth.uid() = user_id);
   ```

> **Nota:** Por ahora, como RLS está deshabilitado para desarrollo, todos los usuarios pueden ver todos los datos.
