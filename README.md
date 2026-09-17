# Welcome to your project

TODO: Document your project here

## SEO Prerendering

Production builds prerender key marketing routes into static HTML for better crawler and social scraper support.

The build command runs two steps:

1. `vite build`
2. `node scripts/prerender.mjs`

During prerender, the script also writes:

- `dist/sitemap.xml` (static + discovered dynamic routes)
- `dist/image-sitemap.xml` (portfolio, published blog, and maternity gown images)

Configured routes:

- /
- /about
- /portfolio
- /pricing
- /blog
- /contact
- /experience
- /maternity-gowns
- /videos
- /shop

If you add a new public landing page, include it in `prerenderRoutes` in `scripts/prerender.mjs`.

### Dynamic Route Discovery

The prerender script also tries to discover dynamic routes for:

- `/portfolio/:slug`
- `/blog/:slug` (published posts only)

By default, it reads from `http://localhost:5000/api`.
You can override this during build with:

- `PRERENDER_API_URL`
- or `VITE_API_URL`

Example:

`PRERENDER_API_URL=https://fiestahouseattire.com/api npm run build`
