# 🚦 Uptime Checker

Un sistema integral basado en microservicios diseñado para monitorizar el estado de tus sitios web de forma continua. Añade tus URLs y recibe notificaciones automáticas por correo electrónico en cuanto detectemos que uno de tus servicios ha dejado de responder.

---

## 🎯 Objetivo del Proyecto

El objetivo de este proyecto es proveer una herramienta confiable, asíncrona y escalable para **verificar el *Uptime* (tiempo de actividad) de servicios web**.
Se demuestra el uso de arquitecturas basadas en microservicios, ejecución de tareas programadas (Cron jobs), manejo de concurrencia y despliegue usando contenedores Docker.

## 🏗 Arquitectura

El sistema está compuesto por 4 contenedores Docker principales:

1. **Frontend (React + Vite):** Interfaz moderna y atractiva usando la técnica de "Glassmorphism", animaciones con Framer Motion y CSS puro. Permite al usuario visualizar el estado de sus sitios y añadir nuevas URLs a monitorizar. (Puerto `5173`)
2. **Backend API (Node.js + Express):** Expone un API REST que actúa como intermediario entre el Frontend y la Base de Datos. Gestiona las operaciones CRUD para los sitios web. (Puerto `3000`)
3. **Worker / Monitor (Node.js):** Un microservicio en segundo plano desvinculado de la API. Utiliza `node-cron` para ejecutarse cada 1 minuto, obteniendo todas las URLs de la base de datos y haciendo "pings" concurrentes usando `axios`. Si detecta un cambio de estado de `UP` a `DOWN`, envía una notificación por correo electrónico.
4. **Base de Datos (PostgreSQL):** Persiste la información de los sitios web, sus URLs, y su estado histórico.

---

## 🚀 Cómo ponerlo en marcha

Para iniciar este proyecto en tu entorno local, asegúrate de tener **Docker** y **Docker Compose** instalados en tu sistema.

### 1. Variables de Entorno

En la raíz del proyecto encontrarás un archivo `.env` (si no existe, créalo o renombra un archivo `.env.example`). Rellena las siguientes variables con los datos de tu cuenta de correo (se requiere una cuenta de Gmail):

```env
# Ejemplo de .env
SMTP_USER=tu-email@gmail.com
# Usa una Contraseña de Aplicación de Google (App Password), NO tu contraseña personal.
SMTP_PASS=tu-contrasena-de-aplicacion-generada-por-google
NOTIFY_EMAIL=email-donde-quieres-recibir-alertas@gmail.com
```

> **Nota sobre Gmail:** Para obtener un `SMTP_PASS`, debes activar la Autenticación de Dos Pasos (2FA) en tu cuenta de Google, y luego ir a Seguridad > Contraseñas de Aplicaciones y generar una.

### 2. Levantar los Contenedores

Abre una terminal en la raíz del proyecto y ejecuta:

```bash
docker-compose up --build
```

Esto descargará las imágenes base (Node.js 20, Postgres 15), construirá las imágenes del Backend, Worker y Frontend, y levantará toda la arquitectura.

### 3. Acceder a la Aplicación

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000/api/websites](http://localhost:3000/api/websites)

---

## ⚙️ Cómo Funciona (Detalles Técnicos)

### El flujo del Worker (Cron Job y Gatillos Manuales)
El corazón de la monitorización es el servicio `worker`. Su comportamiento es el siguiente:
1. Al arrancar, programa una tarea con `node-cron` que se ejecuta bajo la expresión `* * * * *` (cada 1 minuto). También levanta un servidor HTTP interno secundario para permitir disparos manuales (triggers) fuera del cron job.
2. Cuando se dispara (ya sea por el cron o manualmente desde el frontend), el worker hace un `SELECT` a la base de datos para obtener todos los sitios registrados.
3. Utilizando concurrencia, mapea todas las URLs a promesas de petición HTTP usando `axios.get(url, { timeout: 5000 })`. 
4. Se espera a que todas las promesas finalicen utilizando `Promise.allSettled()`.
5. Se evalúa el código de estado HTTP (`HTTP Status Code`). Cualquier código entre `200` y `399` se marca como `UP`, cualquier otro error, excepción de red o *timeout* se marca como `DOWN`.
6. Si un sitio previamente tenía el estado `UP` y pasa a `DOWN`, se dispara un bloque `sendAlertEmail` usando `nodemailer` que contacta con el servidor SMTP y envía la alerta al administrador.
7. Finalmente, se actualiza el estado de cada URL en la base de datos junto a la columna `last_checked`, y se inserta un registro histórico en la tabla `checks_history`. Un mecanismo automático borra los registros antiguos, manteniendo solo los últimos 50 por cada sitio web para optimizar la base de datos.

### Frontend y Visualización de Historial
El dashboard hace llamadas periódicas (cada 30 segundos) al Endpoint `GET /api/websites` del backend para mantener la UI sincronizada sin que el usuario tenga que refrescar la página manualmente. 

Las tarjetas son interactivas: al hacer clic en cualquiera de ellas, el frontend se comunica con un endpoint especial para recuperar el historial del sitio y renderiza una **Línea de Tiempo (Timeline)** mostrando el resultado de los últimos 50 pings realizados, con colores e iconos intuitivos. Las animaciones están optimizadas utilizando CSS y `framer-motion` de React.

---
*Proyecto de Uptime Checker creado para demostrar habilidades Full Stack y DevOps.*
