# SLA Dashboard

Sistema completo de seguimiento de solicitudes y SLA (Service Level Agreement) para buzones de correo electrónico de **Solutions & Payroll**. Automatiza la lectura, clasificación y medición de tiempos de respuesta de correos entrantes provenientes de dominios de clientes.

---

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Funcionalidades](#funcionalidades)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
5. [Flujo de Funcionamiento](#flujo-de-funcionamiento)
6. [Módulos Principales](#módulos-principales)
   - [Autenticación](#autenticación)
   - [Microsoft Graph API (Lectura de Correos)](#microsoft-graph-api-lectura-de-correos)
   - [Clasificación con IA (Groq)](#clasificación-con-ia-groq)
   - [Cálculo de SLA](#cálculo-de-sla)
   - [Filtrado por Dominios de Clientes](#filtrado-por-dominios-de-clientes)
   - [Dashboard Web](#dashboard-web)
7. [Configuración e Instalación](#configuración-e-instalación)
8. [Variables de Entorno](#variables-de-entorno)
9. [Configuración de Microsoft Azure AD](#configuración-de-microsoft-azure-ad)
10. [Base de Datos (Prisma + PostgreSQL)](#base-de-datos-prisma--postgresql)
11. [Scripts Disponibles](#scripts-disponibles)
12. [Estructura del Proyecto](#estructura-del-proyecto)
13. [API Routes](#api-routes)
14. [Pruebas Iniciales](#pruebas-iniciales)
15. [Límites y Consideraciones](#límites-y-consideraciones)
16. [Próximos Pasos](#próximos-pasos)

---

## Descripción General

El **SLA Dashboard** es una aplicación web desarrollada para **Solutions & Payroll** que monitorea automáticamente los correos electrónicos recibidos en los buzones de la empresa, clasifica cuáles son solicitudes reales de clientes utilizando inteligencia artificial, y calcula el tiempo de respuesta contra un SLA de 2 horas hábiles definido en horario laboral de Colombia.

El sistema responde a la necesidad de tener visibilidad y control sobre los tiempos de respuesta a clientes, permitiendo identificar solicitudes vencidas, próximas a vencer y midiendo el cumplimiento del equipo.

---

## Funcionalidades

- **Autenticación corporativa** mediante Microsoft Azure AD (login con cuenta de la empresa)
- **Lectura automática de correos** desde buzones configurados usando Microsoft Graph API
- **Filtrado inteligente** de correos: solo procesa correos provenientes de dominios de clientes conocidos
- **Clasificación automática con IA**: determina si un correo es una solicitud real o no (informativo, spam, etc.)
- **Extracción de metadatos por IA**: identifica el cliente, país, tipo de proceso y correo del cliente
- **Verificación de respuestas**: comprueba si la empresa ha respondido la solicitud consultando el hilo de conversación
- **Cálculo de SLA en horas hábiles**: respeta el horario laboral de Colombia (mañana y tarde), festivos y fines de semana
- **Dashboard web** con visualización de solicitudes, estados y métricas
- **Navegación lateral** entre secciones: Solicitudes, Análisis, Clientes
- **Indicadores visuales** del estado del SLA (dentro del SLA, próximo a vencer, vencido)

---

## Stack Tecnológico

### Frontend
- **Next.js 16.3.4** — Framework React con Server Components y API Routes
- **React 19.2.8** — Biblioteca de interfaz de usuario
- **TypeScript 5** — Tipado estático
- **Tailwind CSS 4** — Framework de estilos utility-first
- **shadcn/ui** — Componentes de UI basados en Radix UI y Tailwind
- **Lucide React** — Iconos

### Backend
- **Next.js API Routes** — Endpoints del servidor
- **NextAuth.js 4.24.15** — Autenticación con Azure AD
- **Prisma 5.22.0** — ORM para base de datos
- **Microsoft Graph API** — Acceso a correos de Outlook/Exchange
- **@azure/msal-node** — Cliente para autenticación daemon de Azure

### Base de Datos
- **PostgreSQL** — Base de datos relacional
- **Neon** (recomendado) — Hosting serverless de PostgreSQL

### Inteligencia Artificial
- **Groq API** — Plataforma de inferencia rápida (modelo Qwen 3.8-27B)
- Rate limits: 30 RPM, 250 RPD, 70K TPM

---

## Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────────┐
│                     NAVEGADOR WEB                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js App (React + Tailwind + shadcn/ui)         │    │
│  │  ├── Página de Login (Azure AD)                     │    │
│  │  ├── Dashboard (métricas generales)                 │    │
│  │  ├── Solicitudes (tabla con estados SLA)            │    │
│  │  ├── Análisis (gráficas estadísticas)               │    │
│  │  └── Clientes (gestión de clientes y dominios)      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER                             │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │  NextAuth.js        │  │  API Routes                  │  │
│  │  (Azure AD Provider)│  │  ├── /api/auth/[...nextauth] │  │
│  └─────────────────────┘  │  └── /api/procesar-correos   │  │
│                           └──────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Lógica de Negocio (lib/)                           │    │
│  │  ├── auth.ts           — Configuración NextAuth     │    │
│  │  ├── prisma.ts         — Cliente Prisma             │    │
│  │  ├── config.ts         — Configuración central       │    │
│  │  ├── groq-client.ts    — Clasificación con IA       │    │
│  │  ├── graph-daemon.ts   — Conexión MS Graph API      │    │
│  │  ├── sla-calculator.ts — Cálculo de SLA horario CO  │    │
│  │  ├── dominios-clientes.ts — Lista blancas dominios  │    │
│  │  └── utils.ts          — Utilidades Tailwind        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐
│  Microsoft Graph │ │   Groq API    │ │   PostgreSQL     │
│  API (Azure)     │ │   (IA)        │ │   (Neon)         │
│  - Leer correos  │ │  - Clasificar │ │  - Solicitudes   │
│  - Leer hilos    │ │  - Extraer    │ │  - Clientes      │
│  - Perfil usuario│ │    datos      │ │  - Sesiones      │
└──────────────────┘ └───────────────┘ └──────────────────┘
```

---

## Flujo de Funcionamiento

### Procesamiento de Correos (Pipeline Principal)

1. **Autenticación**: El usuario inicia sesión con su cuenta de Microsoft de la empresa
2. **Obtención de token**: El servidor obtiene un token daemon para acceder a Graph API sin interacción del usuario
3. **Lectura de buzones**: Se leen los correos del buzón configurado (`ghincapie@solutionsandpayroll.com`) en un rango de fechas definido
4. **Filtrado por dominio**: Solo se procesan correos cuyo remitente pertenece a un dominio de cliente conocido (24 dominios configurados)
5. **Clasificación con IA**: Cada correo pasa por Groq API que determina:
   - Si es una **solicitud** o **no solicitud**
   - Nombre del cliente
   - País mencionado
   - Tipo de proceso
   - Correo electrónico del cliente
   - Nivel de confianza (0.0 - 1.0)
6. **Verificación de respuesta**: Para cada solicitud, se busca en el hilo de conversación si alguien de `solutionsandpayroll.com` respondió después del correo original
7. **Cálculo de SLA**: Se calcula:
   - **Inicio del conteo**: Si el correo llega en horario hábil, desde esa hora. Si llega fuera, desde el siguiente momento hábil
   - **Vencimiento**: 2 horas hábiles después del inicio del conteo
   - **Tiempo hábil transcurrido**: Diferencia entre inicio y respuesta (o ahora si no hay respuesta)
   - **Estado SLA**: `dentro_sla`, `proximo_vencer`, `vencido`, o `no_verificable`
8. **Almacenamiento**: Todo se guarda en PostgreSQL a través de Prisma
9. **Visualización**: Los datos se muestran en el dashboard web con indicadores visuales

### Horario Laboral Colombia (configurado en el sistema)

| Bloque | Horario |
|--------|---------|
| Mañana | 8:00 AM - 12:30 PM |
| Tarde | 1:30 PM - 5:00 PM |
| **Total jornada** | **8 horas hábiles/día** |

El sistema también tiene configurados los **festivos de Colombia para 2026 y 2027**, y excluye sábados y domingos automáticamente.

---

## Módulos Principales

### Autenticación

**Archivo**: `lib/auth.ts`

- Implementada con **NextAuth.js** usando el proveedor **Azure AD**
- Estrategia de sesiones basada en base de datos (database sessions)
- Los usuarios inician sesión con sus credenciales corporativas de Microsoft
- Las rutas del dashboard están protegidas; sin sesión activa se redirige al login
- Callback personalizado que inyecta el `user.id` del usuario en la sesión

### Microsoft Graph API (Lectura de Correos)

**Archivo**: `lib/graph-daemon.ts`

- Usa **@azure/msal-node** para obtener tokens daemon (sin interacción del usuario)
- Funciones principales:
  - `getGraphToken()`: Obtiene token de acceso para Graph API con permisos de aplicación
  - `getEmailsFromMailbox()`: Lee correos de un buzón específico en un rango de fechas con paginación automática
  - `getConversationEmails()`: Busca correos relacionados por asunto (keywords) para reconstruir hilos
  - `getUserProfile()`: Obtiene el nombre display del usuario del buzón

### Clasificación con IA (Groq)

**Archivo**: `lib/groq-client.ts`

- Utiliza **Groq API** con el modelo **Qwen 3.8-27B** (anteriormente usaba Llama 3.3-70B)
- **Prompt engineering** específico que pide:
  - Clasificación binaria: `esSolicitud: true/false`
  - Extracción de entidades: cliente, país, tipo de proceso, correo
  - Escala de confianza
- **Manejo de rate limits**: Implementa reintentos con backoff exponencial (hasta 5 reintentos, esperando 5s, 10s, 20s, 40s, 80s)
- **Verificación de respuestas**: `checkIfResponded()` analiza el hilo de conversación buscando correos enviados por alguien del dominio `solutionsandpayroll.com` después del correo original
- Temperatura baja (0.1) para respuestas deterministas

### Cálculo de SLA

**Archivo**: `lib/sla-calculator.ts`

- Motor de cálculo de SLA respetando horario laboral colombiano
- Funciones exportadas:
  - `calcularInicioConteoSLA()`: Determina cuándo empieza a contar el SLA
  - `calcularVencimientoSLA()`: Agrega 2 horas hábiles al inicio
  - `calcularTiempoHabil()`: Tiempo transcurrido en formato legible ("X h Y min")
  - `clasificarSLA()`: Determina el estado actual del SLA
  - `calcularSLA()`: Función completa que retorna todos los campos
- Estados SLA:
  - `dentro_sla`: Menos de 90 minutos hábiles transcurridos
  - `proximo_vencer`: Entre 90 y 120 minutos hábiles
  - `vencido`: Más de 120 minutos hábiles (o respondido después del vencimiento)
  - `no_verificable`: No se puede determinar

### Filtrado por Dominios de Clientes

**Archivo**: `lib/dominios-clientes.ts`

- Lista blanca de **24 dominios** de clientes conocidos
- Solo se procesan correos entrantes de estos dominios
- Dominios incluyen: `nazdar.com`, `remofirst.com`, `safeguardglobal.com`, `marcipayroll.com`, entre otros
- La función `esDominioCliente()` extrae el dominio del email y verifica si está en la lista

### Dashboard Web

**Directorio**: `app/dashboard/`

- **Layout protegido**: Verifica sesión en el servidor antes de renderizar
- **Sidebar**: Navegación lateral con secciones y avatar del usuario
- **Página principal**: Resumen con tarjetas de métricas (total solicitudes, clientes, pendientes, % SLA)
- **Solicitudes**: Tabla interactiva con todos los datos, botón para procesar correos
- **Análisis**: Sección preparada para gráficas estadísticas (pendiente de implementar con datos reales)
- **Clientes**: Gestión de clientes y dominios (preparado para futura implementación CRUD)

---

## Configuración e Instalación

### Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta de Microsoft Azure con permisos de administrador
- Cuenta de Groq (gratuita en [console.groq.com](https://console.groq.com))
- Base de datos PostgreSQL (local o Neon)

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Solutionsandpayroll/SLA-Ricardo.git
   cd SLA-Ricardo/sla-dashboard
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno** (ver siguiente sección)

4. **Configurar la base de datos**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Ejecutar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**: `http://localhost:3000`

---

## Variables de Entorno

Crear un archivo `.env.local` en la raíz de `sla-dashboard/`:

```bash
# ─── Base de Datos ───
DATABASE_URL="postgresql://user:password@host:5432/sla_dashboard"
DIRECT_URL="postgresql://user:password@host:5432/sla_dashboard"

# ─── NextAuth ───
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secreto-aleatorio-de-32-caracteres"

# ─── Azure AD (App de Login - Delegated Permissions) ───
AZURE_AD_CLIENT_ID="tu-client-id"
AZURE_AD_CLIENT_SECRET="tu-client-secret"
AZURE_AD_TENANT_ID="tu-tenant-id"

# ─── Groq API ───
GROQ_API_KEY="tu-groq-api-key"
```

### Generar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Configuración de Microsoft Azure AD

Se requieren **dos aplicaciones** registradas en Azure Active Directory:

### Aplicación 1: Login de Usuarios (Delegated Permissions)

| Campo | Valor |
|-------|-------|
| Tipo | Web |
| Redirect URI | `http://localhost:3000/api/auth/callback/microsoft` |
| Permisos Delegados | `User.Read`, `openid`, `profile`, `email` |

**Credenciales usadas en**: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`

### Aplicación 2: Daemon (Application Permissions)

| Campo | Valor |
|-------|-------|
| Tipo | Daemon / Background (sin interacción) |
| Permisos de Aplicación | `Mail.Read`, `User.Read.All` |
| Admin consent | Requerido |

Esta aplicación permite al servidor leer correos de cualquier buzón sin que el usuario esté presente.

---

## Base de Datos (Prisma + PostgreSQL)

**Archivo del schema**: `prisma/schema.prisma`

### Modelos de Datos

| Modelo | Descripción |
|--------|-------------|
| `User` | Usuarios autenticados en la aplicación |
| `Account` | Cuentas OAuth vinculadas a usuarios |
| `Session` | Sesiones activas de usuario |
| `VerificationToken` | Tokens de verificación (no usado activamente) |
| `Cliente` | Clientes corporativos con su dominio y país |
| `Solicitud` | Solicitudes extraídas de correos clasificados por IA |

### Campos clave del modelo Solicitud

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `asunto` | String | Asunto del correo original |
| `cuerpo` | Text | Cuerpo del correo (máx 5000 chars) |
| `remitente` | String | Email del remitente |
| `encargado` | String? | Persona del buzón que recibió el correo |
| `fechaRecibido` | DateTime | Fecha de recepción original |
| `inicioConteoSLA` | DateTime? | Momento en que empieza a contar el SLA |
| `vencimientoSLA` | DateTime? | Fecha límite para responder |
| `fechaRespuesta` | DateTime? | Fecha en que se respondió (si aplica) |
| `tiempoHabil` | String? | Tiempo transcurrido formateado |
| `estadoSLA` | String? | dentro_sla / proximo_vencer / vencido / no_verificable |
| `estado` | String | en_gestion / respondida / cerrada |
| `clasificacionIA` | String? | SOLICITUD / NO_SOLICITUD |
| `confianzaIA` | Float? | Nivel de confianza de la IA (0.0-1.0) |
| `nombreCliente` | String? | Nombre del cliente extraído por IA |
| `tipoProceso` | String? | Tipo de solicitud identificado por IA |
| `paisCliente` | String? | País extraído por IA |
| `correoCliente` | String? | Correo del cliente extraído por IA |
| `conversationId` | String? | ID de conversación de Graph API |

---

## Scripts Disponibles

| Script | Archivo | Descripción |
|--------|---------|-------------|
| `npm run dev` | — | Inicia el servidor de desarrollo de Next.js |
| `npm run build` | — | Compila la aplicación para producción |
| `npm run start` | — | Inicia el servidor de producción |
| `npm run lint` | — | Ejecuta ESLint |
| Test SLA | `scripts/test-sla.ts` | Prueba el cálculo de SLA con una fecha fija |
| Insertar Solicitudes | `scripts/insertar-solicitudes.ts` | Inserta solicitudes de ejemplo en la BD (8 correos de prueba) |
| Limpiar Solicitudes | `scripts/scripts/limpiar-solicitudes.ts` | Elimina todas las solicitudes de la BD |
| Reset Auth | `scripts/reset-auth.ts` | Limpia todas las sesiones, usuarios y cuentas de autenticación |

---

## Estructura del Proyecto

```
sla-dashboard/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          ── Endpoints de autenticación
│   │   └── procesar-correos/
│   │       └── route.ts              ── Endpoint principal de procesamiento
│   ├── dashboard/
│   │   ├── solicitudes/
│   │   │   └── page.tsx              ── Página de listado de solicitudes
│   │   ├── analisis/
│   │   │   └── page.tsx              ── Página de análisis/estadísticas
│   │   ├── clientes/
│   │   │   └── page.tsx              ── Página de gestión de clientes
│   │   ├── layout.tsx                ── Layout protegido del dashboard
│   │   └── page.tsx                  ── Página principal del dashboard
│   ├── globals.css                   ── Estilos globales (Tailwind)
│   ├── layout.tsx                    ── Layout raíz (fuente Inter, lang=es)
│   └── page.tsx                      ── Página de inicio/login
│
├── components/
│   ├── sidebar.tsx                   ── Barra lateral de navegación
│   └── ui/                           ── Componentes de shadcn/ui
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       └── table.tsx
│
├── lib/
│   ├── auth.ts                       ── Configuración de NextAuth
│   ├── config.ts                     ── Configuración central (Azure + Groq)
│   ├── dominios-clientes.ts          ── Lista blanca de dominios
│   ├── groq-client.ts                ── Cliente Groq API + verificación respuestas
│   ├── graph-daemon.ts               ── Cliente Microsoft Graph API
│   ├── prisma.ts                     ── Instancia singleton de Prisma
│   ├── sla-calculator.ts             ── Motor de cálculo de SLA Colombia
│   └── utils.ts                      ── Utilidad cn() para Tailwind
│
├── prisma/
│   └── schema.prisma                 ── Definición del esquema de BD
│
├── scripts/
│   ├── test-sla.ts                   ── Script de prueba de SLA
│   ├── insertar-solicitudes.ts       ── Inserción de datos de prueba
│   ├── limpiar-solicitudes.ts        ── Limpieza de solicitudes
│   └── reset-auth.ts                 ── Reset de autenticación
│
├── public/                           ── Archivos estáticos (SVGs)
├── components.json                   ── Configuración de shadcn/ui
├── tsconfig.json                     ── Configuración de TypeScript
├── package.json                      ── Dependencias y scripts
├── next-env.d.ts                     ── Tipos de Next.js
└── CLAUDE.md                         ── Instrucciones para asistentes AI
```

---

## API Routes

### `POST /api/procesar-correos`

Ejecuta el pipeline completo de procesamiento de correos.

**Autrequiere**: Sesión autenticada

**Proceso**:
1. Obtiene token de Graph API
2. Lee correos del buzón `ghincapie@solutionsandpayroll.com`
3. Filtra por dominios de clientes
4. Clasifica con Groq
5. Verifica respuestas
6. Calcula SLA
7. Guarda en BD

**Respuesta**:
```json
{
  "success": true,
  "resumen": {
    "total": 10,
    "solicitudes": 6,
    "noSolicitudes": 3,
    "respondidos": 2,
    "pendientes": 4,
    "errores": 1
  },
  "detalles": [...]
}
```

### `GET /api/procesar-correos`

Retorna las últimas 50 solicitudes almacenadas en la base de datos.

**Autenticación**: Sesión autenticada

### `GET/POST /api/auth/[...nextauth]`

Endpoints estándar de NextAuth.js para manejar el flujo de autenticación con Azure AD.

---

## Pruebas Iniciales

**Directorio**: `pruebas-iniciales/`

Contiene el código Python original desarrollado para validar la viabilidad del proyecto antes de migrar a Next.js:

| Archivo | Descripción |
|---------|-------------|
| `main.py` | Script principal de procesamiento |
| `prueba1_main.py` | Primera versión de pruebas |
| `graph_client.py` | Cliente para Microsoft Graph API en Python |
| `groq_client.py` | Cliente para Groq API en Python |
| `gemini_client.py` | Cliente para Gemini API (descartado) |
| `analyzer.py` | Analizador de correos |
| `config.py` | Configuración |
| `web_app.py` | Aplicación web Flask inicial |
| `web_app_prueba1.py` | Web app prueba 1 |
| `web_app_prueba2.py` | Web app prueba 2 |
| `reporte_prueba1.py` | Generador de reportes |
| `requirements.txt` | Dependencias Python |

Estas pruebas validaron:
- Conectividad con Graph API para leer correos
- Efectividad de Groq para clasificar correos
- Cálculo correcto de SLA con horario colombiano
- La viabilidad de verificar respuestas en hilos de conversación

---

## Límites y Consideraciones

### Groq API
- **30 RPM** (Requests Per Minute)
- **250 RPD** (Requests Per Day)
- **70K TPM** (Tokens Per Minute)
- El sistema implementa rate limiting con pausas de 5 segundos entre correos y reintentos con backoff exponencial

### Microsoft Graph API
- Límites de throttling de Microsoft (varía según licencia)
- La búsqueda por asunto (`$search`) no soporta `$orderBy` (se ordena en memoria)
- El endpoint de búsqueda requiere header `ConsistencyLevel: eventual`

### Procesamiento
- Actualmente configurado para procesar **1 buzón**: `ghincapie@solutionsandpayroll.com`
- Rango de fechas hardcodeado: `2026-09-03` (debe actualizarse dinámicamente)
- No hay procesamiento automático programado (cron job) — se ejecuta manualmente desde el dashboard

### Seguridad
- Los secretos y credenciales se almacenan en variables de entorno (`.env.local`)
- Las sesiones se guardan en base de datos con tokens únicos
- Las rutas del dashboard verifican sesión en el servidor

---

## Próximos Pasos

1. **Conectar base de datos Neon** — Configurar PostgreSQL en la nube
2. **Completar configuración de Azure AD** — Registrar las dos aplicaciones necesarias
3. **Implementar gráficas reales** — Conectar la sección de Análisis con datos reales (Recharts)
4. **Implementar CRUD de Clientes** — Permitir agregar/editar clientes y dominios desde la UI
5. **Rango de fechas dinámico** — Permitir al usuario seleccionar el período a procesar
6. **Múltiples buzones** — Soportar más buzones además de `ghincapie@`
7. **Procesamiento automático** — Implementar cron job o trigger periódico
8. **Notificaciones** — Alertas cuando una solicitud está próxima a vencer o vencida
9. **Exportación de datos** — Permitir exportar reportes a Excel/CSV
10. **Refinar clasificación IA** — Ajustar prompts y modelo según resultados reales

---

## Notas

- El proyecto incluye una carpeta `pruebas-iniciales/` con el código Python de las pruebas de viabilidad
- Se eligió **Groq** sobre Gemini por su API gratuita y baja latencia
- El modelo de IA actual es **Qwen 3.8-27B** (anteriormente Llama 3.3-70B Versatile)
- El SLA de **2 horas hábiles** está configurado por defecto pero es modificable en `sla-calculator.ts`
- Los festivos de Colombia están hardcodeados para 2026-2027 y deben actualizarse periódicamente
