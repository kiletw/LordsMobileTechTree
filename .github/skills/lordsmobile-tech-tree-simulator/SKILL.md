---
name: lordsmobile-tech-tree-simulator
description: "Use when building a Lords Mobile technology tree simulator, research planner, or upgrade calculator from a newer client version. Covers Unity or IL2CPP client asset extraction, StringTable and Tech bytes refresh, reverse engineering notes, multilingual UI, game images, and GitHub Pages deployment."
argument-hint: "Describe the target: client version, desired tech-tree scope, and whether you need extraction, parsing, UI, or deployment help."
user-invocable: true
---

# Lords Mobile Tech Tree Simulator

## When to Use
- Build a Lords Mobile technology tree simulator in a new repository.
- Refresh the latest text assets or technology data from a newer game client.
- Reverse engineer Tech, TechKind, TechLv, or TechTree tables.
- Build a multilingual UI with game images and deploy it as a static site.

## Procedure
1. Inventory the client version, raw assets, and existing extracted tables.
2. Extract or refresh StringTable and Tech-related bytes from the latest client.
3. Reverse engineer missing struct layouts and export JSON tables.
4. Build the planner UI with static data, i18n, and image assets.
5. Prepare the site for GitHub Pages deployment.

## References
- [Client extraction guide](./references/client-extraction.md)
- [Reverse engineering guide](./references/reverse-engineering.md)
- [Data refresh guide](./references/data-refresh.md)
- [Frontend architecture guide](./references/frontend-architecture.md)

## Assets
- [Tech schema template](./assets/tech-schema.json)
- [Refresh manifest template](./assets/data-refresh-manifest.json)