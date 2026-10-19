# AkibaTrade

Web de venta de cartas TCG con tres tipos de usuario:

- **Comprador**: se registra libremente, navega por el catálogo y, al tener cuenta, ve el contacto del vendedor (botones de WhatsApp, Telegram o Instagram).
- **Vendedor** (pensado para unos 30): tiene su propio panel para subir cartas (foto delante y detrás, con su estado: Mint, Near Mint, Excellent…), editarlas, marcarlas como vendidas o borrarlas, elegir el color de su tienda y editar sus datos de contacto. Cada vendedor solo ve y modifica sus propias cartas, y tiene su propia página de tienda.
- **Administrador**: tiene todo lo de un vendedor y además, desde `/admin`, convierte compradores en vendedores y edita la portada: los banners del slider de arriba y los carruseles de debajo (con las cartas o vendedores que él elija). Todos los carruseles tienen el mismo aspecto que el predefinido: movimiento automático continuo y precio sobre la carta.

El precio que ve el comprador es **carta + envío** (España o resto de Europa), con el envío fijado por el vendedor en cada carta.

**Pagos**: en esta primera versión no hay pasarela. El comprador contacta con el vendedor y acuerdan el pago y el envío. Más adelante se puede añadir Stripe Connect para que cada vendedor cobre directamente.

**Juegos**: de momento solo Pokémon y One Piece (lista en `lib/format.js`). En Pokémon el vendedor puede indicar la colección (hasta 2006, lista en `lib/collections.js`) y el catálogo permite filtrar por ella.

## Tecnología

- Next.js 14 (App Router) + React
- Supabase (inicio de sesión, base de datos Postgres y almacenamiento de fotos)
- Despliegue previsto: Vercel

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com), crea una cuenta y un proyecto nuevo.
2. Ve a **SQL Editor > New query**, pega el contenido de `supabase/schema.sql` y pulsa **Run**. Esto crea las tablas, los permisos y la carpeta de fotos.
3. Ve a **Project Settings > API** y copia la **Project URL** y la clave **anon public**.

> **Si ya habías ejecutado una versión anterior de `schema.sql`**, ejecuta además, una sola vez y por este orden, estos archivos (SQL Editor > New query > Run):
> 1. `supabase/migracion-muchos-vendedores.sql`: color de tienda, lista pública de vendedores y sincronización del nombre.
> 2. `supabase/migracion-administrador-y-portada.sql`: rol de administrador, banners y carruseles editables.
> 3. `supabase/migracion-moderacion.sql`: el administrador puede borrar cualquier carta y las cartas de quien deja de ser vendedor se ocultan.
> 4. `supabase/migracion-colecciones.sql`: campo de colección para las cartas de Pokémon.
> 5. `supabase/migracion-miniaturas.sql`: miniaturas de las cartas (menos tráfico de fotos). Después, cada vendedor con cartas antiguas pulsa **Optimizar fotos antiguas** en su panel.
> 6. `supabase/migracion-foto-perfil.sql`: foto de perfil de los vendedores.
> 7. `supabase/migracion-vendedores-destacados.sql`: dos vendedores destacados en la portada.
> 8. `supabase/migracion-favoritos.sql`: favoritos (cartas y vendedores) de cada comprador.
> 9. `supabase/migracion-trade.sql`: casilla «Admito trade» en cada carta.
> 10. `supabase/migracion-resenas.sql`: ventas con comprador y reseñas de vendedores.
>
> Hazlo **antes** de usar la última versión de la web.

(Opcional, para probar más rápido) En **Authentication > Providers > Email**, desactiva "Confirm email" para que los registros entren sin confirmar el correo.

### 2. Configurar el proyecto en local

```bash
cp .env.example .env.local
# edita .env.local y pega la URL y la clave anon de Supabase
npm install
npm run dev
```

La web queda en http://localhost:3000.

### 3. Hacerte administrador y dar de alta a los vendedores

1. Regístrate en `/registro` con tu email (así quedas como comprador).
2. En Supabase > SQL Editor, ejecuta esto **una sola vez**, cambiando el email por el tuyo. Es la única forma de crear un administrador:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'tu-email@ejemplo.com');
```

3. Cierra sesión y vuelve a entrar: verás **Mi panel** y **Admin** en la cabecera.
4. Cada vendedor se registra en `/registro`. Tú entras en **Admin > Usuarios**, lo buscas por nombre o email y pulsas **Hacer vendedor**. Para quitárselo, **Quitar vendedor** (pide confirmación): deja de poder vender y sus cartas se ocultan de la web sin borrarse; si vuelve a ser vendedor, reaparecen.

### Moderación de cartas

En **Admin > Cartas** ves las cartas de todos los vendedores (filtro por nombre, vendedor y estado, con las dos fotos ampliables) y puedes **Borrar** cualquiera que no sea adecuada; se borran también sus fotos. Desde **Admin > Usuarios**, el botón **Ver cartas** te lleva a las de ese vendedor.

Solo un administrador puede cambiar roles, y nadie puede cambiarse el suyo ni tocar a otro administrador desde la web.

### Portada editable

En **Admin > Banners** subes los banners del slider de arriba (imagen, título, subtítulo y botón con enlace), los ordenas y los activas o desactivas.

En **Admin > Carruseles** creas los carruseles de debajo ("Mejores cartas", "Mejores vendedores"…). Cada una puede llevar cartas de cualquier vendedor (también vendidas, para un "Mejores ventas") o vendedores elegidos a mano. Las ordenas y las activas o desactivas cuando quieras. Si no hay carruseles, la portada enseña las últimas cartas añadidas.

En **Admin > Destacados** eliges a mano hasta dos vendedores top (con un texto opcional como "Vendedor del mes"). Salen como dos banners grandes debajo del carrusel.

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
app/page.js              Portada: banners y carruseles editables
app/admin/page.js        Administración: usuarios, banners y carruseles
app/catalogo/page.js     Catálogo con búsqueda, filtros y vista por vendedor
app/vendedores/page.js   Directorio de vendedores con buscador
app/carta/[id]/page.js   Detalle de carta, total con envío y contacto
app/tienda/[id]/page.js  Tienda propia de cada vendedor
app/login, app/registro  Acceso de usuarios
app/vendedor/page.js     Panel del vendedor
supabase/schema.sql      Tablas, permisos (RLS) y almacenamiento (instalación desde cero)
supabase/migracion-muchos-vendedores.sql           Solo lo nuevo, para bases ya creadas
supabase/migracion-administrador-y-portada.sql     Rol admin, banners y carruseles, para bases ya creadas
supabase/migracion-moderacion.sql                  Borrado por el admin y ocultar cartas de ex vendedores
supabase/migracion-colecciones.sql                 Columna de colección (Pokémon)
supabase/migracion-miniaturas.sql                  Columna de miniatura
supabase/migracion-foto-perfil.sql                 Foto de perfil de los vendedores
supabase/migracion-vendedores-destacados.sql       Dos vendedores destacados en la portada
supabase/migracion-favoritos.sql                    Favoritos de cada usuario (cartas y vendedores)
supabase/migracion-trade.sql                        Columna accepts_trade (admite trade)
supabase/migracion-resenas.sql                      Ventas con comprador y reseñas
lib/collections.js                                 Lista de colecciones de Pokémon hasta 2006
```

## Próximos pasos posibles

- Stripe Connect para cobrar con tarjeta y repartir el dinero a cada vendedor
- Aviso por email o Telegram al vendedor cuando alguien contacta
- Varias fotos por carta, favoritos y carrito con varias cartas del mismo vendedor
