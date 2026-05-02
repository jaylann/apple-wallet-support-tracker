#!/usr/bin/env tsx
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), "..");
const DATA_PATH = resolve(ROOT, "data/wallet-support.json");
const SCHEMA_PATH = resolve(ROOT, "schema/wallet-support.schema.json");

const SLUG_RE = /^[a-z0-9-]+$/;
const URL_TIMEOUT_MS = 5_000;
const STRICT = process.argv.includes("--strict");

interface Source {
  url: string;
  accessedAt: string;
  type: "official" | "press" | "support" | "community";
  note?: string;
}

interface Row {
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

interface Dataset {
  $schemaVersion: string;
  lastModified: string;
  rows: Row[];
}

interface CheckResult {
  errors: string[];
  warnings: string[];
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function checkSchema(dataset: unknown): string[] {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = readJson<object>(SCHEMA_PATH);
  const validate = ajv.compile(schema);
  if (validate(dataset)) return [];
  return (validate.errors ?? []).map(
    (e) => `schema: ${e.instancePath || "/"} ${e.message ?? "invalid"}`,
  );
}

function checkDedupe(rows: Row[]): string[] {
  const seen = new Map<string, number>();
  const errors: string[] = [];
  rows.forEach((row, i) => {
    const key = row.brand.toLowerCase().trim();
    const prev = seen.get(key);
    if (prev !== undefined) {
      errors.push(`dedupe: duplicate brand "${row.brand}" at rows[${prev}] and rows[${i}]`);
    } else {
      seen.set(key, i);
    }
  });
  return errors;
}

function checkSlugs(rows: Row[]): string[] {
  return rows
    .map((row, i) =>
      row.articleSlug && !SLUG_RE.test(row.articleSlug)
        ? `slug: rows[${i}] ("${row.brand}") articleSlug "${row.articleSlug}" must match ${SLUG_RE}`
        : null,
    )
    .filter((e): e is string => e !== null);
}

function checkLastModified(dataset: Dataset): string[] {
  const maxLastChecked = dataset.rows.reduce(
    (acc, row) => (row.lastChecked > acc ? row.lastChecked : acc),
    "0000-01-01",
  );
  if (dataset.lastModified < maxLastChecked) {
    return [
      `lastModified: dataset.lastModified ${dataset.lastModified} is older than max rows[].lastChecked ${maxLastChecked}`,
    ];
  }
  return [];
}

function emptySourceCheck(rows: Row[]): { errors: string[]; warnings: string[] } {
  const empty = rows
    .map((row, i) => (row.sources.length === 0 ? `rows[${i}] "${row.brand}"` : null))
    .filter((e): e is string => e !== null);
  if (empty.length === 0) return { errors: [], warnings: [] };
  const message = `sources: ${empty.length} row(s) have empty sources[]: ${empty.slice(0, 5).join(", ")}${
    empty.length > 5 ? `, +${empty.length - 5} more` : ""
  }`;
  return STRICT ? { errors: [message], warnings: [] } : { errors: [], warnings: [message] };
}

async function headOk(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), URL_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (res.ok) return true;
    if (res.status === 405 || res.status === 403) {
      const getRes = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
      return getRes.ok;
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrls(rows: Row[]): Promise<string[]> {
  const checks = rows.flatMap((row, i) =>
    row.sources.map(async (src, j) => {
      const ok = await headOk(src.url);
      return ok ? null : `url: rows[${i}].sources[${j}] (${row.brand}) unreachable: ${src.url}`;
    }),
  );
  const results = await Promise.all(checks);
  return results.filter((e): e is string => e !== null);
}

async function main(): Promise<void> {
  const dataset = readJson<Dataset>(DATA_PATH);
  const result: CheckResult = { errors: [], warnings: [] };

  result.errors.push(...checkSchema(dataset));
  if (result.errors.length > 0) {
    report(result, dataset);
    process.exit(1);
  }

  result.errors.push(...checkDedupe(dataset.rows));
  result.errors.push(...checkSlugs(dataset.rows));
  result.errors.push(...checkLastModified(dataset));

  const sourceCheck = emptySourceCheck(dataset.rows);
  result.errors.push(...sourceCheck.errors);
  result.warnings.push(...sourceCheck.warnings);

  result.errors.push(...(await checkUrls(dataset.rows)));

  report(result, dataset);
  process.exit(result.errors.length > 0 ? 1 : 0);
}

function report(result: CheckResult, dataset: Dataset): void {
  const totalSources = dataset.rows.reduce((acc, row) => acc + row.sources.length, 0);
  console.log(`Dataset: ${dataset.rows.length} rows, ${totalSources} sources, lastModified=${dataset.lastModified}`);
  result.warnings.forEach((w) => console.warn(`WARN  ${w}`));
  result.errors.forEach((e) => console.error(`ERROR ${e}`));
  if (result.errors.length === 0) {
    console.log(`OK${STRICT ? " (strict)" : ""}: validation passed${result.warnings.length > 0 ? ` with ${result.warnings.length} warning(s)` : ""}.`);
  } else {
    console.error(`FAIL: ${result.errors.length} error(s).`);
  }
}

main().catch((err: unknown) => {
  console.error("Unexpected validation failure:", err);
  process.exit(1);
});
