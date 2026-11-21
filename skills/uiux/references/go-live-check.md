# Website Go-Live Check

Run when a site is about to go live or has just gone live ("check the site before launch", "is it ready", "go-live check", a team's launch SOP to compare against). Most of it is measured from outside with `curl` and a browser, so run it rather than listing it. Report each item as done, fixed, not done (with its cost), or not checked (with why), never as a bare checklist.

The item most often missed is the first: a site built behind "discourage search engines" or a `noindex` header goes live still hidden, and every title and description written for it reaches no search result. Check it before anything else.

## Any site

| Check | How to measure | What goes wrong |
|---|---|---|
| Indexing on | `curl -s <url> \| grep -i 'name="robots"'` and the `X-Robots-Tag` header; read `/robots.txt` | A launch keeps the staging `noindex`, so the whole site is invisible to search |
| Title and description on key pages | `<title>` and `meta name="description"` on home, shop or listing, about, FAQ, contact | A page with no written description gets a stray first line ("Prefer to browse on your own?"); write it from the page's own wording, and for regulated products (supplements, finance) add no new claims |
| Structured data matches the page and current Google features | View the JSON-LD on a product page and the home page; Rich Results Test | Markup for retired features: FAQ rich results are no longer shown (Google Search Central, May 2026) and the sitelinks search box went 29/11/2024, so `FAQPage` and `WebSite` SearchAction earn nothing. AI Overviews need "no special schema.org structured data", only an indexed page whose markup "matches the visible text". A shop's return policy goes once under `Organization`; size variants as `ProductGroup` + `hasVariant`; a sale needs `priceValidUntil` (a past date can hide the listing) |
| Sitemap holds only what a signed-out visitor can open | Fetch every `<loc>` in the sitemap index, list any code other than 200 | An invite-only or logged-in page sits in the sitemap and redirects, which Search Console reports as an error |
| No demo or placeholder content | Sitemap slugs and page titles for `sample`, `demo`, `test`, `lorem`, `-2` duplicates | Real articles keep a seeder's `sample-...` address; rename with a 301 from the old one, and check the new slug isn't held by another post or attachment |
| Speed, mobile and desktop | Lighthouse, mobile (default) and `--preset=desktop` | Mobile is the score that matters and usually the low one; read LCP and render-blocking requests, not just the number. Google's PageSpeed API runs out of anonymous quota; run Lighthouse locally against a Playwright or Chrome binary (`CHROME_PATH=...`) |
| Images | Extensions in the home page's `src` attributes | PNG or JPEG photos where WebP would halve the bytes |
| Security routes closed | Status of `/xmlrpc.php`, `/wp-json/wp/v2/users`, `/?author=1`, `/readme.html` (WordPress), `/.env`, `/.git/HEAD` | User lists and version files left open give an attacker the login names |
| Tracking | Search the home page for `gtag(`, `googletagmanager`, `fbq(` | Analytics, Search Console, Tag Manager and Pixel all need the client's own Google or Meta account; ask for it before launch, not after |
| Email | Send one real transactional email (order, password reset) | No SMTP means mail lands in spam or never leaves |
| Backups | Where the database and uploaded files are copied, how often, how long kept | A database dump alone loses every uploaded image |
| Handover | Client briefed on the backend, a user guide, a sheet of master access, warranty start date | These are usually the business side's items; list them, don't do them |

After indexing is switched on, submit the sitemap in Search Console; it needs whoever owns the client's Google account.

## WordPress and WooCommerce

| Check | Expected |
|---|---|
| Settings | Timezone the client's (not UTC), permalinks "Post name", comments and pings off with manual approval on, avatars off, thumbnail size 0 × 0 when the theme handles sizes, site title and tagline set |
| Search engine visibility | `blog_public` 1 on production only; staging keeps 0 |
| Accounts | Developer and client admins follow the team's naming, each on its own email, no shared `admin` |
| Leftover content | Theme demo pages (an Astra or Elementor demo "Home" at `/home/` is not the front page Settings → Reading points at, and an SEO plugin's score on it measures a page nobody visits), Sample Page, Hello World, empty demo categories; trash rather than delete, so 30 days of undo remain |
| Plugins | Inactive plugins removed, not just deactivated |
| SEO plugin | Rank Math or Yoast: title pattern doesn't repeat the brand twice (`%title% - %sitename%` on a product already named after the brand), forms and private post types out of the sitemap |

### Hiding the login page

A hidden login address (WPS Hide Login: signed out, `wp-login.php` and `/wp-admin/` answer 404, staff use a private slug) is a common team SOP, but on a shop it protects less than it reads: customers sign in on the shop's account page with the same kind of password, so limiting failed logins covers both forms where hiding covers one. When the team still wants it hidden, check what would print the private slug, since WordPress rewrites every login URL to it:

- Any public page or template that calls `wp_login_url()` or links `wp-login.php` (a "Log in" button on a members area): point it at the shop's account page instead.
- WordPress's own new-user email ("To set your password, visit...") links the private slug; for anyone who isn't staff, filter `wp_new_user_notification_email` to the shop's lost-password page with the same key.
- Signed out, an email deep link into wp-admin or an expired session shows "not found", not a login form: tell staff in the user guide.
- Test suites and capture scripts sign in at `wp-login.php`, and a script that copies production's or staging's active plugins into a local site copies the hider too: keep it out of local and say so where the tests are documented.
- Staff get the address privately, and shared documents (user guide, test sheets) say "the sign-in address we sent you" rather than printing it.
