This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Requires Node.js 20.9 or newer (`node -v` to check; with nvm, `nvm use 20`).

Install dependencies:

```bash
npm install
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Firebase Hosting

The app is built as a static site (`output: "export"` in `next.config.ts`), so `npm run build` writes plain HTML/JS/CSS to `out/`, which Firebase Hosting serves. Because of this, `npm start` is not supported; use `npm run dev` locally.

### One-time setup

1. Install the Firebase CLI and log in with the Google account that has access to the Firebase project:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Link this folder to the Firebase project (creates `.firebaserc`). Find the project ID in the [Firebase console](https://console.firebase.google.com) under **Project settings → General → Project ID**, or run `firebase projects:list`:

   ```bash
   firebase use --add <project-id>
   ```

### Deploy (and every update after)

```bash
npm run deploy
```

This builds the app and runs `firebase deploy --only hosting`. The terminal prints the Hosting URL to share with students; after an update, they just refresh the page.

### Troubleshooting

- **`firebase` commands fail with 401 / invalid credentials:** the login expired. Run `firebase login --reauth`.
- **`Cannot find native binding` / `@tailwindcss/oxide-*` errors:** an npm bug with optional platform packages. Delete `node_modules` and run `npm install` again. If it persists, also delete `package-lock.json` before reinstalling (avoid committing the regenerated lockfile unless the team agrees).
