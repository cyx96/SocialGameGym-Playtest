"""Layer one licensed 愿 counter correction over an exact, unchanged 2.2 archive.

Uses only the pinned existing Python environment. No network or installed-font writes.
"""
import argparse
from contextlib import contextmanager
import copy
import hashlib
import importlib.metadata
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import zipfile

from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

BASE_SHA = "c51d2ae3894de5c75fc08fe0e9fb2280bcdd48fc6b8a4f6daa05caf84498cac0"
BASE_FONTS = {
    "Text": "8a41601c73bc5e22c5174c53d9445ffbffc7418c93976197b58c52ecf745c891",
    "Display": "9d8d319abd00aaac21efab70c8ecedbccf70c7b8bafbb19cc733676629061d2d",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def glyph_bytes(font):
    return {n: font["glyf"][n].compile(font["glyf"]) for n in font.getGlyphOrder()}


def contour_areas(glyph):
    """Exact signed polygon areas; the source ribbon compiler emits line segments."""
    result, start = [], 0
    for end in glyph.endPtsOfContours:
        points = list(glyph.coordinates[start:end + 1])
        result.append(sum(a[0] * b[1] - b[0] * a[1]
                          for a, b in zip(points, points[1:] + points[:1])) / 2)
        start = end + 1
    return result


def extend_to_wall(lines, bar, wall):
    """Extend only a named bar's final station to its explicit enclosing wall axis."""
    result = copy.deepcopy(lines)
    a, b = lines[wall][-2:]
    c, d = lines[bar][-2:]
    vx, vy = d[0] - c[0], d[1] - c[1]
    wx, wy = b[0] - a[0], b[1] - a[1]
    den = vx * wy - vy * wx
    assert abs(den) > 1e-9
    qx, qy = a[0] - d[0], a[1] - d[1]
    t = (qx * wy - qy * wx) / den
    u = (qx * vy - qy * vx) / den
    assert 0 < t < 0.5 and 0 < u < 1, "Bounded forward extension inside wall required"
    target = (d[0] + t * vx, d[1] + t * vy)
    result[bar][-1] = target
    assert [i for i in range(len(lines)) if lines[i] != result[i]] == [bar]
    return result, {"bar": bar, "wall": wall, "oldEndpoint": d, "newEndpoint": target,
                    "extension": ((target[0] - d[0]) ** 2 + (target[1] - d[1]) ** 2) ** 0.5}


def check_source():
    source = Path(__file__).resolve().parent
    manifest = json.loads((source / "SOURCE-MANIFEST.json").read_text())
    for name, digest in manifest["files"].items():
        assert sha(source / name) == digest, "Correction source changed: " + name
    assert manifest["baseArchive"]["sha256"] == BASE_SHA
    return manifest


@contextmanager
def reconstructed_base(archive_path, parent):
    assert sha(archive_path) == BASE_SHA, "Wrong base archive"
    with tempfile.TemporaryDirectory(prefix="base-replay-", dir=parent) as temp:
        source = Path(temp) / "source"
        with zipfile.ZipFile(archive_path) as archive:
            assert all(not Path(n).is_absolute() and ".." not in Path(n).parts
                       for n in archive.namelist())
            archive.extractall(source)
        manifest = json.loads((source / "MANIFEST.json").read_text())
        for name, digest in manifest["files"].items():
            assert sha(source / name) == digest, name
        base = Path(temp) / "base-2.2"
        replay = subprocess.run([sys.executable, str(source / "rebuild.py"), "--out", str(base)],
                                check=True, capture_output=True, text=True)
        yield source, base, replay.stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-archive", type=Path,
                        default=Path(__file__).resolve().parents[2] / "source-snapshot.zip")
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    overlay = check_source()
    assert sha(args.base_archive) == BASE_SHA, "Wrong base archive; preserve original bytes"
    assert not args.out.exists(), "Choose a new output directory"
    expected = {"fonttools": "4.67.0", "skia-pathops": "0.9.2", "brotli": "1.2.1"}
    actual = {p: importlib.metadata.version(p) for p in expected}
    assert actual == expected, actual
    out = args.out.resolve()
    (out / "fonts").mkdir(parents=True)
    with reconstructed_base(args.base_archive, out) as (source, base, replay_log):
        (out / "base-replay.log").write_text(replay_log)
        sys.path.insert(0, str(source / "compiler"))
        from product_fonts import median_lines, optical_widths, ribbon_union
        from hanzi_contacts import restore_contacts, intersects

        row = json.loads((source / "glyphs-used.json").read_text())["glyphs"]["愿"]
        structures = json.loads((source / "structures.json").read_text())
        lines = median_lines(row["medians"])
        thinning = min(1.5, max(0, len(lines) - 12) * .16)
        widths = [optical_widths(lines, b - thinning, style)
                  for style, b in [("Text", 6.6), ("Display", 7.8)]]
        original, prior = restore_contacts(lines, row["contacts"] + row["gridContacts"],
                                           ribbon_union, widths, grid_pairs=row["gridContacts"])
        repaired, repair = extend_to_wall(original, bar=5, wall=4)
        # Explicit source-local semantic permission; not a nearest-stroke heuristic.
        # Source medians 3/4/5/6 form the enclosed 日-shaped core of 原/白 in 愿.
        # The historical IDS resolver stops at an 8-vs-9-stroke 泉 mismatch.
        assert len(lines) == 14 and row["gridContacts"] == []
        allowed_pair = (4, 5)
        reports = {}
        for style, width in zip(["Text", "Display"], widths):
            seed = base / "fonts" / f"SGGPaperUI-{style}.woff2"
            assert sha(seed) == BASE_FONTS[style], "Base replay not byte-identical to 2.2"
            font = TTFont(seed, recalcTimestamp=False)
            before = glyph_bytes(font)
            name = font.getBestCmap()[ord("愿")]
            pen = TTGlyphPen(None)
            ribbon_union(original, width).draw(pen)
            assert pen.glyph().compile(font["glyf"]) == before[name], "Source must reproduce original 愿"
            old_shapes = [ribbon_union([line], width[i]) for i, line in enumerate(original)]
            new_shapes = [ribbon_union([line], width[i]) for i, line in enumerate(repaired)]
            def edges(shapes):
                return {(j, i) for i in range(len(shapes)) for j in range(i)
                        if intersects(shapes[i], shapes[j])}
            old_edges, new_edges = edges(old_shapes), edges(new_shapes)
            assert new_edges - old_edges == {allowed_pair}
            assert not old_edges - new_edges, "Lost established join"
            permitted = old_edges | {tuple(sorted(p)) for p in row["contacts"] + row["gridContacts"]} | {allowed_pair}
            assert not new_edges - permitted, "New third-stroke collision"
            metrics, order, cmap = copy.deepcopy(font["hmtx"].metrics), font.getGlyphOrder(), font.getBestCmap()
            old_areas = contour_areas(font["glyf"][name])
            pen = TTGlyphPen(None)
            ribbon_union(repaired, width).draw(pen)
            font["glyf"][name] = pen.glyph()
            for key, value in {3: f"SGG Paper UI-{style}-product-2.3",
                               5: "Version 2.300; 愿 separated-counter correction"}.items():
                font["name"].names = [n for n in font["name"].names if n.nameID != key]
                font["name"].setName(value, key, 3, 1, 0x409)
            target = out / "fonts" / seed.name
            font.save(target)
            assert sha(target) == overlay["outputs"][style], "Unexpected serialized output"
            actual_font = TTFont(target, recalcTimestamp=False)
            after = glyph_bytes(actual_font)
            changed = [n for n in order if before[n] != after[n]]
            assert changed == [name]
            assert actual_font["hmtx"].metrics == metrics
            assert actual_font.getGlyphOrder() == order and actual_font.getBestCmap() == cmap
            assert len(cmap) == 9702 and len(order) == 9703
            assert "COLR" not in actual_font and "CPAL" not in actual_font
            seed_font = TTFont(seed, recalcTimestamp=False)
            for tag in ["hmtx", "hhea", "OS/2", "cmap"]:
                assert seed_font[tag].compile(seed_font) == actual_font[tag].compile(actual_font), tag
            old_glyph, new_glyph = seed_font["glyf"][name], actual_font["glyf"][name]
            assert all(getattr(old_glyph, p) == getattr(new_glyph, p)
                       for p in ["xMin", "xMax", "yMin", "yMax"])
            new_areas = contour_areas(new_glyph)
            # This compiler's serialized contours are positive outer solids and
            # negative counters (verified against the exact original glyph).
            assert sum(x < 0 for x in old_areas) == 1
            assert sum(x < 0 for x in new_areas) == 2
            assert sum(x > 0 for x in new_areas) == sum(x > 0 for x in old_areas)
            reports[style] = {"inputSha256": sha(seed), "outputSha256": sha(target),
                "sourceReproducesOriginalGlyph": True, "allGlyphsCompared": len(order),
                "changedGlyphNames": changed, "unchangedGlyphs": len(order) - 1,
                "cmapUnchanged": True, "glyphOrderUnchanged": True, "allHmtxUnchanged": True,
                "fontwideVerticalMetricsUnchanged": True, "targetBoundsUnchanged": True,
                "newContacts": sorted(new_edges - old_edges), "lostContacts": [],
                "unpermittedCollisions": [], "oldContourSignedAreas": old_areas,
                "newContourSignedAreas": new_areas, "nameIdsChanged": [3, 5]}
        shutil.copyfile(base / "fonts/SGGPaperLogo.woff2", out / "fonts/SGGPaperLogo.woff2")
        assert sha(out / "fonts/SGGPaperLogo.woff2") == "b441184c100b67e0812c45ccb4fc69f7c0a36b59ad9f6277cdf1a009553b186e"
        for name in ["ARPHICPL.TXT", "GPL", "LGPL", "MAKEMEAHANZI-COPYING"]:
            shutil.copyfile(source / name, out / name)
        write(out / "source-local-correction.json", {"finding": "FONT-COUNTER-001", "character": "愿",
            "baseArchiveSha256": BASE_SHA, "sourceRecord": row,
            "structureRecords": {c: structures[c] for c in ["愿", "原", "泉", "白", "日"]},
            "normalizedOriginalLines": original, "correctedLines": repaired,
            "originalWidths": dict(zip(["Text", "Display"], widths)), "thinning": thinning,
            "priorContactResult": prior, "explicitAdditionalPermission": allowed_pair, "repair": repair,
            "sourceChain": "unchanged base archive > licensed glyphs-used.json 愿 > median_lines > original thinning/optical widths > restore_contacts > explicit local bar5/wall4 join"})
        write(out / "comparison.json", reports)
        write(out / "environment.json", {"python": sys.version, "packages": actual,
                                         "command": sys.argv, "baseArchiveSha256": BASE_SHA})
    print(json.dumps(reports, ensure_ascii=False))


if __name__ == "__main__":
    main()
