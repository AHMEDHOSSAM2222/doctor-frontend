# doctor-frontend

Website for the clinic's patient file system, built with React and Vite. It works with the API in
[doctor-backend](https://github.com/AHMEDHOSSAM2222/doctor-backend).

It has two parts:

- **Patient page** (`/`): the page the clinic QR code opens. The patient enters their file number and phone
  number and sees their file: details, allergies, chronic conditions, doctor's notes and visits. It is built
  for phones and available in Arabic and English (right-to-left supported). Arabic-Indic digits are accepted.
- **Admin dashboard** (`/admin`): staff log in to create and edit patient files, record visits, and generate
  the QR code.

## The QR code

Open **Admin → QR code** to generate it. The page shows a printable poster with the clinic name, the code and a
short instruction in English and Arabic. From there you can:

- **Print poster** for the waiting room or reception desk
- **Download PNG** (1024 × 1024) or **Download SVG** to use on cards, flyers or signs

The code links to the patient page of this website. The link defaults to the address the dashboard is open
on, and you can change it on the page. Phones cannot open `localhost` links, so the page warns you if the link
is local.

## Run locally

Start [doctor-backend](https://github.com/AHMEDHOSSAM2222/doctor-backend) first (it listens on port 4000), then:

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173/admin and log in with the backend's admin account (default `admin` / `admin123`).
In development, Vite forwards `/api` requests to `http://localhost:4000`, so no extra setup is needed.

**To test with a real phone:** the dev server also listens on your local network. Vite prints a "Network"
address such as `http://192.168.1.10:5173/`. Put that address in the QR code page's link field, and scan the code
with a phone on the same Wi-Fi.

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable           | Purpose                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `VITE_API_URL`     | Address of doctor-backend, e.g. `https://api.myclinic.com`. Empty = same domain |
| `VITE_CLINIC_NAME` | Clinic name shown on the patient page and the QR poster                          |
| `VITE_PUBLIC_URL`  | Public address of this site, used as the default QR code link                   |

These are read at build time, so rebuild after changing them.

## Build and deploy

```bash
npm run build
```

Upload the `dist/` folder to any static host (Netlify, Vercel, Cloudflare Pages, Nginx…). The site is a
single-page app, so every path must serve `index.html`. `public/_redirects` (Netlify) and `vercel.json`
(Vercel) already handle that.

Serve the site over **HTTPS**. After deploying, open **Admin → QR code**, check the link points to your live
address, and print the poster.
