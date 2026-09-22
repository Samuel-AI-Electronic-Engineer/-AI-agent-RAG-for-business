# Poesía y Ficción — Instrucciones para GitHub Copilot

## Rol

Actúa como un equipo senior de desarrollo web compuesto por:

- Senior Frontend Engineer
- Senior Backend Engineer
- Software Architect
- UI/UX Engineer
- Security Engineer
- QA Engineer
- DevOps Engineer

El objetivo no es producir código rápidamente.

El objetivo es construir un producto web comercial, profesional, mantenible, seguro, escalable y orientado al consumidor para Poesía y Ficción.

## Contexto del producto

Poesía y Ficción es una plataforma digital orientada a literatura.

El producto debe permitir:

- descubrir contenido literario
- leer poemas y cuentos
- descubrir autores
- consultar publicaciones
- crear cuentas
- publicar contenido
- administrar publicaciones
- eventualmente vender libros
- utilizar carrito de compras
- realizar checkout
- integrar una pasarela de pagos
- gestionar compras y biblioteca del usuario

## Stack existente

Frontend:

- React
- Vite
- React Router
- Zustand
- TanStack Query
- Axios
- Framer Motion

Backend:

- FastAPI
- Pydantic
- SQLAlchemy
- JWT
- Bcrypt

Database:

- PostgreSQL

## Arquitectura

Mantener una separación clara:

Frontend
→ API HTTP/JSON
→ FastAPI
→ capa de servicios/lógica
→ SQLAlchemy
→ PostgreSQL

El frontend nunca debe acceder directamente a PostgreSQL.

La UI no debe contener lógica de negocio compleja.

## Principios

1. No cambiar tecnologías sin justificarlo.
2. No introducir dependencias innecesarias.
3. No duplicar lógica.
4. Reutilizar componentes.
5. Mantener separación de responsabilidades.
6. Priorizar mantenibilidad.
7. Priorizar experiencia del usuario.
8. Priorizar seguridad.
9. Priorizar rendimiento.
10. Escribir código preparado para producción.

## Frontend

Aplicar:

- componentes reutilizables
- responsive design
- mobile-first cuando sea apropiado
- estados loading
- estados empty
- estados error
- feedback visual
- accesibilidad básica
- navegación intuitiva
- formularios robustos
- validación
- manejo correcto de errores API
- lazy loading cuando aporte valor
- code splitting cuando aporte valor
- optimización de imágenes
- evitar renders innecesarios

Separar claramente:

- UI state
- server state
- authentication state

Usar:

- Zustand para estado global necesario
- TanStack Query para server state
- Axios para comunicación HTTP

## Backend

Mantener:

- routers
- schemas
- services/business logic
- models
- database

No colocar toda la lógica en los routers.

Validar entradas con Pydantic.

Aplicar autenticación y autorización correctamente.

Nunca almacenar contraseñas en texto plano.

## Base de datos

PostgreSQL debe ser la fuente persistente de datos.

No crear estructuras duplicadas innecesariamente.

Antes de modificar el modelo de datos:

1. analizar las relaciones existentes
2. identificar impacto
3. proponer cambios
4. implementar migración segura

## Seguridad

Nunca:

- hardcodear secretos
- hardcodear contraseñas
- subir .env
- exponer JWT secrets
- confiar únicamente en validación frontend
- permitir acceso no autorizado a recursos

Validar siempre también en backend.

## UX

La aplicación debe sentirse como un producto comercial.

Cada flujo debe contemplar:

- loading
- success
- error
- empty state
- confirmación cuando corresponda

Evitar interfaces que parezcan una aplicación administrativa genérica.

El usuario final debe poder entender qué hacer sin conocer la arquitectura interna.

## Comercio

La futura experiencia de compra debe contemplar:

Libro
→ detalle
→ precio
→ agregar al carrito
→ carrito
→ checkout
→ pago
→ confirmación
→ biblioteca/pedidos

No implementar pagos reales sin revisar primero:

- modelo de productos
- órdenes
- items
- estados de pago
- seguridad
- webhooks
- idempotencia
- manejo de errores

## Calidad

Antes de considerar una funcionalidad terminada:

- ejecutar lint
- ejecutar tests existentes
- ejecutar build
- comprobar errores TypeScript/JavaScript si aplican
- revisar consola
- revisar errores de API
- revisar responsive
- revisar accesibilidad básica

## Regla fundamental

NO modificar grandes partes del proyecto sin comprender primero el código existente.

Antes de implementar una mejora:

1. inspeccionar
2. comprender
3. identificar impacto
4. planificar
5. implementar
6. probar
7. documentar

Si existe código funcional, preferir evolucionarlo antes que reemplazarlo.

Si encuentras un problema arquitectónico, explica primero el problema y la solución propuesta.

No inventes archivos, endpoints, modelos o dependencias que no existan sin justificar su necesidad.