# WWFL project video release

Final public acceptance: November 8, 2026, 16:55 UTC. MarketList, AeroCAD and FloorOS are published through Lunchpail at `/projects/marketlist`, `/projects/aerocad` and `/projects/flooros`. Their real main/all-video playback, seeking, captions, marketing/application links, screenshots, credit switching and lifecycle labels passed in a signed-out browser. The public project list contains exactly these three targets.

Application revision `4d3dcea7775174576cb49cc8e4c342c907f082e9` runs as image `sha256:59b47b667b3395554900f89a27358d218faa11f8dfb9b2b36a1e1c6b0b0293a1`. Its narrow HTTPS optimizer allowlist accepts the owned public Lunchpail image routes; unrelated hosts, HTTP and private paths were refused by the real Next matcher. Actual optimized PNG and browser-negotiated AVIF returned 200 and decoded. The final browser pass found no broken images on WWFL home, Projects, blog or the three project details.

The resource component renders real stored project data, explicit main selection, every titled selected video, captions and attribution. Fabricated client names, metrics, testimonials and sample enhancements were removed. Both authenticated CMS project receivers validate manifests before writes. The reused status SQL parameter is explicitly typed. Upserts invalidate caches, and list-cache identity includes the real database visibility version so a retained stale Redis entry cannot republish hidden data.

Verification:

- Local full types and production build passed; final target builds also passed with type errors enforced.
- Three resource-contract tests passed. Real isolated PostgreSQL CMS acceptance passed create/readback, malformed-manifest rejection, withdrawal and republish. The actual gallery played and sought both clips. A real PostgreSQL/Redis test proved stale list-key rejection.
- The existing complete Jest suite remains red: 31 passed and 42 failed; unchanged baseline source with the same patched dependencies reported 26 passed and 47 failed. No candidate-only named failure groups were found. These are not represented as passing tests or whole-application readiness.
- Production dependency audit: zero high/critical and twelve low/moderate. Sharp 0.35.5 remains patched. Its prebuilt and Wasm paths initially could not execute on the masked virtual CPU. The older compatible Sharp was rejected for high vulnerabilities; neither it nor the failed custom-native experiment was deployed.
- After the scoped operator instruction, VM302 was gracefully stopped, changed from kvm64 to persistent x86-64-v2-AES and started. Only the CPU key changed; the host supports its requirements. All nine original containers resumed, all seventy uploads matched, and WWFL database readiness/Listmonk health returned 200. Actual candidate images encoded/decoded JPEG, PNG and WebP on Node 22.23.4 and Sharp 0.35.5.

Both app-only replacements preserved every existing post/project record, all seventy upload hashes, active environment values, mounts and database/Redis/nginx container identities. There are thirty retained posts and twenty-six retained previous projects plus the three intended new projects: twenty-nine projects total. No nginx reload or credential change was needed. The verified image is tagged for normal Compose recovery. The final image fixed the additionally observed optimizer allowlist failure rather than bypassing optimization.

Recovery and terminal evidence: `/var/tmp/wwfl-project-videos-backup.DSsRV5`, with failed and previous successful logs retained separately. Final build status is BUILT_AND_NATIVE_CHECKED; activation status is SUCCESS. Permanent final release directory: `/opt/docker/personal-website/wwfl-recovery-release-project-video-z9571f8e`. VM CPU rollback: `/var/tmp/wwfl-cpu-correction-20261108.j0gg73xp` on the Proxmox host. The actual VM302 restart is verified; no host/fleet reboot is claimed.

The [canonical release record](https://github.com/Bizzo1975/me-manager/blob/master/docs/reviews/PROJECT-VIDEO-RELEASE-2026-11-07.md) contains all six placements, exact immutable media and known limits. Five reviewed CMS blog drafts remain unpublished.
