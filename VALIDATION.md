# Portfolio validation

Reviewed October 11, 2026.

- `npm test`: eight offline checks verify every supported API method returns 503 and that the archived provider routes are not registered.
- `npm run typecheck`: passes.
- `npm run build`: passes; existing image-optimization and React-hook lint warnings remain.
- Next.js and eslint-config-next updated to 15.5.27, compatible dependency patches applied, and provider packages used only by archived handlers removed.
- npm audit reports 17 affected dependency entries: zero critical, 14 high, and three moderate. These include development/transitive dependencies and are not 17 confirmed runtime exploits. Major-version dependency work remains.
- Secret scans found no matches in the fetched public Git history. This is a dated automated check, not proof that no sensitive information can exist.

The public copy is a historical UI and source reference. All server API routes are disabled with a catch-all 503 response; original handler text remains under `historical-api/`. This is containment of unsafe historical behavior, not an authentication implementation. Direct client Firebase code remains, so keep credentials unset and do not use production projects. No live integrations, native apps, or production deployments were exercised.
