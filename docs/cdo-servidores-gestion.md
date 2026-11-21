# Gestión de CDO Servidores

La gestión utiliza hojas independientes para conservar intactos los registros
actuales del evento `SERVIDORES`.

## Hojas

- `OrganizacionServidores`: roles acumulables, área, capitán y estado activo.
- `ServiciosServidores`: fechas en las que se pasa lista.
- `PermisosServidores`: solicitudes, autorizaciones y cobertura.
- `AsistenciaServidores`: asistencia, permisos, emergencias y faltas.
- `ProgramasAreaServidores`: programas oficiales publicados por área y periodo.
- `ActividadesAreaServidores`: horarios, actividades, responsables y supervisores.
- `ContenidoServidores`: uniformes, actividades, predicaciones y avisos.
- `ProgresoServidores`: actividades marcadas como completadas.
- `NotificacionesLeidasServidores`: novedades que cada usuario ya consultó.

## Roles

Los roles disponibles son `SERVIDOR`, `CAPITAN`, `PASTOR`,
`COORDINADOR_ROLES`, `APROBADOR_PERMISOS` y `ADMINISTRADOR`. Una persona puede
tener varios roles separados por coma.
Cuando no existe configuración, se aplica `SERVIDOR`.

En `Mi rol`, pastores, coordinación de roles y administración eligen primero
el área mediante botones. Los servidores y capitanes entran directamente al
rol de su propia área, sin selector adicional.

- `SERVIDOR-0001`, Rafael Lopez: servidor, administrador e integrante de Audio.
- `SERVIDOR-0036`, Emmanuel Gomez: capitán de Audio.
- `SERVIDOR-0029`, Monica de Ramirez: pastora y coordinadora de roles.
- `SERVIDOR-1000`, Arsenio Ramirez: pastor y aprobador final de permisos.

## Permisos

Cada servidor puede utilizar hasta seis permisos por año. Un permiso queda
autorizado cuando:

1. El capitán aprueba.
2. Arsenio Ramirez realiza la autorización pastoral.
3. El reemplazo acepta la cobertura.

Los permisos normales enviados con menos de 15 días se aceptan, pero quedan
marcados como fuera de plazo. Los permisos de emergencia no aplican esta regla.
Los permisos autorizados, normales o de emergencia, consumen uno de los seis
permisos anuales. Las solicitudes canceladas o rechazadas no consumen permisos.

## Asistencia

El capitán marca quién asistió. Una ausencia con permiso autorizado se registra
como `PERMISO` o `EMERGENCIA`; una ausencia sin permiso autorizado se registra
como `FALTA_SIN_PERMISO` y se muestra separada del contador de permisos.

## Programa de Audio cargado

El programa `PROGRAMA-AUDIO-2026-09-12` cubre septiembre a diciembre de 2026.
Fue registrado como elaborado por Monica de Ramirez y contiene 36 asignaciones
mensuales tomadas del documento de Audio. Los capitanes pueden consultar el rol,
pero no editarlo. Una cobertura autorizada no altera la asignación original;
sólo registra quién la realizará en una fecha específica.

## Notificaciones dentro del portal

La campana muestra como nuevas las solicitudes de permiso que requieren
revisión, las solicitudes de cobertura, los avisos y las predicaciones. Al
abrir una notificación o elegir `Marcar todas como leídas`, se registra la
lectura por usuario sin modificar el permiso ni el contenido original.
