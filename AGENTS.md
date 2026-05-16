# AGENTS.md

## Repo
`ali999774/clinical-tools` — static artifact gallery, deployed to Vercel via GitHub Actions.
Live: `clinical-tools-five.vercel.app` | GitHub Pages mirror: `ali999774.github.io/clinical-tools/public/artifacts/`

## Adding an artifact
Place the `.html` file in `public/artifacts/`, then update `src/App.tsx` to add it to the gallery array.

## Auto-deploy
Every push to `main` triggers `.github/workflows/vercel-deploy.yml` → Vercel production deploy → live in ~60s. Auditable in GitHub Actions tab.

## Ali's shortcut
If Ali says he dropped or updated a file in the artifacts folder, take it as a directive to:
1. Verify the file exists in `public/artifacts/`
2. Update `src/App.tsx` if it's a new artifact (add to gallery array)
3. `git add`, commit with a descriptive message, `git push origin main`
4. Confirm the Vercel deploy triggered
No confirmation needed — just do it.
