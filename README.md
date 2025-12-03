# Darien Gap Scrollytelling

A lightweight scrollytelling microsite showcasing the landscape, human stakes, and geography of the Darién Gap.

## Getting started

1. Clone this repository and install dependencies (none required).
2. Open `index.html` in a modern browser or serve locally for live reload.
   ```bash
   # optional: use any static server
   npx serve .
   ```

## Customization checklist

- Replace placeholder narrative copy inside `index.html` with reported text.
- Swap each scene background in `img/` with final art or photography (keep filenames or update the `data-bg` attributes).
- Replace each `<DataWrapper embed>` placeholder inside `index.html` with the real embed code (plus accessible descriptions).
- Swap the `<Mapbox embed>` placeholder inside the map section with a working Mapbox GL script or a hosted custom map.
- Edit narrative stats, attributions, and references to match your reporting.
- Add analytics, fonts, or additional sections as needed.

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. In the repo settings, enable Pages for the `main` branch (root directory).
3. Wait for the Pages build to complete, then share the published URL.
