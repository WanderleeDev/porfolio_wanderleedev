# Contacto — formulario simple con Resend

## Objetivo

Sumar a la slide de contacto una caja de texto única que envíe el mensaje por correo
usando la integración de Resend que ya existió en `dev`, sin recuperar el formulario
estructurado de cuatro campos.

## Problema

La slide de contacto hoy solo ofrece tres enlaces (`mailto:`, GitHub, LinkedIn): no
captura nada desde el sitio. La integración de Resend se borró en `968d8f2`
("chore: reduce the site to the hero") y con ella las dependencias `resend`,
`react-hook-form` y `@hookform/resolvers`.

## Por qué

El `mailto:` depende del cliente de correo del visitante y pierde el mensaje si no
tiene uno configurado. La caja de texto envía desde el servidor: no requiere software
del visitante y queda registrada en el buzón de contacto.

## Alcance

- `src/pages/api/contact.ts` (nuevo): endpoint `POST` con `prerender = false`, mismo
  patrón que `src/pages/api/chat.ts`.
- `src/components/contact/ContactForm.tsx` (nuevo): textarea única, estado de envío.
- `src/pages/index.astro`, `src/pages/en/index.astro`: montaje en la slide de contacto.
- `src/i18n/locales/es.ts`, `src/i18n/locales/en.ts`: sección `contactForm`.
- `package.json`: dependencia `resend`.

Fuera de alcance: RHF, chips de tipo de proyecto, Astro Actions, captcha, rate limit.

## Lógica de Resend recuperada

Origen: `src/actions/index.ts` en `dev` (commit `1eb449f`).

```ts
const resend = new Resend(apiKey);
await resend.emails.send({ from, to, subject, template: { id, variables } });
```

Variables de entorno ya presentes en `.env` y `.env.example`: `RESEND_API_KEY`,
`CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `RESEND_TEMPLATE_ID`,
`RESEND_TEMPLATE_ID_EN`.

## Decisiones

- Se descartan los templates de Resend: la caja única no produce `NAME`/`KIND`/`WHAT`
  y ataría el envío a dos plantillas que hoy no se pueden verificar. Se manda `text`
  plano, que además evita inyección de HTML.
- Se descarta Astro Actions: `output: "static"` exige render on-demand para la ruta y
  el repo ya tiene un endpoint de ejemplo probado (`api/chat.ts`).
- Se descarta `react-hook-form`: un campo no necesita resolver ni registro.
- `zod` ya está en el proyecto (`^4.6.7`) por el tool calling, así que la validación
  del servidor no agrega dependencias.
- Sin campo de correo, el visitante no deja canal de respuesta. Mitigación: si el
  mensaje contiene una dirección, se usa como `replyTo`; el placeholder invita a
  dejarla. Si no hay dirección, el correo llega sin `replyTo`.
- El asunto incluye un recorte de la primera línea para poder triagear la bandeja.
- Sin comentarios en archivos nuevos.

## Tareas

- [x] T1 Endpoint `POST /api/contact` con validación Zod y envío por Resend.
- [x] T2 Componente `ContactForm` con una sola textarea y estados de envío.
- [x] T3 Montaje en las dos slides de contacto.
- [x] T4 Copia i18n `contactForm` en es/en.
- [x] T5 Verificación: build, tests y envío real.

## Verificación

- `bun run build` OK; `bun run test` 9 pass / 0 fail.
- Envío real vía `POST /api/contact` desde el dev server: `200 {"ok":true}` con un
  mensaje que incluye una dirección, así que el correo salió con `replyTo`.
- Mensaje corto: `400 {"error":"invalid_message"}`; JSON inválido:
  `400 {"error":"invalid_json"}`; el guard del cliente muestra `t.invalid` sin tocar
  la red.
- UI (Chromium, dev): la textarea renderiza en las dos locales, el envío limpia el
  campo y muestra `t.success`; el estado de error conserva el alto de la card.
- Un `resend` agregado con Vite corriendo deja los deps optimizados obsoletos (504
  `Outdated Optimize Dep` y `_jsxDEV is not a function`). Se resuelve reiniciando el
  dev server, no con cambios de código.
- No verificado: `503 not_configured` (requiere levantar el server sin las variables).

## Ajuste de densidad (segunda pasada)

Ruta: inline — es una pasada de clases ya medida, sin investigación ni diseño abierto.

- La slide desbordaba el alto del deck: +12 / +19 / +31 / +52 / +66 px en
  1280×800 / 1024×768 / 1366×768 / 1280×720 / 390×700.
- Los tres enlaces pasan a íconos en un row (`size-11`, `gap-2`) con `aria-label`
  y `title` conservando el destino; la etiqueta visible se descarta porque el
  enlace ya navega.
- Bloque compactado: ancho `max-w-2xl`, título `clamp(2.5rem,5vw,4rem)`, subtítulo
  `clamp(0.95rem,1.6vw,1.1rem)`, gaps `gap-6 md:gap-8`. La slide EN se unifica con
  la ES usando `Title` en vez del `h2` suelto.
- Form: `p-5 md:p-6`, `gap-3`, textarea `rows={3}`, botón `py-3.5`, feedback
  `min-h-5`.
- Resultado: `overflow: 0` en 1440×900, 1366×768, 1280×720, 1024×768, 390×844 y
  390×700. Alto del bloque: 533 px en desktop (antes 830) y 480 en mobile.

Pendiente detectado, fuera de alcance: en 390 px las flechas `fixed` del deck
(`top-1/2 left-5/right-5`, `z-10`) se superponen al borde de la card y tapan
~16 px de las esquinas del textarea. Es previo a este cambio y afecta a cualquier
slide con contenido a media altura; requiere una decisión de navegación móvil.

## Criterios de aceptación

- Escribir un mensaje y enviarlo devuelve confirmación en la UI.
- El correo llega a `CONTACT_TO_EMAIL` con el texto del mensaje.
- Si el mensaje incluye una dirección, el correo llega con `replyTo`.
- Con `RESEND_API_KEY` ausente, el endpoint responde `503` y la UI muestra el error
  en vez de fingir éxito.
- `bun run build` y `bun run test` pasan.
