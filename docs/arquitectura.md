# Arquitectura

## Separación de responsabilidades

`app/page.tsx` carga en el servidor las expansiones y las cartas de ejemplo. `lib/catalog.ts` importa el índice completo y está marcado con `server-only`: las 14.249 entradas no forman parte del JavaScript del navegador.

`PokeBind` coordina la selección de vista, binder y modales. Los componentes de catálogo, ficha, cuenta, edición y páginas tienen sus propios archivos. Las reglas que podrían perder datos viven en `lib/workspace.ts`, separadas de React y cubiertas por pruebas.

Las hojas de estilo se importan en un orden explícito desde `app/globals.css`. `responsive.css` contiene los ajustes finales de tamaño y color y tiene prioridad sobre los valores generales. Para cambiar un valor, comprueba también sus reglas de móvil.

## Modelo de datos

```text
Workspace (version: 1)
├── binders[]
│   ├── id: UUID estable
│   ├── name, color, columns (2 o 3)
│   └── slots: Array<cardId | null>
├── owned: cardId[]
└── wishlist: cardId[]
```

Los huecos son posiciones físicas. `null` es una decisión válida del usuario, no un error. Al cambiar formato se mantiene el orden completo y se añaden huecos hasta cerrar la última página. Mover una carta a una posición ocupada intercambia las dos cartas. Eliminar una carta de un hueco o borrar un binder no modifica `owned` ni `wishlist`.

La colección indica posesión por tipo de carta. Una carta repetida en dos huecos se muestra conseguida en ambos si su identificador está en `owned`. Para inventario de ejemplares y futuros intercambios hará falta un modelo separado con cantidad y variante.

## Persistencia

El modo local utiliza únicamente `pokebind:guest:v1` en `localStorage`. No se mezcla automáticamente con una cuenta. Para llevar los datos locales a una cuenta: exportar, iniciar sesión e importar la copia. La importación pide confirmar la sustitución y permite exportar primero.

Con Supabase, cada usuario tiene una fila `workspaces`. El documento JSONB permite guardar una operación completa de manera atómica. Las lecturas tienen RLS por `auth.uid()`. La escritura solo está permitida mediante `save_workspace`, que obtiene el usuario del contexto de autenticación y comprueba la revisión esperada. La función usa `security definer`, tiene `search_path` vacío y no acepta un ID de usuario suministrado por el cliente.

El cliente serializa las escrituras. Ante un conflicto o fallo bloquea nuevas ediciones, conserva el estado en memoria y ofrece exportar y recargar. Otra pestaña que cambie el estado local también bloquea las ediciones pendientes. No hay sincronización en tiempo real ni resolución automática de conflictos.

El esquema SQL valida la estructura superior y el tamaño. Zod valida la estructura completa en el cliente y al importar. Una cuenta maliciosa solo puede dañar su propia fila, pero antes de abrir producción conviene reforzar la validación SQL del documento y la configuración de Auth.

## Catálogo y API

- `POST /api/catalog`: búsqueda paginada; puede recibir una lista de IDs para filtrar colección o deseos. No persiste esos IDs.
- `GET /api/catalog?ids=...`: resolución de hasta 360 referencias del binder.
- `GET /api/cards/:id`: ficha oficial local cuando existe; si no, TCGdex con caché de 24 horas. Las 12 fichas de ejemplo funcionan como respaldo ante errores.
- `POST /api/import`: valida la copia y rechaza IDs ausentes del índice actual.

Los importadores se ejecutan fuera de las peticiones web. El archivo de respaldo se reemplaza mediante renombrado atómico al terminar la descarga. Los datos oficiales están en un archivo separado para que una actualización de TCGdex no los sobrescriba.

## Accesibilidad y móvil

Los modales usan `dialog` nativo con foco contenido, cierre con Escape y devolución del foco. La reordenación por dos pulsaciones funciona sin arrastrar. En móvil se muestra una página cada vez y navegación inferior; en escritorio, dos páginas. El efecto holo respeta `prefers-reduced-motion` y se puede desactivar en la ficha.

Las imágenes son externas y pueden fallar. En ese caso la carta sigue siendo identificable por nombre y puede gestionarse. Las fuentes tipográficas provienen de Google Fonts y tienen alternativas locales.

## Reflejo holo

`CardArt` reutiliza la imagen de la carta como capa de color con `color-dodge`.
Una máscara radial sigue el puntero y revela el relieve de la ilustración; grano SVG
procedural y líneas finas aportan textura metálica. No lee píxeles en canvas ni requiere
CORS en el proveedor. La opacidad se controla en `.holo-shine` de `binder.css`.
El reflejo permanece suave en pantallas táctiles, sin capturar gestos de desplazamiento.
Se desactiva con el botón de la ficha o con `prefers-reduced-motion`.
Es una interpretación visual, no una máscara exacta del acabado físico de cada impresión.
