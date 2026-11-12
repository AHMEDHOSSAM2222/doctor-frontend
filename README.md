# doctor-frontend

Website for the clinic's patient file system, built with React and Vite. It works with the API in
[doctor-backend](https://github.com/AHMEDHOSSAM2222/doctor-backend).

It has two parts:

- **Admin dashboard** (`/admin`): the system starts here. Opening the site address goes straight to the staff
  login. Staff create and edit patient files, attach PDFs (lab results, reports, scans), record visits, and
  generate the QR code.
- **Patient page** (`/patient`): the page the clinic QR code opens. It asks for the file number and phone number,
  then shows the patient's file: details, allergies, chronic conditions, doctor's notes, visits, and their PDFs.
  Tapping a PDF opens it in the phone's PDF viewer; its **Download** button saves it on the phone. It is built for phones and available in Arabic and English (right-to-left
  supported). Arabic-Indic digits are accepted.

## PDF files

When creating or editing a patient file, choose PDFs (or drag them onto the form) and give each one the title
the patient will see, for example "Blood test, November 2026". More PDFs can be added, opened or deleted from the
patient's file page. Up to 10 PDFs at a time, 20 MB each.

On the patient page each PDF has a **Download** button that saves it on the patient's phone, named after its
title (for example `Blood test, November 2026.pdf`).

For privacy, a patient can open and download their PDFs for 30 minutes after entering their details; after that
the page closes the file and asks for the file number and phone number again.

## The QR code

Open **Admin → QR code** to generate it. The page shows a printable poster with the clinic name, the code and a
short instruction in English and Arabic. From there you can:

- **Print poster** for the waiting room or reception desk
- **Download PNG** (1024 × 1024) or **Download SVG** to use on cards, flyers or signs

The code links to the patient page of this website (`<your address>/patient`). The link defaults to the
address the dashboard is open on, and you can change it on the page. Phones cannot open `localhost` links, so
the page warns you if the link is local.

## Demo for showing the system

`npm run build:demo` builds a demo version that needs no backend or database: the real pages run in the browser
with sample patients, visits and PDFs, and changes stay in the viewer's browser. It produces one self-contained
page, `dist-demo/clinic-demo.html`, that can be published as a single web page. A bar at the top shows the sample
logins (staff `admin` / `demo1234`, patient file `1001` with phone `01012345678`) and switches between the staff
dashboard and the patient page; adding `#patient` to the demo's address opens the patient page directly.

Set the link the demo's QR code opens (the demo's own address followed by `#patient`) when building:

```bash
VITE_QR_LINK=https://example.com/clinic-demo#patient npm run build:demo
```

Where the page that hosts the demo blocks new tabs, downloads or printing, PDFs open in a viewer inside the page
and Download, Print and confirmation steps show a short note about what the live system does. The demo code lives
in `src/demo/` and is left out of the normal `npm run build`.

## Run locally

Start [doctor-backend](https://github.com/AHMEDHOSSAM2222/doctor-backend) first (it listens on port 4000), then:

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173 and log in with the backend's admin account (default `admin` / `admin123`).
The patient page is at http://localhost:5173/patient.
In development, Vite forwards `/api` requests to `http://localhost:4000`, so no extra setup is needed.

**To test with a real phone:** the dev server also listens on your local network. Vite prints a "Network"
address such as `http://192.168.1.10:5173/`. Put that address followed by `/patient` (for example
`http://192.168.1.10:5173/patient`) in the QR code page's link field, and scan the code with a phone on the same
Wi-Fi.

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable             | Purpose                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `VITE_API_URL`       | Address of doctor-backend, e.g. `https://api.myclinic.com`. Empty = same domain |
| `VITE_CLINIC_NAME`   | Clinic name shown on the patient page and the QR poster                         |
| `VITE_MAX_UPLOAD_MB` | Largest PDF staff can pick (keep equal to the backend's `MAX_UPLOAD_MB`)        |
| `VITE_PUBLIC_URL`    | Public address of this site, used as the default QR code link                   |

These are read at build time, so rebuild after changing them.

## Build and deploy

To put the whole system online, follow one of the guides in doctor-backend:
[RAILWAY.md](https://github.com/AHMEDHOSSAM2222/doctor-backend/blob/HEAD/RAILWAY.md) (Railway, no server to manage)
or [DEPLOY.md](https://github.com/AHMEDHOSSAM2222/doctor-backend/blob/HEAD/DEPLOY.md) (your own server with Docker).
Both build this site with the `Dockerfile` here (`railway.json` tells Railway to) and serve it with Caddy (see
`Caddyfile`).

To host the site on its own:

```bash
npm run build
```

Upload the `dist/` folder to any static host (Netlify, Vercel, Cloudflare Pages, Nginx…). The site is a
single-page app, so every path must serve `index.html`. `public/_redirects` (Netlify) and `vercel.json`
(Vercel) already handle that.

Serve the site over **HTTPS**. After deploying, open **Admin → QR code**, check the link points to your live
address, and print the poster.
