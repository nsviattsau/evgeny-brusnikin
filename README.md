# Memorial site

A small, static memorial website: portrait and dates, ceremony details, biography,
a feed of memories from family and friends, and a form where visitors can share a
memory (with an optional photo). Every submission is moderated before it appears.

- **Visitor-facing text:** Russian
- **Code, comments, docs:** English
- **No build step, no framework.** Plain HTML, CSS and ES modules.
- **Backend (optional):** [Supabase](https://supabase.com) free tier — database,
  photo storage, admin login.

## How it works without Supabase or a domain

Out of the box the site runs in **demo mode**:

- a dark banner at the top says it is a demo,
- sample memories from `js/demo-data.js` are shown,
- the form validates input but does not save anything.

You can publish it on GitHub Pages right away, at
`https://<username>.github.io/<repo>/`, and add Supabase and a custom domain later.
You don't need to change any code for either step.

## Project structure

```
index.html              Public page
admin.html              Moderation panel (sign in, approve / reject / delete)
css/style.css           All styles
js/content.js           ← EDIT THIS: name, dates, ceremony, biography, footer
js/config.js            ← Supabase URL + anon key (empty = demo mode)
js/app.js               Public page logic (render, memories feed, form)
js/admin.js             Moderation panel logic
js/demo-data.js         Sample memories for demo mode
js/utils.js             Helpers (escaping, Russian date formatting)
js/supabase-client.js   Lazy Supabase client loader
images/                 Portrait and other images
supabase/schema.sql     Database, security rules and storage bucket
.github/workflows/      GitHub Pages deployment
```

## 1. Personalise the content

1. Put the portrait in `images/`, e.g. `images/portrait.jpg`. A 4:5 crop, at
   least 800 px tall, works best.
2. Edit `js/content.js`:
   - `person`: full name, dates (`YYYY-MM-DD`), places, portrait path, epigraph
   - `ceremony`: date, time, place, address, map link (or `null` to hide it)
   - `biography`: list of paragraphs; `**text**` makes text bold
   - `footerText`
3. Optionally replace or empty the sample memories in `js/demo-data.js`.

## 2. Run locally

ES modules need a local server; opening the file directly will not work.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## 3. Deploy on GitHub Pages (free, no domain needed)

1. Create a repository and push this folder to the `main` branch.
2. In the repository, go to **Settings → Pages → Build and deployment → Source**
   and choose **GitHub Actions**.
3. Push again, or run the *Deploy to GitHub Pages* workflow by hand. The site
   appears at `https://<username>.github.io/<repo>/`.

The site also works as-is on Netlify, Vercel or Cloudflare Pages. Drag and drop
the folder; no build command is needed.

## 4. Connect Supabase (enables real submissions)

1. Create a free project at <https://supabase.com>.
2. Open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`
   and click **Run**. This creates:
   - the `memories` table, where new rows always start as `pending`,
   - the `admins` table and the `is_admin()` helper,
   - Row Level Security. Visitors can only read approved memories and never
     see email addresses. Only admins can moderate.
   - a public `memory-photos` storage bucket (JPG/PNG/WebP, max 5 MB).
3. Create your admin account:
   - **Authentication → Users → Add user → Create new user** (email +
     password, tick *Auto Confirm User*).
   - In the SQL Editor:
     ```sql
     insert into public.admins (user_id)
     select id from auth.users where email = 'you@example.com';
     ```
   - **Authentication → Sign In / Providers**: turn off *Allow new users to
     sign up*, so nobody else can create an account.
4. Copy **Project Settings → API → Project URL** and the **anon public** key
   into `js/config.js`:
   ```js
   export const SUPABASE_URL = 'https://xxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```
   The anon key is meant to be public. Security comes from the RLS rules.
   **Never** put the `service_role` key in the site.
5. In **Authentication → URL Configuration**, set *Site URL* to your site
   address.
6. Commit and push. The demo banner disappears and the form starts saving.

### Moderating

Open `/admin.html`, sign in, and use the tabs *На проверке* (pending),
*Опубликованные* (approved) and *Отклонённые* (rejected). Email addresses of
authors are visible only here.

> Note: photo files are uploaded to a public bucket under random file names, so
> a photo that is still pending can technically be opened by anyone who knows
> its exact URL. The URL is never shown on the public page before approval.
> Deleting a memory in the admin panel also deletes its photo.

## 5. Add a custom domain later

**GitHub Pages:**

1. Buy a domain from any registrar (OVH, Gandi, Namecheap…).
2. In **Settings → Pages → Custom domain**, enter it, e.g. `memory-example.ru`.
3. At the registrar, add DNS records:
   - apex domain: four `A` records → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - or `www`: a `CNAME` record → `<username>.github.io`
4. When the DNS check passes, tick **Enforce HTTPS**.
5. Update *Site URL* in Supabase.

## Privacy and moderation features

- Name is optional, and *Опубликовать анонимно* hides it completely.
- Email is optional, stored privately and never readable by visitors
  (column-level privileges).
- Explicit consent checkbox is required before sending.
- Honeypot field to filter simple spam bots.
- `noindex` meta tag keeps the page out of search engines. Remove it from
  `index.html` if the family wants the page to be findable.

## Customising the look

Colors and fonts are CSS variables at the top of `css/style.css`. The fonts are
*Cormorant Garamond* (headings) and *PT Serif* (text), both with full Cyrillic
support.
