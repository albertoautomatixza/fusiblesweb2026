# Fusibles Protección Landing 2025

Landing page moderna para Fusibles Protección S.A. de C.V. con integración dinámica hacia Google Sheets.

## Estructura

```
.
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── phpmailer/
│   └── enviar.php
```

> Nota: El logotipo, favicon y los placeholders de productos se generan mediante SVG inline para evitar dependencias de archivos binarios.

### Verificar que no existan binarios

Si necesitas comprobar que el repositorio sigue libre de imágenes u otros activos binarios, ejecuta el script de utilidad:

```bash
python3 tools/check_binaries.py
```

El comando recorre el proyecto (ignorando `.git/` y `__pycache__/`) y reporta cualquier archivo que contenga un alto porcentaje de bytes no textuales.

## Configuración

1. **Google Sheets**
   - Publica tu hoja o expórtala mediante un Google Apps Script, la API de Sheets o el endpoint `gviz` (`https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:json`).
   - Asegura las columnas `ID`, `Nombre`, `Descripción`, `Categoría`, `Imagen_URL`, `FichaTecnica` (opcional), `Enlace` (opcional) y `Activo`.
   - Sustituye la constante `SHEETS_ENDPOINT` en `js/app.js` con la URL de tu Apps Script, JSON público o endpoint `gviz`.
   - El script detecta automáticamente si la respuesta es JSON tradicional o GViz y genera las tarjetas activas (valor `Activo` = `TRUE/1/Sí`).

2. **Catálogo descargable**
   - Actualiza `CATALOGO_URL` en `js/app.js` apuntando al recurso (PDF, CSV, etc.) que quieras compartir.

3. **Formulario de contacto (EmailJS)**
   - Crea un servicio y plantilla en [EmailJS](https://www.emailjs.com/).
   - Coloca `publicKey`, `serviceId` y `templateId` en `EMAILJS_CONFIG` dentro de `js/app.js`.

4. **Alternativa PHPMailer (opcional)**
   - Si prefieres enviar el formulario con PHP, coloca la librería [PHPMailer](https://github.com/PHPMailer/PHPMailer) dentro de la carpeta `phpmailer/`.
   - Edita las credenciales SMTP en `phpmailer/enviar.php` y apunta el atributo `action` del formulario a ese script.

## Dependencias front-end

La plantilla utiliza CDNs para:

- [Tailwind CSS 2.2](https://tailwindcss.com/)
- [AOS](https://michalsnik.github.io/aos/)
- [ScrollReveal](https://scrollrevealjs.org/)
- [EmailJS](https://www.emailjs.com/)

No se requiere compilación adicional. Abre `index.html` en tu navegador para visualizar la landing page.

## Contenido principal

- **Inicio/Hero:** mensaje "Venta de materiales, equipo de automatización, control y cable multiconductor" con CTA dual para catálogo y contacto, más resaltado de marcas clave.
- **Quiénes somos:** resumen corporativo, sectores atendidos (Residencial, Comercial, Industrial) y valores (Compromiso, Calidad, Innovación, Servicio personalizado).
- **Productos:** parrilla dinámica conectada a Google Sheets con enlaces a fichas técnicas y bloque informativo sobre la administración de catálogos.
- **Marcas:** listado destacado de aliados como HELUKABEL, Fluke, Chint, Weidmüller, Schneider Electric, Siemens, Omron y Sirena.
- **Contacto:** direcciones de sucursal norte y sur en Aguascalientes, teléfonos, correo, horario, mapa embebido y formulario conectado a EmailJS/PHPMailer.
- **Footer:** aviso legal "© Fusibles Protección S.A. de C.V. | Todos los derechos reservados" más enlaces a redes sociales.
