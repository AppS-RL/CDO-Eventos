# Contenido de CDO Servidores

La información se administra en la hoja `ContenidoServidores`. Cada renglón es
una publicación y utiliza estas columnas:

| Columna | Uso | Ejemplo |
| --- | --- | --- |
| ID | Identificador único, sin repetir | `UNIFORME-2026-11-22` |
| TIPO | `UNIFORME`, `ACTIVIDAD`, `PREDICACION` o `AVISO` | `UNIFORME` |
| TITULO | Nombre corto visible en la aplicación | `Servicio del domingo` |
| DESCRIPCION | Instrucción o contenido completo | `Playera azul y pantalón negro` |
| FECHA | Fecha relacionada en formato `AAAA-MM-DD` | `2026-11-22` |
| ENLACE | Enlace HTTPS opcional a material o referencia | `https://...` |
| DESTINATARIO | `TODOS`, `*` o uno o varios ID separados por coma | `TODOS` |
| ACTIVO | `SI` para publicar; `NO` para ocultar | `SI` |
| PUBLICADO | Fecha de captura para control administrativo | `2026-11-19` |
| COLOR | Color del uniforme; sólo se usa para `UNIFORME` | `NEGRO` |
| PRENDA | `PLAYERA` o `POLO`; sólo se usa para `UNIFORME` | `PLAYERA` |

Los servidores sólo ven publicaciones activas dirigidas a todos o a su propio
ID. Las actividades y predicaciones se pueden marcar como completadas. Ese
seguimiento se guarda automáticamente en `ProgresoServidores`; esta segunda
hoja no se captura manualmente.

## Ejemplos

Uniforme para todos:

```text
UNIFORME-2026-11-21 | UNIFORME | Playera negra | Playera con el distintivo de Iglesia Juvenil | 2026-11-21 | | TODOS | SI | 2026-11-20 | NEGRO | PLAYERA
```

Actividad para una persona:

```text
ACT-001 | ACTIVIDAD | Confirmar asistencia | Confirma antes del viernes | 2026-11-20 | | SERVIDOR-0001 | SI | 2026-11-19
```

Predicación con material para todos:

```text
PRED-001 | PREDICACION | Escuchar predicación | Escúchala antes de la reunión | 2026-11-25 | https://... | TODOS | SI | 2026-11-19
```
