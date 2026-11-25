// Edit this file to customise the site. Everything else updates itself from GitHub.
window.SHOWCASE_CONFIG = {
  githubUser: "Knarf24",
  ownerName: "Frank Ncube",
  siteTitle: "Frank's Project Hub",
  tagline: "Everything I've built, in one place. Click any card to try the live demo.",
  portfolioUrl: "https://frank-ncube-portfolio.vercel.app",

  // Repos that never appear on the site (the profile README repo is always hidden).
  // You can also hide a repo by adding the topic "hide-from-showcase" to it on GitHub.
  exclude: ["frank-ncube-portfolio", "project-hub"],

  // Add the topic "featured" to a repo on GitHub to pin it to the top.
  // Optional per-project overrides, keyed by repo name:
  // "shopaccess-ai": { title: "ShopAccess AI", demo: "https://...", category: "AI" }
  overrides: {
    "support-triangle-agent": { title: "Support Triage Agent" },
    "shopaccess-ai": { title: "ShopAccess AI" },
    "streetwise-offer-ai": { title: "Streetwise Offer AI" }
  }
};
