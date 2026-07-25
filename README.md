# BartenderWeb Pro Cochabamba 🍸

Sistema Web de Reservas de Servicio de Bartender & Plataforma de Invitaciones Digitales Interactivas para la Llajta (Cochabamba, Bolivia).

## 🚀 Descripción del Proyecto

Maqueta Web Frontend 100% funcional e interactiva diseñada para la presentación comercial y demostración a clientes. Combina la automatización de reservas para servicios de barras móviles y coctelería de autor con una **nueva línea de negocio de invitaciones digitales** con confirmación de asistencia RSVP y pases con código QR.

---

## 🌟 Funcionalidades Principales

1. **Vistas Duales (Conmutador en tiempo real)**:
   - **`Vista Cliente`**: Catálogo de paquetes, menú interactivo de coctelería con Singani, invitaciones en formato smartphone y asistente de reserva en 5 pasos.
   - **`Panel Admin`**: Panel de control para el dueño del negocio con métricas en Bolivianos (Bs.), tabla de solicitudes, verificador de pagos por **QR Simple Bolivia** y sincronizador con **Google Calendar**.

2. **Menú de Coctelería Cochabambina**:
   - *Chuflay de Gala con Singani de Altura Gran Reserva*
   - *Tumbo Sour Royale (Fruta fresca del Valle)*
   - *Yungueño Pasión del Valle*
   - *Garapiña Craft & Sparkle*
   - *Gin Tonic Llajta Botanical & Mojito del Valle*
   - *Mocktails 100% sin alcohol*

3. **Módulo de Invitaciones Digitales (Nueva Línea de Negocio)**:
   - Formato en PDF para WhatsApp y Páginas Web Interactivas con confirmación RSVP.
   - Generación automática de pases individuales con código QR.

4. **Pasarela de Pago QR Simple Bolivia**:
   - Generación de código QR para transferencias bancarias (BNB / Banco Unión / BCP).
   - Módulo de carga de comprobantes por Drag & Drop con cambio automático de estado (*Pendiente ➔ En Revisión ➔ Confirmado*).

---

## 📁 Estructura del Proyecto

```
BartenderJH/
├── index.html            # Estructura principal de la aplicación
├── package.json          # Configuración para despliegue en Vercel
├── vercel.json           # Rutas y URLs limpias para Vercel
├── css/
│   ├── styles.css        # Sistema de diseño Luxury Dark & Gold
│   ├── invitations.css   # Estilos para el visor modal de celular
│   └── admin.css         # Panel de control de administración
└── js/
    ├── data.js           # Base de datos simulada de Cochabamba
    ├── app.js            # Filtros y controlador principal
    ├── booking.js        # Asistente de reservas en 5 pasos
    ├── invitations.js    # Previsualizador de invitaciones web RSVP
    └── admin.js          # Lógica interactiva del panel de dueño
```

---

## 💻 Despliegue en Vercel

Para desplegar esta aplicación en Vercel:
1. Conecta este repositorio en [vercel.com](https://vercel.com).
2. Haz clic en **Deploy**.
3. El archivo `vercel.json` configurará automáticamente la maquetación.

---

## 📱 Contacto

Desarrollado para **Bartender Pro Cochabamba** (Bolivia).
