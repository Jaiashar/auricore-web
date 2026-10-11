# Auricore

**Identify luxury goods and understand their market value, starting with a photo.**

Auricore helps a user answer “What is this item, and what is it worth?” The web application accepts a photo or manual description, identifies the product, finds comparable listings, and presents market-price research. The broader product connects that valuation workflow to inventory and borrower/lender application intake.

I contributed across the web and mobile applications and built product-data infrastructure behind the catalog. This repository contains the web experience, built with **Next.js, TypeScript and Firebase**.

## The user journey

1. **Describe an item.** Upload a photo or enter its details manually.
2. **Identify the product.** Review and refine the application's proposed item match.
3. **Research its value.** Gather comparable listings and display pricing research with progress and results views.
4. **Continue into the marketplace workflow.** The broader application includes borrower and lender intake backed by Firebase.

The engineering work connects image handling, model-assisted identification, external product search, and persistent application state. The repository shows those implementations; valuation accuracy and a live lending service are not established by this source snapshot.

This is a public source snapshot of an existing application. It preserves application source while excluding the original Git history, service-account credentials, local IDE files, and deployment configuration. It has not been deployed or verified against live services as part of this preparation.

[Mobile application](https://github.com/Jaiashar/auricore-mobile) · [Product ingestion](https://github.com/Jaiashar/luxury-product-ingestion) · [Product canonicalization](https://github.com/Jaiashar/product-canonicalization) · [Supporting services](https://github.com/Jaiashar/auricore-services)

## Code guide

| Flow | Source |
| --- | --- |
| Photo or manual item intake | [app/price](app/price), [PhotoUploader](components/sections/PhotoUploader.tsx), [ManualEntryForm](components/sections/ManualEntryForm.tsx) |
| Item identification and matching | [identify-item](app/api/identify-item/route.ts), [visionMatchFinder](utils/visionMatchFinder.js) |
| Market-price research and valuation | [search-pricing](app/api/search-pricing/route.ts), [claudePricingService](utils/claudePricingService.js) |
| Pricing progress and results | [DetailedPricingProgress](components/DetailedPricingProgress.tsx), [EnhancedPricingDisplay](components/EnhancedPricingDisplay.tsx) |
| Borrower and lender applications | [create-borrower](app/api/create-borrower/route.ts), [create-lender](app/api/create-lender/route.ts), [lenders](app/lenders) |

## How the pieces fit

```mermaid
flowchart LR
  A[Photo or manual entry] --> B[Item identification]
  B --> C[Select and refine item match]
  C --> D[Market-price research]
  D --> E[Valuation results]
  E --> F[Application intake]
  F --> G[Firebase persistence]
```

The implementation includes image processing with Sharp, model calls through Anthropic and OpenAI integrations, search through SerpAPI, Firebase persistence, and email integration. These integrations require configuration and may incur usage charges when invoked.

## Run locally

```sh
npm ci
cp .env.example .env.local
# Configure your own services before invoking application flows.
npm run dev
```

The example environment file lists variables referenced by the source. No original credentials or customer database exports are included. Use isolated development projects and test recipients; application routes can write records and send email.

## Project context

Jai Ashar is the largest contributor in the source repository's recorded commit history. The original history also includes contributions from Dev Ashar and Laura Gao. This snapshot is a portfolio presentation of that collaborative project, not a claim of sole authorship.

Historical dependencies and integrations remain as found in the source. This is not a maintained production starter or a statement of valuation accuracy. No new license or third-party asset rights are granted by this publication.

## Validation

TypeScript checking (`npx tsc --noEmit`) passes. The published source history passes secret scanning. Live integrations were not exercised. See [PROVENANCE.md](PROVENANCE.md) for the source revision and publication changes.
