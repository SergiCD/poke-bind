# PokeBind

Una app para organizar cartas Pokémon en español en binders personales. Next.js, React y TypeScript; preparada para Vercel y Supabase.

## Arrancar en local

Requiere Node.js 22 o superior.

```sh
npm ci
npm run dev
```

Abre `http://localhost:3000`. Sin variables de entorno funciona en **modo local**: se guarda en el navegador y no necesita cuentas ni servicios contratados. Incluye un binder de ejemplo con 12 cartas pendientes; ninguna se marca como propia automáticamente.

## Qué funciona

- Crear, renombrar, colorear y eliminar binders.
- Páginas de 2×2 y 3×3, huecos vacíos y páginas adicionales.
- Reordenar mediante arrastre o seleccionando origen y destino, también con teclado y en móvil.
- Colección y deseos independientes de los huecos del binder.
- Catálogo con búsqueda, expansiones, promos y paginación.
- Fichas de carta y brillo holo cuando el proveedor confirma esa variante.
- Exportación e importación de copias JSON validadas.
- Registro, inicio de sesión, recuperación de contraseña y guardado por usuario implementados para Supabase. **Necesitan configurar un proyecto externo; aún no se han probado contra un proyecto real.**

## Estado del catálogo

La fuente prioritaria es [Pokémon oficial](https://tcg.pokemon.com/es-es/all-expansions/). La importación completa **está pendiente**: las peticiones HTTP realizadas durante el desarrollo recibieron una página de bloqueo de Pokémon.

El catálogo combina 145 colecciones y 14.249 cartas de TCGdex con **1.335 imágenes oficiales**: Bulbasaur 166/165 y 1.334 imágenes verificadas en ocho galerías de Pokémon. Hay 13.290 cartas con URL de imagen. **41 colecciones siguen pendientes de importar sus cartas españolas**; no se presenta cobertura histórica o promocional completa. Consulta el [informe por colección](docs/auditoria-catalogo.md).

Consulta [fuentes y actualización](docs/catalogo.md) antes de cambiar los importadores. No se han inventado rutas de imágenes oficiales para rellenar huecos.

## Comprobaciones

```sh
npm run test
npm run typecheck
npm run build
npm run format
```

Las pruebas incluyen conservación de huecos al cambiar formato, movimientos, validación de copias, detección del bloqueo oficial y aislamiento entre usuarios en PostgreSQL embebido. Las pruebas de base de datos reproducen el contexto mínimo de autenticación de Supabase; no sustituyen una comprobación de Auth real tras configurar el servicio.

## Dónde editar

| Cambio                               | Archivo o carpeta                                       |
| ------------------------------------ | ------------------------------------------------------- |
| Colores, fuentes y controles comunes | `src/styles/foundation.css`, `src/styles/workspace.css` |
| Cubierta, fundas y brillo de cartas  | `src/styles/binder.css`                                 |
| Modales y catálogo                   | `src/styles/dialogs-and-catalog.css`                    |
| Adaptación a móvil                   | `src/styles/responsive.css`                             |
| Páginas y movimientos del binder     | `src/components/binder-view.tsx`                        |
| Formulario de personalización        | `src/components/binder-editor.tsx`                      |
| Reglas y validación de la colección  | `src/lib/workspace.ts`                                  |
| Guardado local y de cuenta           | `src/hooks/use-workspace.ts`                            |
| Datos y prioridad de las fuentes     | `src/lib/catalog.ts`, `scripts/`                        |

Más detalles: [arquitectura](docs/arquitectura.md), [despliegue](docs/despliegue.md) y [trabajo pendiente](docs/pendientes.md).

## Alcance de esta versión

La propiedad se guarda por identificador de carta, sin cantidades ni distinción de ejemplares normal/reverse/holo. Los límites actuales son 30 binders y 360 huecos por binder. La sincronización del catálogo se ejecuta manualmente; no hay una tarea programada. Amigos e intercambios pertenecen a la siguiente fase.

PokeBind es independiente de The Pokémon Company. Los derechos de las imágenes y marcas pertenecen a sus titulares. Los archivos del catálogo contienen metadatos y referencias a imágenes remotas.
