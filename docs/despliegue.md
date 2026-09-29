# Desplegar en Vercel con Supabase

Vercel aloja Next.js. Su [Marketplace de almacenamiento](https://vercel.com/docs/storage) permite conectar proveedores externos; [Supabase](https://vercel.com/marketplace/supabase/supabase) aporta PostgreSQL y autenticación. No se ha creado ni contratado ningún servicio durante este desarrollo.

## Configurar Supabase

1. Crea un proyecto y guarda la contraseña de base de datos fuera del repositorio.
2. Ejecuta `supabase/migrations/001_workspaces.sql` una sola vez desde el editor SQL.
3. Activa el proveedor Email, la confirmación por correo y configura el envío de correo apropiado para tu entorno.
4. Configura Site URL y los destinos autorizados de redirección: la URL raíz y `/reset-password` tanto en local como en producción.
5. Copia `.env.example` a `.env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

La clave publicable puede estar en el cliente; la protección efectiva depende de las políticas SQL. No añadas claves `service_role` ni secretos administrativos a variables `NEXT_PUBLIC_*`.

Reinicia `npm run dev` después de cambiar las variables. Sin ellas, el modo local sigue funcionando y la cuenta explica que el servicio aún no está activo.

## Configurar Vercel

1. Importa el repositorio `SergiCD/poke-bind`.
2. Usa el preset Next.js, Node.js 22 y el comando de build `npm run build`.
3. Añade las mismas dos variables públicas para el entorno correspondiente.
4. Despliega y añade la URL final a las redirecciones permitidas en Supabase.
5. Comprueba registro, confirmación de email, cierre/inicio de sesión y recuperación de contraseña.
6. Con dos usuarios distintos, verifica que ninguno ve los binders del otro. Con una misma cuenta en dos dispositivos, comprueba que una edición con revisión antigua produce conflicto en vez de sobrescribir.

No hay webhooks, tareas programadas ni migraciones automáticas durante el build. Cada actualización de catálogo exige ejecutar el importador, revisar los datos, hacer commit y desplegar.

## Antes de abrir el registro al público

Revisa límites y configuración de Auth, entrega de correo, copias de seguridad, monitorización y el comportamiento real de RLS en tu proyecto. Los tests locales de PostgreSQL no comprueban el servicio de correo ni las redirecciones del proveedor.
