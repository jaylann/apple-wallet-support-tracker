#!/usr/bin/env tsx
/**
 * Validates the per-brand layout (v2.0.0):
 *   - Each data/brands/<slug>/data.json conforms to wallet-support.schema.json
 *   - Each brand folder has both data.json AND research.md
 *   - data/index.json conforms to index.schema.json
 *   - index.brands matches the folder set exactly (no missing, no extras)
 *   - Slugs are unique and match parent directory name
 *   - Brand names are unique (case-insensitive)
 *   - All sources[].url respond 2xx (parallel HEAD with timeout)
 *   - lastModified >= max(brand lastChecked)
 *
 * --strict: also fails on rows with empty sources[].
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const BRANDS_DIR = path.join(ROOT, "data/brands");
const INDEX_PATH = path.join(ROOT, "data/index.json");
const BRAND_SCHEMA_PATH = path.join(ROOT, "schema/wallet-support.schema.json");
const INDEX_SCHEMA_PATH = path.join(ROOT, "schema/index.schema.json");

const URL_TIMEOUT_MS = 5_000;
const STRICT = process.argv.includes("--strict");

interface Source {
    url: string;
    accessedAt: string;
    type: "official" | "press" | "support" | "community";
    note?: string;
}

interface BrandData {
    $schemaVersion: string;
    slug: string;
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
    sources: Source[];
}

interface IndexEntry {
    slug: string;
    brand: string;
    category: string;
    region: string;
    lastChecked: string;
}

interface IndexFile {
    $schemaVersion: string;
    lastModified: string;
    brandCount: number;
    brands: IndexEntry[];
}

interface CheckResult {
    errors: string[];
    warnings: string[];
}

function readJson<T>(p: string): T {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

function ajvInstance(): Ajv {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    return ajv;
}

interface LoadedBrand {
    slug: string;
    folder: string;
    data: BrandData;
}

function loadBrandFolders(): { loaded: LoadedBrand[]; errors: string[] } {
    const errors: string[] = [];
    if (!fs.existsSync(BRANDS_DIR)) {
        return { loaded: [], errors: [`brands: ${BRANDS_DIR} does not exist`] };
    }
    const slugs = fs
        .readdirSync(BRANDS_DIR)
        .filter((name) =>
            fs.statSync(path.join(BRANDS_DIR, name)).isDirectory(),
        );
    const ajv = ajvInstance();
    const validate = ajv.compile(readJson<object>(BRAND_SCHEMA_PATH));
    const loaded: LoadedBrand[] = [];

    for (const slug of slugs) {
        const folder = path.join(BRANDS_DIR, slug);
        const dataPath = path.join(folder, "data.json");
        const researchPath = path.join(folder, "research.md");
        if (!fs.existsSync(dataPath)) {
            errors.push(`brand: ${slug}/ missing data.json`);
            continue;
        }
        if (!fs.existsSync(researchPath)) {
            errors.push(`brand: ${slug}/ missing research.md`);
        }
        const data = readJson<BrandData>(dataPath);
        if (!validate(data)) {
            for (const e of validate.errors ?? []) {
                errors.push(
                    `schema: ${slug}/data.json ${e.instancePath || "/"} ${e.message ?? "invalid"}`,
                );
            }
            continue;
        }
        if (data.slug !== slug) {
            errors.push(
                `slug: folder name "${slug}" does not match data.json slug "${data.slug}"`,
            );
        }
        loaded.push({ slug, folder, data });
    }
    return { loaded, errors };
}

function checkBrandUniqueness(loaded: LoadedBrand[]): string[] {
    const errors: string[] = [];
    const byBrand = new Map<string, string>();
    for (const { slug, data } of loaded) {
        const key = data.brand.toLowerCase().trim();
        const prev = byBrand.get(key);
        if (prev !== undefined) {
            errors.push(
                `dedupe: brand "${data.brand}" appears in both ${prev}/ and ${slug}/`,
            );
        } else {
            byBrand.set(key, slug);
        }
    }
    return errors;
}

function checkIndex(
    loaded: LoadedBrand[],
): { errors: string[]; index: IndexFile | null } {
    const errors: string[] = [];
    if (!fs.existsSync(INDEX_PATH)) {
        return { errors: [`index: ${INDEX_PATH} missing`], index: null };
    }
    const ajv = ajvInstance();
    const validate = ajv.compile(readJson<object>(INDEX_SCHEMA_PATH));
    const index = readJson<IndexFile>(INDEX_PATH);
    if (!validate(index)) {
        for (const e of validate.errors ?? []) {
            errors.push(
                `index: ${e.instancePath || "/"} ${e.message ?? "invalid"}`,
            );
        }
        return { errors, index: null };
    }
    if (index.brandCount !== index.brands.length) {
        errors.push(
            `index: brandCount=${index.brandCount} but brands.length=${index.brands.length}`,
        );
    }
    const folderSlugs = new Set(loaded.map((b) => b.slug));
    const indexSlugs = new Set(index.brands.map((b) => b.slug));
    for (const slug of folderSlugs)
        if (!indexSlugs.has(slug))
            errors.push(`index: missing entry for folder ${slug}/`);
    for (const slug of indexSlugs)
        if (!folderSlugs.has(slug))
            errors.push(`index: entry "${slug}" has no matching folder`);

    const byFolder = new Map(loaded.map((b) => [b.slug, b.data]));
    for (const entry of index.brands) {
        const data = byFolder.get(entry.slug);
        if (!data) continue;
        if (entry.brand !== data.brand)
            errors.push(`index: ${entry.slug} brand mismatch`);
        if (entry.category !== data.category)
            errors.push(`index: ${entry.slug} category mismatch`);
        if (entry.region !== data.region)
            errors.push(`index: ${entry.slug} region mismatch`);
        if (entry.lastChecked !== data.lastChecked)
            errors.push(`index: ${entry.slug} lastChecked mismatch`);
    }

    const maxLastChecked = loaded.reduce(
        (acc, b) => (b.data.lastChecked > acc ? b.data.lastChecked : acc),
        "0000-01-01",
    );
    if (index.lastModified < maxLastChecked) {
        errors.push(
            `index: lastModified ${index.lastModified} older than max brand lastChecked ${maxLastChecked}`,
        );
    }
    return { errors, index };
}

function emptySourceCheck(
    loaded: LoadedBrand[],
): { errors: string[]; warnings: string[] } {
    const empty = loaded
        .filter((b) => b.data.sources.length === 0)
        .map((b) => b.slug);
    if (empty.length === 0) return { errors: [], warnings: [] };
    const message = `sources: ${empty.length} brand(s) have empty sources[]: ${empty.slice(0, 5).join(", ")}${empty.length > 5 ? `, +${empty.length - 5} more` : ""}`;
    return STRICT
        ? { errors: [message], warnings: [] }
        : { errors: [], warnings: [message] };
}

async function headOk(url: string): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            signal: controller.signal,
        });
        if (res.ok) return true;
        if (res.status === 405 || res.status === 403) {
            const getRes = await fetch(url, {
                method: "GET",
                redirect: "follow",
                signal: controller.signal,
            });
            return getRes.ok;
        }
        return false;
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
}

async function checkUrls(loaded: LoadedBrand[]): Promise<string[]> {
    const checks = loaded.flatMap((b) =>
        b.data.sources.map(async (src, j) => {
            const ok = await headOk(src.url);
            return ok
                ? null
                : `url: ${b.slug}/data.json sources[${j}] unreachable: ${src.url}`;
        }),
    );
    const results = await Promise.all(checks);
    return results.filter((e): e is string => e !== null);
}

function report(result: CheckResult, brandCount: number, totalSources: number): void {
    console.log(
        `Dataset: ${brandCount} brands, ${totalSources} sources total.`,
    );
    result.warnings.forEach((w) => console.warn(`WARN  ${w}`));
    result.errors.forEach((e) => console.error(`ERROR ${e}`));
    if (result.errors.length === 0) {
        console.log(
            `OK${STRICT ? " (strict)" : ""}: validation passed${result.warnings.length > 0 ? ` with ${result.warnings.length} warning(s)` : ""}.`,
        );
    } else {
        console.error(`FAIL: ${result.errors.length} error(s).`);
    }
}

async function main(): Promise<void> {
    const result: CheckResult = { errors: [], warnings: [] };
    const { loaded, errors: loadErrors } = loadBrandFolders();
    result.errors.push(...loadErrors);
    if (result.errors.length > 0) {
        report(result, loaded.length, 0);
        process.exit(1);
    }

    result.errors.push(...checkBrandUniqueness(loaded));
    const indexCheck = checkIndex(loaded);
    result.errors.push(...indexCheck.errors);

    const sourceCheck = emptySourceCheck(loaded);
    result.errors.push(...sourceCheck.errors);
    result.warnings.push(...sourceCheck.warnings);

    result.errors.push(...(await checkUrls(loaded)));

    const totalSources = loaded.reduce((acc, b) => acc + b.data.sources.length, 0);
    report(result, loaded.length, totalSources);
    process.exit(result.errors.length > 0 ? 1 : 0);
}

main().catch((err: unknown) => {
    console.error("Unexpected validation failure:", err);
    process.exit(1);
});
