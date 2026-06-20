# LMS SaaS — Arquitectura (Monolito Modular)

## Decisión arquitectónica

**Un solo Laravel 12** actúa como backend completo. Los dominios (Auth, User, Course, etc.) son **módulos internos** (bounded contexts), no aplicaciones Laravel separadas.

| Enfoque anterior (descartado) | Enfoque actual |
|------------------------------|----------------|
| 9 proyectos Laravel + 9 MySQL | 1 Laravel + 1 MySQL |
| Despliegue y CI × 9 | Un artefacto, un pipeline |
| Comunicación HTTP entre servicios | Llamadas in-process + colas para async |

### Ventajas para producción inicial

- Transacciones ACID entre dominios cuando hace falta
- Menor latencia (sin red entre “servicios”)
- Un solo Horizon, un solo scheduler, un solo JWT
- Evolución: cualquier módulo puede extraerse a microservicio más adelante sin reescribir dominio

### Organización por módulos

```
backend/app/Modules/
├── Auth/           # login, JWT, MFA, verificación email
├── User/           # perfiles, settings, avatares
├── Course/         # cursos, módulos, inscripciones
├── Classroom/      # clases en vivo, Zoom/Meet
├── Attendance/     # asistencia, progreso
├── File/           # uploads, MinIO/S3
├── Notification/   # email, push, colas
├── Analytics/      # KPIs, agregaciones
├── Academic/       # certificados, reglas académicas
└── Shared/         # tenant, outbox, traits, ULID
```

### Multi-tenancy

Todas las tablas de negocio llevan `tenant_id` (ULID). Middleware `IdentifyTenant` resuelve tenant por subdominio o header `X-Tenant-ID`.

### Eventos (in-process + colas)

- **Síncrono**: `Event::dispatch()` dentro del mismo proceso
- **Asíncrono**: listeners en cola RabbitMQ/Redis + tabla `event_outbox` (Outbox Pattern)
- Extracción futura: el consumer del outbox puede publicar a RabbitMQ externo

### API

- Prefijo: `/api/v1`
- Un Nginx (opcional) como reverse proxy; no es “API Gateway multi-backend”, es terminación SSL + rate limit

### Base de datos

- **Una base de datos** `lms_saas` con esquema por dominio (prefijos de tabla o nombres claros)
- FKs solo dentro del mismo agregado; referencias externas por ULID sin FK cross-módulo estricto donde no aplique
