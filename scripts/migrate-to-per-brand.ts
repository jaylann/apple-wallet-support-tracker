#!/usr/bin/env tsx
/**
 * One-off migration from the v1.0.0 single-file layout to v2.0.0
 * per-brand folders. Reads data/wallet-support.json and emits:
 *   data/index.json
 *   data/brands/<slug>/data.json
 *   data/brands/<slug>/research.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const SOURCE = path.join(ROOT, "data/wallet-support.json");
const BRANDS_DIR = path.join(ROOT, "data/brands");
const INDEX_PATH = path.join(ROOT, "data/index.json");
const SCHEMA_VERSION = "2.0.0";

interface OldRow {
    brand: string;
    category: string;
    region: string;
    nativePkpass: "full" | "partial" | "none";
    iosLiveActivity: boolean;
    watchSync: boolean;
    knownIssues?: string[];
    lastChecked: string;
    articleSlug?: string;
    notes?: string;
    sources: unknown[];
}

interface OldDataset {
    rows: OldRow[];
    lastModified: string;
}

function slugify(brand: string): string {
    return brand
        .toLowerCase()
        .replace(/[ä]/g, "ae")
        .replace(/[ö]/g, "oe")
        .replace(/[ü]/g, "ue")
        .replace(/[ß]/g, "ss")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function renderResearchMd(row: OldRow, slug: string): string {
    const today = row.lastChecked;
    const issues =
        row.knownIssues && row.knownIssues.length > 0
            ? row.knownIssues.map((i) => `- ${i}`).join("\n")
            : "_none recorded_";
    return `# ${row.brand}

**Slug:** \`${slug}\`
**Category:** ${row.category}
**Region:** ${row.region}
**Last researched:** ${today} (bootstrap)

## Current finding

- Native pkpass: **${row.nativePkpass}**
- iOS Live Activity: ${row.iosLiveActivity ? "yes" : "no"}
- Apple Watch sync: ${row.watchSync ? "yes" : "no"}

${row.notes ? `### Notes\n\n${row.notes}\n` : ""}
### Known issues

${issues}

## Sources cited

| URL | Type | Accessed | Note |
|---|---|---|---|
| _none yet — bootstrapped from initial portfolio dataset; first sweep populates citations_ | | | |

## Pages reviewed (not cited)

_To be populated by sweeps and issue fixes._

## History

- **${today}** — Bootstrapped from \`src/data/wallet-support-tracker.ts\` in jaylann/justin-lanfermann-portfolio. Facts not externally verified; awaiting first monthly sweep.
`;
}

interface IndexEntry {
    slug: string;
    brand: string;
    category: string;
    region: string;
    lastChecked: string;
}

function main(): void {
    const old = JSON.parse(fs.readFileSync(SOURCE, "utf-8")) as OldDataset;
    fs.mkdirSync(BRANDS_DIR, { recursive: true });

    const slugs = new Map<string, string>();
    const indexEntries: IndexEntry[] = [];

    for (const row of old.rows) {
        let slug = slugify(row.brand);
        let suffix = 1;
        while (slugs.has(slug)) {
            slug = `${slugify(row.brand)}-${++suffix}`;
        }
        slugs.set(slug, row.brand);

        const dir = path.join(BRANDS_DIR, slug);
        fs.mkdirSync(dir, { recursive: true });

        const data = {
            $schemaVersion: SCHEMA_VERSION,
            slug,
            brand: row.brand,
            category: row.category,
            region: row.region,
            nativePkpass: row.nativePkpass,
            iosLiveActivity: row.iosLiveActivity,
            watchSync: row.watchSync,
            ...(row.knownIssues ? { knownIssues: row.knownIssues } : {}),
            lastChecked: row.lastChecked,
            ...(row.articleSlug ? { articleSlug: row.articleSlug } : {}),
            ...(row.notes ? { notes: row.notes } : {}),
            sources: row.sources,
        };

        fs.writeFileSync(
            path.join(dir, "data.json"),
            JSON.stringify(data, null, 2) + "\n",
        );
        fs.writeFileSync(path.join(dir, "research.md"), renderResearchMd(row, slug));

        indexEntries.push({
            slug,
            brand: row.brand,
            category: row.category,
            region: row.region,
            lastChecked: row.lastChecked,
        });
    }

    indexEntries.sort((a, b) => a.slug.localeCompare(b.slug));

    const index = {
        $schemaVersion: SCHEMA_VERSION,
        lastModified: old.lastModified,
        brandCount: indexEntries.length,
        brands: indexEntries,
    };

    fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n");

    console.log(`Migrated ${indexEntries.length} brands to per-brand layout.`);
    console.log(`  Index: ${path.relative(ROOT, INDEX_PATH)}`);
    console.log(`  Brands: ${path.relative(ROOT, BRANDS_DIR)}/`);
}

main();
