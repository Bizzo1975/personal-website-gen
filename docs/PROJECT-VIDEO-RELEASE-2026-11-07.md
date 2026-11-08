# WWFL project video release

The project detail page renders Lunchpail's reviewed marketing URL, explicit main video, every titled selected video, captions, music attribution and actual lifecycle label. The Projects card identifies its details, marketing and videos destination. Fabricated client names, metrics, testimonials and sample results have been removed from the candidate project presentation.

Both authenticated CMS project receivers validate the new video manifest before database writes. Existing project content without a manifest remains supported.

Verification performed before rollout:

- Full TypeScript check passed, including the final receiver validation.
- Production build passed with TypeScript errors enforced. Its build-time dynamic-page lookup had no database configured; this is not evidence of production database behavior.
- Three new resource-contract tests passed. The complete existing suite reported 31 passed and 42 failed tests across 17 files. An isolated comparison using unchanged baseline source and the same patched dependencies reported 26 passed and 47 failed tests. No candidate-only named failure groups were found. These legacy failures remain failures; this release does not declare the entire existing suite green.
- Production dependency audit has zero high/critical findings and twelve low/moderate findings. Compatible updates and bounded overrides address the original critical/high findings. No forced major framework upgrade was applied.
- Sharp 0.35.5 is retained as the patched release. The target build compiled and passed type checking, then failed loading Sharp: VM302's `kvm64` model lacks x86-64-v2, and its WebAssembly fallback also cannot execute on this virtual CPU. An isolated Sharp 0.34.5 codec test passed, but its high-severity dependency findings disqualified that downgrade. A custom native-build experiment also did not pass. Neither experiment was deployed; tracked source is restored to the pushed patched release.
- The physical host exposes the required SSE4.1/SSE4.2/SSSE3/POPCNT/CX16/AES features. Separate approval is pending to change only VM302 to `x86-64-v2-AES` and gracefully shut down/start it once. No CPU change or restart has occurred. The target image must still encode/decode JPEG, PNG and WebP before cutover.
- Real isolated PostgreSQL CMS acceptance passed create/readback, malformed-manifest rejection, withdrawal and republish. The actual gallery played and sought both selected clips. Real PostgreSQL/Redis source acceptance also proved the database-versioned list cache ignores a retained stale published entry.

The existing uploaded-media bind mount, database, settings and credentials must remain intact. Container image and private configuration/database rollback materials must be retained. Production rollout, live browser playback and post-change content/image comparison remain pending. The previous app image is still running. All seventy upload hashes and the original filesystem identity were preserved during the separately approved online disk expansion from 20 to 48 GiB. Recovery materials and the failed target-build log are under `/var/tmp/wwfl-project-videos-backup.DSsRV5`.

The current live receiver's three failed target-project creations were traced to `inconsistent types deduced for parameter $10`. The explicit casts and cache repair are implemented and tested in the candidate, but not deployed. These failures are not recorded as created or published projects. No production reboot has been exercised.

See the [canonical Lunchpail release record](https://github.com/Bizzo1975/me-manager/blob/master/docs/reviews/PROJECT-VIDEO-RELEASE-2026-11-07.md) for the current six-placement matrix and remaining approvals.
