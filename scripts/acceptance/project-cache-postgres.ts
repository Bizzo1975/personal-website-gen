import assert from "node:assert/strict";
import Redis from "ioredis";
import CacheService from "../../src/lib/cache";
import { ProjectService } from "../../src/lib/services/project-service";
import { query } from "../../src/lib/db";

const database = new URL(process.env.DATABASE_URL || "http://invalid");
assert.equal(database.hostname, "127.0.0.1");
assert.equal(database.pathname, "/wwfl_project_video_acceptance");
assert.equal(process.env.REDIS_HOST, "127.0.0.1");
assert.equal(process.env.REDIS_PORT, "55446");
const redis = new Redis("redis://127.0.0.1:55446");
const slug = "isolated-video-acceptance";
async function main() {
  await redis.ping();
  await query("UPDATE projects SET status='published', updated_at=clock_timestamp() WHERE slug=$1", [slug]);
  await CacheService.getInstance().invalidatePattern("isolated-cache-warmup:*");
  await new Promise(resolve => setTimeout(resolve, 250));
  const keysBefore = new Set(await redis.keys("projects:list:*"));
  const before = await ProjectService.getAllProjects();
  assert(before.some(project => project.slug === slug));
  const keys = (await redis.keys("projects:list:*")).filter(key => !keysBefore.has(key));
  assert.equal(keys.length, 1, "The real Redis must actually contain the first cached list");
  const oldKey = keys[0];
  // Deliberately omit invalidation in this isolated fixture to exercise recovery.
  await query("UPDATE projects SET status='draft', updated_at=clock_timestamp() WHERE slug=$1", [slug]);
  assert((JSON.parse((await redis.get(oldKey))!) as { slug: string }[]).some(project => project.slug === slug));
  const after = await ProjectService.getAllProjects();
  assert(!after.some(project => project.slug === slug), "An old Redis snapshot must not resurrect a hidden project");
  assert(await redis.exists(oldKey), "The test must leave the old cache present rather than masking the stale-key scenario");
  await query("UPDATE projects SET status='published', updated_at=clock_timestamp() WHERE slug=$1", [slug]);
  console.log(JSON.stringify({ realPostgresAndRedis: "passed", actualSourceCachePopulated: "passed", missedInvalidationRecovery: "passed", stalePublishedSnapshotIgnored: "passed" }));
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await redis.quit(); process.exit(process.exitCode || 0); });
