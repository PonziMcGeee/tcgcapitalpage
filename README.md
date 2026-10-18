# TCG Capital Page

Web de venta de cartas TCG con dos tipos de usuario:

- **Comprador**: se registra libremente, navega por el catálogo y, al tener cuenta, ve el contacto del vendedor (botones de WhatsApp, Telegram o Instagram).
- **Vendedor** (de momento 3): tiene su propio panel para subir cartas (foto delante y detrás), marcarlas como vendidas o borrarlas, y editar sus datos de contacto. Cada vendedor solo ve y modifica sus propias cartas.

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

(Opcional, para probar más rápido) En **Authentication > Providers > Email**, desactiva "Confirm email" para que los registros entren sin confirmar el correo.

### 2. Configurar el proyecto en local

```bash
cp .env.example .env.local
# edita .env.local y pega la URL y la clave anon de Supabase
npm install
npm run dev
```

La web queda en http://localhost:3000.

### 3. Crear los 3 vendedores

1. Cada uno se registra normalmente en `/registro` (así queda como comprador).
2. Después, en Supabase > SQL Editor, ejecuta esto con los emails de los vendedores:

```sql
update public.profiles
set role = 'seller'
where id in (
  select id from auth.users
  where email in ('pablo@ejemplo.com', 'companero1@ejemplo.com', 'companero2@ejemplo.com')
);
```

3. Al volver a entrar, verán el enlace **Mi panel** en la cabecera.

El rol solo se puede cambiar desde el SQL Editor; nadie puede hacerse vendedor desde la web.

### 4. Publicar en Vercel

1. Importa este repositorio en [vercel.com](https://vercel.com).
2. En **Settings > Environment Variables** añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Despliega. Obtendrás una dirección gratuita tipo `tcgcapitalpage.vercel.app`; el dominio propio se puede añadir más adelante.

## Estructura

```
app/page.js              Portada con presentación y carrusel de cartas
app/catalogo/page.js     Catálogo con búsqueda y filtros
app/carta/[id]/page.js   Detalle de carta, total con envío y contacto
app/tienda/[id]/page.js  Tienda propia de cada vendedor
app/login, app/registro  Acceso de usuarios
app/vendedor/page.js     Panel del vendedor
supabase/schema.sql      Tablas, permisos (RLS) y almacenamiento
```

## Próximos pasos posibles

- Stripe Connect para cobrar con tarjeta y repartir el dinero a cada vendedor
- Aviso por email o Telegram al vendedor cuando alguien contacta
- Varias fotos por carta, favoritos y carrito con varias cartas del mismo vendedor
