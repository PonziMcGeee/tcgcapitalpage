# TCG Capital Page

Web de venta de cartas TCG con dos tipos de usuario:

- **Comprador**: se registra libremente, navega por el catálogo y, al tener cuenta, ve el contacto del vendedor (botones de WhatsApp, Telegram o Instagram).
- **Vendedor** (pensado para unos 30): tiene su propio panel para subir cartas (foto delante y detrás), marcarlas como vendidas o borrarlas, elegir el color de su tienda y editar sus datos de contacto. Cada vendedor solo ve y modifica sus propias cartas, y tiene su propia página de tienda.

El precio que ve el comprador es **carta + envío** (España o resto de Europa), con el envío fijado por el vendedor en cada carta.

**Pagos**: en esta primera versión no hay pasarela. El comprador contacta con el vendedor y acuerdan el pago y el envío. Más adelante se puede añadir Stripe Connect para que cada vendedor cobre directamente.

## Tecnología

- Next.js 14 (App Router) + React
- Supabase (inicio de sesión, base de datos Postgres y almacenamiento de fotos)
- Despliegue previsto: Vercel

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com), crea una cuenta y un proyecto nuevo.
2. Ve a **SQL Editor > New query**, pega el contenido de `supabase/schema.sql` y pulsa **Run**. Esto crea las tablas, los permisos y la carpeta de fotos.
3. Ve a **Project Settings > API** y copia la **Project URL** y la clave **anon public**.

> **Si ya habías ejecutado una versión anterior de `schema.sql`**, ejecuta además, una sola vez, el archivo `supabase/migracion-muchos-vendedores.sql` (SQL Editor > New query > Run). Añade el color de tienda, la lista pública de vendedores y la sincronización del nombre. Hazlo **antes** de usar la última versión de la web.

(Opcional, para probar más rápido) En **Authentication > Providers > Email**, desactiva "Confirm email" para que los registros entren sin confirmar el correo.

### 2. Configurar el proyecto en local

```bash
cp .env.example .env.local
# edita .env.local y pega la URL y la clave anon de Supabase
npm install
npm run dev
```

La web queda en http://localhost:3000.

### 3. Dar de alta a los vendedores

1. Cada uno se registra normalmente en `/registro` (así queda como comprador).
2. Después, en Supabase > SQL Editor, ejecuta esto con los emails de los vendedores (puedes añadir todos los que quieras a la lista, y repetirlo cuando se sumen más):

```sql
update public.profiles
set role = 'seller'
where id in (
  select id from auth.users
  where email in ('pablo@ejemplo.com', 'vendedor2@ejemplo.com', 'vendedor3@ejemplo.com')
);
```

3. Al volver a entrar, verán el enlace **Mi panel** en la cabecera.

El rol solo se puede cambiar desde el SQL Editor; nadie puede hacerse vendedor desde la web.

Para quitar a alguien como vendedor, cambia `'seller'` por `'buyer'` en esa misma consulta.

### Notas para muchos vendedores

- Supabase devuelve como máximo 1000 filas por consulta; el catálogo ya pide las cartas por páginas.
- El catálogo se ve por vendedor (con 6 cartas de muestra cada uno) o todas juntas con "Mostrar más". Hay un directorio en `/vendedores` con buscador.
- Las fotos se reducen en el navegador antes de subirlas (máx. 1200 px) para ahorrar espacio: el plan gratuito de Supabase da 1 GB de almacenamiento.
- Si el catálogo llega a miles de cartas, convendrá paginar también en el servidor.

### 4. Publicar en Vercel

1. Importa este repositorio en [vercel.com](https://vercel.com).
2. En **Settings > Environment Variables** añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Despliega. Obtendrás una dirección gratuita tipo `tcgcapitalpage.vercel.app`; el dominio propio se puede añadir más adelante.

## Estructura

```
app/page.js              Portada con presentación y carrusel de cartas
app/catalogo/page.js     Catálogo con búsqueda, filtros y vista por vendedor
app/vendedores/page.js   Directorio de vendedores con buscador
app/carta/[id]/page.js   Detalle de carta, total con envío y contacto
app/tienda/[id]/page.js  Tienda propia de cada vendedor
app/login, app/registro  Acceso de usuarios
app/vendedor/page.js     Panel del vendedor
supabase/schema.sql      Tablas, permisos (RLS) y almacenamiento (instalación desde cero)
supabase/migracion-muchos-vendedores.sql   Solo lo nuevo, para bases ya creadas
```

## Próximos pasos posibles

- Stripe Connect para cobrar con tarjeta y repartir el dinero a cada vendedor
- Aviso por email o Telegram al vendedor cuando alguien contacta
- Varias fotos por carta, favoritos y carrito con varias cartas del mismo vendedor
