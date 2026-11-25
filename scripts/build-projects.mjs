// Runs in GitHub Actions: fetches public repos and writes projects.json.
import { writeFile, readFile } from "node:fs/promises";

const cfgSrc = await readFile(new URL("../config.js", import.meta.url), "utf8");
const window = {};
new Function("window", cfgSrc)(window);
const user = process.env.SHOWCASE_USER || window.SHOWCASE_CONFIG.githubUser;

const headers = { Accept: "application/vnd.github+json", "User-Agent": "project-showcase" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const repos = [];
for (let page = 1; page < 10; page++) {
  const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&page=${page}&sort=pushed`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const batch = await res.json();
  repos.push(...batch);
  if (batch.length < 100) break;
}

const slim = repos.map(r => ({
  name: r.name, description: r.description, homepage: r.homepage, topics: r.topics || [],
  fork: r.fork, archived: r.archived, language: r.language, stargazers_count: r.stargazers_count,
  html_url: r.html_url, pushed_at: r.pushed_at, created_at: r.created_at, owner: { login: r.owner.login }
}));
await writeFile(new URL("../projects.json", import.meta.url),
  JSON.stringify({ generated_at: new Date().toISOString(), user, repos: slim }, null, 2));
console.log(`Wrote ${slim.length} repos for ${user}`);
