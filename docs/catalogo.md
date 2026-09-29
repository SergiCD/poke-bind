# Fuentes y actualización del catálogo

## Prioridad

1. Fichas e imágenes verificadas de [Pokémon España](https://www.pokemon.com/es/jcc-pokemon/cartas-pokemon/).
2. [TCGdex](https://tcgdex.dev/) como respaldo explícito.

El listado oficial de expansiones incluye lanzamientos anunciados. Su selector visible llega hasta Diamante y Perla; el buscador de cartas ofrece además EX y varias colecciones promocionales. Ninguna de esas observaciones demuestra que todo el histórico español esté disponible.

Estado del 28–29 de septiembre de 2026: se verificaron en navegador la ficha y la imagen de Bulbasaur 166/165 (151). Las peticiones automáticas devuelven un documento de protección Incapsula. El importador lo detecta incluso si la respuesta HTTP es 200 y termina sin modificar datos. No hay un scraper completo operativo ni un mecanismo para eludir esa protección.

## Importar una ficha oficial

Usa el enlace observado en la web, no una ruta de imagen construida por suposición:

```sh
npm run catalog:official -- sv03.5-166 https://www.pokemon.com/es/jcc-pokemon/cartas-pokemon/series/sv3pt5/166
```

Opcionalmente acepta un HTML guardado de esa misma ficha como tercer argumento. Valida dominio, idioma de imagen, nombre, expansión y número. `sv03.5` y `sv3pt5` tienen un alias explícito; añade otros solo tras revisarlos. Un nombre igual no identifica una misma impresión.

El importador extrae nombre, URL de imagen e ilustrador. El resto de la ficha puede mantenerse con respaldo TCGdex. La muestra de Bulbasaur incorpora además los datos cotejados manualmente. **Importar una imagen no verifica todos los campos de una carta.**

## Actualizar el respaldo

```sh
npm run catalog:sync
```

Descarga en español el listado y los detalles de las expansiones con concurrencia limitada. Excluye la serie digital `tcgp` y expansiones con fecha futura. Obtiene fichas completas solo para el ejemplo inicial; las demás se consultan bajo demanda. Un error de red aborta antes de sustituir `src/data/catalog.json`.

El JSON es generado y está excluido de Prettier. Para correcciones oficiales edita el archivo de datos oficiales, no el generado. Revisa el resumen de cobertura y el diff antes de confirmar una actualización. Los números declarados por una fuente pueden incluir impresiones no disponibles en español.

## Pendiente para una importación oficial completa

- Obtener acceso estable a los listados públicos o una exportación autorizada.
- Recorrer la paginación observada y conservar la URL de cada ficha.
- Mapear IDs de expansiones y numeraciones especiales, incluidas promos.
- Distinguir campo oficial, campo de respaldo y ausente.
- Comparar cada expansión con su lista oficial antes de marcarla completa.
- Registrar diferencias entre actualizaciones y revisar bajas para no romper binders existentes.

La app no se presenta como un inventario completo ni actualizado automáticamente.

## Colección Clásica del 30.º Aniversario

El 29/09/2026 se incorporaron las 30 imágenes españolas observadas en la
[galería oficial](https://tcg.pokemon.com/es-es/galleries/30th-celebration/#classic-collection).
Se relacionan con `30th-c-001`–`030` por el identificador de la galería (`data-track-card-name`)
y el archivo `2M6P_Classic_ES_1.png`–`30.png`, no por el número de la impresión antigua
que aparece dentro de algunas cartas (Charizard conserva 4/102).
Las 30 URLs se comprobaron con respuesta HTTP 200 y contenido de imagen.
Se conservan en `official-cards.json`, de modo que sincronizar TCGdex no las borra.
Esta verificación corresponde a las imágenes; los demás metadatos siguen procediendo de TCGdex.
Los contadores de imágenes se calculan después de aplicar las correcciones oficiales.

## Galerías oficiales y categorías

El índice de partida es [Todas las expansiones](https://tcg.pokemon.com/es-es/all-expansions/),
complementado por [Todas las galerías](https://tcg.pokemon.com/es-es/all-galleries/).
Los enlaces se siguen desde el índice y la página de cada expansión. No se traduce el
nombre español para adivinar un slug: Caos Creciente usa `chaos-rising`, por ejemplo.
El índice de galerías contiene un enlace erróneo de Fuerzas Temporales a Destinos de
Paldea; se usa el enlace `temporal-forces` observado en la página de la expansión.

Las galerías tienen dos límites que el importador anterior no cubría:

- El HTML inicial no contiene el listado completo; `gallery.js` carga categorías de un JSON.
- «Ver todo» despliega la categoría seleccionada. Hay que unir **todas** las categorías,
  incluidas `special-art` y `classic-collection`, y deduplicar por impresión.

`gallery-parser.mjs` lee `data-expansion`, `data-expansion-id` y
`data-expansion-asset-path` para resolver la ruta del JSON siguiendo el cargador oficial.
La Colección Clásica mantiene un ID distinto aunque repita el número de otra colección.
Si falta una categoría, el idioma no coincide, aparece protección o falta un mapeo,
la importación falla antes de escribir. No se eliminan cartas que una galería no muestre.

```sh
# Reconstrucción reproducible desde las observaciones revisadas del navegador:
npm run catalog:galleries
# Comprobar cada URL antes de escribir (cuatro peticiones simultáneas):
npm run catalog:galleries -- --verify-images
# Intentar actualizar las galerías mapeadas desde HTML y JSON públicos:
npm run catalog:galleries -- --refresh --verify-images
# Informe de las 145 colecciones, incluidas las vacías y parciales:
npm run catalog:audit
```

Las peticiones HTTP directas a varias galerías devuelven protección. No existe un
scraper universal desatendido: `--refresh` se detiene si no puede leerlas. El archivo
`scripts/data/gallery-observations.json` conserva la captura revisada del DOM visible
tras desplegar «Ver todo» y recorrer los filtros. Los rangos comprimen URLs observadas;
**no son una enumeración de números supuestos ni una autorización para ampliar el rango**.
Para añadir una galería, revisa sus enlaces, todas sus categorías y el mapeo a `setId`.
Las galerías de varias versiones (Fulgor Negro/Llama Blanca) necesitan su propio mapeo;
el parser rechaza esa estructura hasta que se implemente y verifique.

La auditoría del 29/09 cubre ocho galerías y nueve colecciones, con 1.334 imágenes.
La galería de 30.º Aniversario muestra 158 cartas principales y 30 clásicas; el respaldo
contiene además `30th-B`, `30th-G` y `30th-R`, que se conservan sin atribuirles verificación oficial.
Consulta [el informe completo](auditoria-catalogo.md) para las lagunas históricas y promos.
Una expansión vacía se identifica como pendiente en la interfaz; no se presenta como
una búsqueda sin coincidencias ni se rellena con imágenes de otro idioma.
