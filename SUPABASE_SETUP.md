# 🚀 Guía de Configuración Rápida en Supabase

Esta guía te explica cómo dejar tu base de datos PostgreSQL en **Supabase** 100% lista y conectada con la aplicación web de **Bartender Pro Cochabamba**.

---

## 📌 Datos de tu Proyecto Supabase (¡Ya Pre-Configurado!)

- **Proyecto:** `Events&invitations`
- **Project ID:** `rifhvogyfuhljfvgonqx`
- **Project URL:** `https://rifhvogyfuhljfvgonqx.supabase.co`
- **Anon Public Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZmh2b2d5ZnVobGpmdmdvbnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MTAzOTUsImV4cCI6MjEwMjQ4NjM5NX0.r3vcvap7eqnjNfc57ZTQxBubTQMWEou1RRFHkQOijuQ`
- **SQL Editor Directo:** [https://supabase.com/dashboard/project/rifhvogyfuhljfvgonqx/sql/new](https://supabase.com/dashboard/project/rifhvogyfuhljfvgonqx/sql/new)

---

## ⚡ Paso Único: Ejecutar el Script SQL en Supabase

1. Abre tu panel de Supabase en el [SQL Editor](https://supabase.com/dashboard/project/rifhvogyfuhljfvgonqx/sql/new).
2. Abre el archivo [`supabase_schema.sql`](./supabase_schema.sql) de este proyecto.
3. Copia todo su contenido y pégalo en el editor de Supabase.
4. Haz clic en **Run** (o presiona `Ctrl + Enter`).
5. ¡Listo! La aplicación web ya tiene tu **Anon Key configurada por defecto** y se conectará automáticamente en vivo con `🟢 Supabase en Vivo`.


---

## 🌟 Funcionalidades Activas con Supabase

✅ **Reservas en Vivo**: Las reservas del asistente de 5 pasos se guardan inmediatamente en la tabla `bookings`.
✅ **Creador de Invitaciones**: Crea invitaciones digitales personalizadas que generan enlaces web (`?inv=tu-slug`) para compartir en WhatsApp.
✅ **Confirmación RSVP con QR**: Los invitados confirman asistencia en tiempo real y el sistema genera su pase con código QR único.
✅ **Panel de Control en Tiempo Real**: El panel administrativo se actualiza automáticamente ante nuevas reservas o confirmaciones RSVP.
✅ **Validador de Pases QR en Puerta**: El bartender o anfitrión puede validar los pases escaneando o ingresando el código del invitado.
