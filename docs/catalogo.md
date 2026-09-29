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
