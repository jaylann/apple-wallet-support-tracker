#!/usr/bin/env tsx
/**
 * Regenerates data/index.json from the folders under data/brands/.
 *
 * Use this after editing one or more `brands/<slug>/data.json` files
 * instead of editing `index.json` by hand. Idempotent: writing without
 * changes is a no-op.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const BRANDS_DIR = path.join(ROOT, "data/brands");
const INDEX_PATH = path.join(ROOT, "data/index.json");

interface BrandData {
    $schemaVersion: string;
    slug: string;
    brand: string;
    category: string;
    region: string;
    lastChecked: string;
}

interface IndexEntry {
    slug: string;
    brand: string;
    category: string;
    region: string;
    lastChecked: string;
}

function readBrand(slug: string): BrandData {
    const dataPath = path.join(BRANDS_DIR, slug, "data.json");
    if (!fs.existsSync(dataPath)) {
        throw new Error(`brand "${slug}" missing data.json at ${dataPath}`);
    }
    return JSON.parse(fs.readFileSync(dataPath, "utf-8")) as BrandData;
}

function main(): void {
    if (!fs.existsSync(BRANDS_DIR)) {
        console.error(`reindex: ${BRANDS_DIR} does not exist`);
        process.exit(1);
    }

    const slugs = fs
        .readdirSync(BRANDS_DIR)
        .filter((name) =>
            fs.statSync(path.join(BRANDS_DIR, name)).isDirectory(),
        )
        .sort();

    if (slugs.length === 0) {
        console.error(`reindex: no brand folders found under ${BRANDS_DIR}`);
        process.exit(1);
    }

    const entries: IndexEntry[] = [];
    let schemaVersion: string | null = null;
    for (const slug of slugs) {
        const data = readBrand(slug);
        if (data.slug !== slug) {
            console.error(
                `reindex: folder "${slug}" data.json declares slug "${data.slug}" — fix the data.json before reindexing.`,
            );
            process.exit(1);
        }
        if (schemaVersion === null) schemaVersion = data.$schemaVersion;
        else if (schemaVersion !== data.$schemaVersion) {
            console.error(
                `reindex: schema version mismatch — ${slug} declares ${data.$schemaVersion}, expected ${schemaVersion}`,
            );
            process.exit(1);
        }
        entries.push({
            slug: data.slug,
            brand: data.brand,
            category: data.category,
            region: data.region,
            lastChecked: data.lastChecked,
        });
    }

    const lastModified = entries.reduce(
        (acc, e) => (e.lastChecked > acc ? e.lastChecked : acc),
        "0000-01-01",
    );

    const index = {
        $schemaVersion: schemaVersion,
        lastModified,
        brandCount: entries.length,
        brands: entries,
    };

    const next = JSON.stringify(index, null, 2) + "\n";
    const prev = fs.existsSync(INDEX_PATH)
        ? fs.readFileSync(INDEX_PATH, "utf-8")
        : "";

    if (prev === next) {
        console.log(`reindex: no changes (${entries.length} brands).`);
        return;
    }
    fs.writeFileSync(INDEX_PATH, next);
    console.log(
        `reindex: wrote ${entries.length} brands, lastModified=${lastModified}`,
    );
}

main();
