# Church SaaS Blueprint (EduCore)

## Objetivo
Evolucionar el producto de LMS multi-cliente a plataforma integral para iglesias, manteniendo `Formación` como dominio estratégico y sumando operación pastoral, financiera y multi-sede.

## Dominios funcionales
- `Dashboard`: overview, KPIs, actividad, alertas pastorales, crecimiento.
- `Iglesia`: personas, grupos, reuniones, finanzas, sedes, ministerios.
- `Formación`: cursos, clases, estudiantes, certificaciones, biblioteca y recursos.
- `Administración`: usuarios, roles/permisos, configuración tenant, integraciones, logs, auditoría.

## Bounded Contexts
- `IdentityAccess`: usuarios, roles, permisos, scopes por sede.
- `ChurchPeople`: miembros, familias, estados, historial.
- `Discipleship`: seguimiento espiritual, notas, tareas, timeline.
- `Groups`: células, líderes, reportes semanales, geolocalización.
- `Gatherings`: cultos/eventos, check-in QR, asistencia, voluntarios.
- `Finance`: diezmos, ofrendas, ingresos/egresos, balances, reportes.
- `Campuses`: estructura multi-sede, usuarios por sede, métricas aisladas.
- `Formation`: LMS + academias internas/discipulados.
- `NotificationsAutomation`: email, WhatsApp, push y workflows.
- `Analytics`: KPIs transversales y métricas de crecimiento.

## Modelo de datos (alto nivel)
- Tenancy: `tenants`, `tenant_settings`, `tenant_feature_flags`, `tenant_subscriptions`.
- Sedes: `campuses`, `campus_user`, `campus_permissions`.
- Personas: `members`, `member_profiles`, `member_status_history`, `families`, `family_members`.
- Discipulado: `spiritual_events`, `spiritual_timelines`, `pastoral_notes`, `follow_up_tasks`.
- Grupos: `groups`, `group_members`, `group_leaders`, `group_meetings`, `group_weekly_reports`.
- Reuniones: `gatherings`, `attendance_records`, `checkin_tokens_qr`, `children_checkins`, `volunteer_assignments`.
- Finanzas: `currencies`, `transactions`, `tithes`, `offerings`, `expenses`, `monthly_balances`.
- Formación: reutilizar entidades LMS y extender con `discipleship_paths`, `academy_programs`.
- Seguridad: `audit_logs`, `security_events`.

## APIs (v1)
- `/v1/church/people/*`
- `/v1/church/groups/*`
- `/v1/church/gatherings/*`
- `/v1/church/finance/*`
- `/v1/church/campuses/*`
- `/v1/church/ministries/*`
- `/v1/formation/*`
- `/v1/admin/rbac/*`
- `/v1/admin/audit/*`
- `/v1/integrations/*`

## Eventos de dominio (RabbitMQ)
- `member.created`
- `member.status.changed`
- `spiritual.followup.created`
- `group.report.submitted`
- `gathering.checkin.completed`
- `finance.transaction.recorded`
- `discipleship.milestone.reached`
- `alert.pastoral.risk_detected`

## Multi-tenant y escalabilidad
- Modelo actual: shared DB + `tenant_id`.
- Scope obligatorio por `tenant_id` y `campus_id` en repositorios.
- Índices compuestos recomendados: `(tenant_id, campus_id, created_at)`.
- Plan enterprise: opción de aislamiento físico por tenant grande.

## Frontend (Next.js)
- Rutas: `/(dashboard)/church/*`, `/(dashboard)/formation/*`, `/(dashboard)/admin/*`.
- Sidebar por secciones (ya implementado en esta etapa).
- Componentes base reutilizables para páginas nuevas (`ModulePlaceholderPage`).

## Backend (Laravel modular)
- `app/Modules/ChurchPeople`
- `app/Modules/Groups`
- `app/Modules/Gatherings`
- `app/Modules/Finance`
- `app/Modules/Campuses`
- `app/Modules/Ministries`
- `app/Modules/Formation`
- `app/Modules/IdentityAccess`
- `app/Modules/Analytics`

## Roadmap
1. **Fase 1 (MVP Church Core)**  
   Sidebar nuevo, módulos base Iglesia, RBAC inicial, placeholders operativos y navegación completa.
2. **Fase 2 (Operación Pastoral)**  
   Personas + seguimiento espiritual + grupos + check-in QR + reportes iniciales.
3. **Fase 3 (Finanzas & Multi-sede)**  
   Motor financiero, reportes por sede/ministerio, scopes avanzados.
4. **Fase 4 (Enterprise)**  
   Workflows, BI avanzado, notificaciones multicanal, features premium.
