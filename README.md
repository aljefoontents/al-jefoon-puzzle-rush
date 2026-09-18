# Al Jefoon Tents — Puzzle Rush

A standalone HTML/CSS/JavaScript 4×4 sliding puzzle designed for GitHub Pages and later embedding on a Canva website.

## Files

- `index.html` — game markup
- `style.css` — responsive black / neon #fcc224 interface
- `game.js` — puzzle engine, timer, coins, store, achievements and local save

## GitHub Pages

1. Create a public GitHub repository, e.g. `al-jefoon-puzzle-rush`.
2. Upload the three files to the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`.
6. Save and wait for GitHub Pages to publish.
7. Your game will be available at the GitHub Pages URL shown by GitHub.

## Canva

Once GitHub Pages is live, use the published game URL in Canva's website embed option.

## Notes

- The game uses browser localStorage for progress. No account or server/database is required.
- Artwork is CSS/vector-style rather than real photographs.
- All navigation screens include a Back button.
- The first release intentionally keeps the game self-contained so it is easy to host and embed.
