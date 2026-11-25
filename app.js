(() => {
  const cfg = window.SHOWCASE_CONFIG || {};
  const user = cfg.githubUser;
  const $ = id => document.getElementById(id);

  const CATEGORY_RULES = [
    ["AI & ML", ["ai", "artificial-intelligence", "machine-learning", "ml", "llm", "claude-api", "openai", "rag", "nlp", "retrieval-augmented-generation", "chatbot", "agent", "deep-learning"]],
    ["Mobile", ["android", "ios", "flutter", "react-native", "mobile"]],
    ["Games", ["game", "games", "gamedev"]],
    ["Data", ["data", "data-science", "analytics", "dashboard", "visualization"]],
    ["Tools", ["cli", "tool", "tools", "automation", "extension", "chrome-extension"]],
    ["Backend & APIs", ["api", "express", "backend", "postgresql", "supabase", "edge-functions"]],
  ];
  const WEB_LANGS = ["TypeScript", "JavaScript", "HTML", "CSS", "Vue", "Svelte", "Astro"];
  const LANG_COLORS = { TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5", HTML: "#e34c26", CSS: "#563d7c", Java: "#b07219", "C#": "#178600", Go: "#00ADD8", Rust: "#dea584", Dart: "#00B4AB", Kotlin: "#A97BFF", Swift: "#F05138", PHP: "#4F5D95", Vue: "#41b883" };

  const state = { projects: [], category: "All", query: "", demoOnly: false, sort: "recent" };

  const titleCase = s => s.replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase()).replace(/\bAi\b/g, "AI").replace(/\bApi\b/g, "API");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = u => { if (!u) return ""; const v = /^https?:\/\//i.test(u) ? u : `https://${u}`; try { return new URL(v).href; } catch { return ""; } };

  function categorise(repo, ov) {
    if (ov.category) return [].concat(ov.category);
    const t = new Set(repo.topics || []);
    const cats = CATEGORY_RULES.filter(([, keys]) => keys.some(k => t.has(k))).map(([c]) => c);
    if (!cats.includes("AI & ML") && /(^|-)ai($|-)/i.test(repo.name)) cats.unshift("AI & ML");
    if (WEB_LANGS.includes(repo.language) || t.has("react") || t.has("nextjs")) cats.push("Web Apps");
    if (repo.language === "Python" && !cats.length) cats.push("Python");
    return cats.length ? cats : ["Other"];
  }

  function normalise(repos) {
    const exclude = new Set((cfg.exclude || []).map(s => s.toLowerCase()));
    return repos
      .filter(r => !r.fork && !r.archived)
      .filter(r => r.name.toLowerCase() !== user.toLowerCase())          // profile README repo
      .filter(r => !exclude.has(r.name.toLowerCase()))
      .filter(r => !(r.topics || []).includes("hide-from-showcase"))
      .map(r => {
        const ov = (cfg.overrides || {})[r.name] || {};
        const topics = (r.topics || []).filter(t => t !== "featured");
        return {
          name: r.name,
          title: ov.title || titleCase(r.name),
          description: ov.description || r.description || "No description yet.",
          demo: safeUrl(ov.demo || r.homepage),
          code: r.html_url,
          image: ov.image || `https://opengraph.githubassets.com/1/${r.owner?.login || user}/${r.name}`,
          topics, language: r.language, stars: r.stargazers_count || 0,
          featured: (r.topics || []).includes("featured") || !!ov.featured,
          pushed: r.pushed_at, created: r.created_at,
          categories: categorise(r, ov),
        };
      });
  }

  function normaliseExtra(list) {
    return (list || []).filter(x => x && x.title && !x.hidden).map(x => ({
      name: x.title, title: x.title,
      description: x.description || "No description yet.",
      demo: safeUrl(x.demo), code: safeUrl(x.code),
      image: x.image || "", topics: x.topics || [], language: x.language || null, stars: 0,
      featured: !!x.featured, pushed: x.added || null, created: x.added || null,
      platform: x.platform || "",
      categories: x.categories && x.categories.length ? x.categories : ["Other"],
    }));
  }

  async function loadExtra() {
    try { const r = await fetch("extra-projects.json", { cache: "no-cache" }); if (r.ok) return (await r.json()).projects; } catch {}
    return [];
  }

  async function load() {
    // 1) projects.json is refreshed by GitHub Actions every few hours (fast, no rate limit)
    try {
      const res = await fetch("projects.json", { cache: "no-cache" });
      if (res.ok) { const data = await res.json(); return { repos: data.repos, updated: data.generated_at }; }
    } catch {}
    // 2) fall back to asking GitHub directly from the browser
    const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`);
    if (!res.ok) throw new Error(`GitHub said ${res.status}`);
    return { repos: await res.json(), updated: new Date().toISOString() };
  }

  function renderFilters() {
    const counts = {};
    state.projects.forEach(p => p.categories.forEach(c => counts[c] = (counts[c] || 0) + 1));
    const cats = ["All", ...Object.keys(counts).sort((a, b) => counts[b] - counts[a])];
    $("filters").innerHTML = cats.map(c =>
      `<button class="chip" data-cat="${esc(c)}" aria-pressed="${c === state.category}">${esc(c)}<span class="count">${c === "All" ? state.projects.length : counts[c]}</span></button>`
    ).join("");
  }

  function visible() {
    const q = state.query.trim().toLowerCase();
    let list = state.projects.filter(p =>
      (state.category === "All" || p.categories.includes(state.category)) &&
      (!state.demoOnly || p.demo) &&
      (!q || [p.title, p.name, p.description, p.language, p.platform, ...p.topics, ...p.categories].join(" ").toLowerCase().includes(q)));
    const by = {
      recent: (a, b) => new Date(b.pushed) - new Date(a.pushed),
      newest: (a, b) => new Date(b.created) - new Date(a.created),
      name: (a, b) => a.title.localeCompare(b.title),
      stars: (a, b) => b.stars - a.stars,
    }[state.sort];
    return list.sort((a, b) => (b.featured - a.featured) || by(a, b));
  }

  function card(p) {
    const link = p.demo || p.code || "#";
    const ago = p.pushed ? new Date(p.pushed).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "";
    return `<article class="card">
      <a class="thumb" href="${esc(link)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
        ${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'thumb-fallback',textContent:this.dataset.t}))" data-t="${esc(p.title)}">` : `<span class="thumb-fallback">${esc(p.title)}</span>`}${p.featured ? '<span class="badge">Featured</span>' : ""}${p.platform ? `<span class="badge platform">Built on ${esc(p.platform)}</span>` : ""}
      </a>
      <div class="card-body">
        <h2><a href="${esc(link)}" target="_blank" rel="noopener">${esc(p.title)}</a></h2>
        <p class="desc">${esc(p.description)}</p>
        <div class="tags">${p.categories.map(c => `<span class="tag">${esc(c)}</span>`).join("")}${p.topics.slice(0, 3).map(t => `<span class="tag">#${esc(t)}</span>`).join("")}</div>
        <div class="meta">${p.language ? `<span><span class="dot" style="background:${LANG_COLORS[p.language] || "#999"}"></span>${esc(p.language)}</span>` : ""}${p.stars ? `<span>★ ${p.stars}</span>` : ""}${ago ? `<span>Updated ${esc(ago)}</span>` : ""}</div>
        <div class="actions">
          ${p.demo ? `<a class="btn primary" href="${esc(p.demo)}" target="_blank" rel="noopener">Live demo ↗</a>` : `<span class="btn disabled" title="Add a website URL to this repo on GitHub to show a demo link">No demo yet</span>`}
          ${p.code ? `<a class="btn ghost" href="${esc(p.code)}" target="_blank" rel="noopener">Code</a>` : ""}
        </div>
      </div>
    </article>`;
  }

  function render() {
    renderFilters();
    const list = visible();
    $("grid").innerHTML = list.map(card).join("");
    $("empty").hidden = list.length > 0;
    const demos = state.projects.filter(p => p.demo).length;
    $("stats").textContent = `${state.projects.length} projects · ${demos} with live demos`;
  }

  function setup() {
    document.title = cfg.siteTitle || "Project Hub";
    $("site-title").textContent = cfg.siteTitle || "Project Hub";
    $("brand-name").textContent = cfg.ownerName || user;
    $("tagline").textContent = cfg.tagline || "";
    const gh = `https://github.com/${user}`;
    $("github-link").href = gh; $("footer-gh").href = gh;
    if (cfg.portfolioUrl) { $("portfolio-link").href = cfg.portfolioUrl; $("portfolio-link").hidden = false; }
    $("grid").innerHTML = Array(6).fill('<div class="skeleton"></div>').join("");

    $("filters").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { state.category = b.dataset.cat; render(); } });
    $("search").addEventListener("input", e => { state.query = e.target.value; render(); });
    $("demo-only").addEventListener("change", e => { state.demoOnly = e.target.checked; render(); });
    $("sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
  }

  setup();
  Promise.all([load().catch(e => ({ repos: [], updated: null, error: e })), loadExtra()]).then(([{ repos, updated, error }, extra]) => {
    state.projects = [...normalise(repos), ...normaliseExtra(extra)];
    if (error && !state.projects.length) throw error;
    if (updated) $("updated").textContent = `Last refreshed ${new Date(updated).toLocaleString()}.`;
    render();
  }).catch(err => {
    $("grid").innerHTML = `<p class="loading">Couldn't load projects right now (${esc(err.message)}). Please try again shortly.</p>`;
  });
})();
