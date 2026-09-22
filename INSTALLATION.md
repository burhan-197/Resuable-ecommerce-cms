# StorefrontCMS Lite — Installation

## Requirements

- Node.js 20.19.0 or newer
- npm
- MongoDB or MongoDB Atlas

## Install

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/storefront_cms_lite
SESSION_SECRET=replace-with-a-long-random-secret
SITE_ORIGIN=http://localhost:3000
```

Start the app:

```bash
npm start
```

Storefront: `http://localhost:3000`  
Admin: `http://localhost:3000/admin`

On the first visit to `/admin`, create the one administrator account. Afterwards `/admin` opens the normal login flow.

Product images are stored locally under `public/uploads/products`. On production hosting, make sure this folder is persistent or backed up.
