# Frank's Project Hub

A public directory of every project on GitHub (user `Knarf24`), shown as cards with a short description, a **Live demo** button and a **Code** button. Plain HTML/CSS/JS, no build step.

## How it updates itself
- A GitHub Action (`.github/workflows/update-site.yml`) runs on every push and every 6 hours. It fetches all public repos, writes `projects.json`, and publishes the site to GitHub Pages.
- If `projects.json` is missing, the page asks the GitHub API directly from the visitor's browser.

## How to control what shows (all from GitHub, no code changes)
| You want to… | Do this on the repo's GitHub page (⚙ next to "About") |
|---|---|
| Set the card text | Fill in **Description** |
| Show a **Live demo** button | Fill in **Website** with the demo URL |
| Put it in a category / make it searchable | Add **Topics** (e.g. `ai`, `react`, `game`, `mobile`, `cli`) |
| Pin it to the top | Add the topic `featured` |
| Hide it | Add the topic `hide-from-showcase` |

Forks, archived repos and the profile README repo are hidden automatically. Site title, tagline, portfolio link and per-project overrides live in `config.js`.

## Projects built on other platforms (Lovable, Bolt, Replit, Vercel…)
Add a block to `extra-projects.json` with at least `title` and `demo`. Optional: `description`, `platform` (shows a "Built on …" badge), `code`, `categories`, `topics`, `image`, `added` (date), `featured`. Set `"hidden": true` to keep a draft off the site.

## Linking from the portfolio
Add a link to the published URL (e.g. `https://knarf24.github.io/<repo-name>/`), or a "See all projects →" button.
