# SGG Paper UI 2.3: 愿 separated-counter correction

This source layer reproduces the current Text/Display fonts from the immutable 2.2 base archive and one licensed, source-local correction. It preserves the 9702-character repertoire, other9702 actual glyphs, cmap/order/all metrics, 图/复 optical corrections and Logo. It is not a generic glyph/repertoire extension command.

Use an existing Python environment with exactly FontTools4.67.0, skia-pathops0.9.2 and Brotli1.2.1. From the repository root, choose a new output directory:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 design/system/fonts/corrections/type-common-2.3/rebuild.py --out work/font-rebuild/type-common-2.3-r1
PYTHONDONTWRITEBYTECODE=1 python3 design/system/fonts/corrections/type-common-2.3/verify_candidate.py --candidate work/font-rebuild/type-common-2.3-r1 --report work/font-rebuild/type-common-2.3-r1-check.json
```

The default base path is `design/system/fonts/source-snapshot.zip` (located relative to these source files); `--base-archive <path>` may select another byte-identical copy. Its SHA256 must be `c51d2ae3894de5c75fc08fe0e9fb2280bcdd48fc6b8a4f6daa05caf84498cac0`. Keep it unchanged. Replaying only that ZIP produces2.2. The current2.3 entry additionally checks this layer's SOURCE-MANIFEST and output hashes. It verifies every archived MANIFEST member, actually replays the2.2 source, verifies those font inputs byte-for-byte, then applies the correction. Temporary full base inputs are created under the new output and removed; no additional nested ZIP or whole-glyph source copy is required. Neither command writes installed fonts or production source.

The verifier independently reconstructs2.2 from the same base by default, then compares every serialized glyph and metric against the supplied candidate. An explicit `--base-fonts <directory>` can reuse an already reconstructed2.2 font directory. Required checks: onlyuni613F differs across9703 actual glyphs, remaining9702 identical, all cmap/order/hmtx/OS2/hhea unchanged, Logo bytes unchanged, zero removed silhouette area, unchanged outer contours, and one connected counter split into two. Rebuild also freezes initial stroke permissions and checks only new contact(4,5), no lost joins/unpermitted contacts, exact prior愿 reconstruction and unchanged target bounds. Glyph changes and name IDs3/5 are the only authored font differences; table checksums/storage offsets follow serialization.

## Source and license chain

Base ZIP/MANIFEST → glyphs-used.json/schema2/愿, pinned Make Me a Hanzi graphics `bddc96d41bef78427ed0e034e9f7e31d71fd1b92` under the existing Arphic Public License → archived median normalization,14-stroke thinning0.32, optical widths and contact restoration → explicit 愿 bar5-to-wall4 endpoint extension. Source-local original/corrected stations, widths, contact permissions and structure metadata are emitted in `source-local-correction.json`. The unchanged archived source contains original ARPHICPL.TXT, MAKEMEAHANZI-COPYING, GPL/LGPL and dictionary metadata provenance; all notices are also copied to each new output. Latin/R8/Logo retain their original source and byte identities. No source is traced from screenshots or re-licensed.

The conservative historical IDS resolver stops because 原 assigns eight strokes to 泉 while 泉 declares nine. Existing 愿.gridContacts is empty. Original normalized strokes3/4/5/6 form the enclosed 日-shaped core; middle bar5 ends before right wall4. This local layer grants only that semantic pair and extends the existing bar's terminal ray to the existing wall segment, preserving all widths and other stations. It does not generalize the mismatched IDS mapping or silently widen shared collision permissions.

## Finite review and remaining limits

The current correction changes only 愿 and name IDs3/5; all other outlines, metrics, cmap/order and Logo remain unchanged. FONT-FINISH-001 (田 finish) remains a nonblocking minor. Mechanical equality is not a whole-repertoire aesthetic review and does not establish physical-device or production-consumer acceptance.

Current adopted hashes and source pointer are registered in `design/system/fonts/coverage.json`; source ownership and workflow remain in `.agents/skill-resources/font/WORKFLOW.md`. Adoption of newly changed fonts follows that workflow and separate authorization.
