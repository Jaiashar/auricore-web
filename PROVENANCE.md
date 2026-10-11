# Source provenance

Published as a fresh source snapshot on October 11, 2026. Original repositories and their histories remain private. No history was rewritten.

## Jaiashar/auricore_website

Source revision: `fd341cc0e8304145b6af3dd9d2fcd576ef4f3ce2`

Recorded contributors (commit counts, not a measure of total project ownership):

- 75	Jai Ashar
- 11	Dev Ashar
- 6	Laura Gao

## Publication changes

Removed credential files, private environment files, local tooling, generated dependencies, and old deployment configuration. Added public setup documentation and empty environment examples. Mobile provider credentials were replaced with an authenticated gateway interface. Server configuration uses developer-supplied credentials. Existing third-party notices and asset rights remain applicable; no new blanket license is granted.

## Independent review follow-up, October 11, 2026

Archived the ten original API handlers as `.ts.txt` source under `historical-api/`, outside executable routing. Replaced the API surface with a dependency-free HTTP 503 catch-all for all supported methods. This contains missing authorization checks without representing them as repaired production business logic. Added offline regression checks and updated Next.js and its ESLint configuration to 15.5.27. Direct client Firebase operations remain historical source and require separate security design before reuse. Mobile and service snapshots are now private.
