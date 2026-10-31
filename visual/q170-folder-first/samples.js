/* Stable entry samples, shared by the static theme fixtures. */
(() => {
	const { games, themes } = CatalogStudy,
		key = "sgg-q170-entry-samples";
	const byId = new Map(games.map((g) => [g.id, g]));
	function hue(hex) {
		const [r, g, b] = hex
				.slice(1)
				.match(/../g)
				.map((x) => parseInt(x, 16) / 255),
			max = Math.max(r, g, b),
			min = Math.min(r, g, b),
			d = max - min;
		if (!d) return null;
		let h = max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
		return (h * 60 + 360) % 360;
	}
	const color = (game) => themes.find((t) => t.id === game.category).colors.ink.toLowerCase();
	const distance = (a, b) => {
		const d = Math.abs(hue(color(a)) - hue(color(b)));
		return Math.min(d, 360 - d);
	};
	function validAll(sample) {
		return (
			sample.length === 3 &&
			new Set(sample.map(color)).size === 3 &&
			sample.every((a, i) => sample.slice(i + 1).every((b) => distance(a, b) >= 50))
		);
	}
	function shuffle(values) {
		const a = [...values];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}
	function allSample() {
		const families = new Map();
		for (const game of games) {
			const key = color(game);
			if (!families.has(key)) families.set(key, []);
			families.get(key).push(game);
		}
		const pools = [...families.values()];
		let chosen,
			totalWeight = 0;
		// Enumerate the few registered color families, never the game triples.
		// Weight by pool sizes to retain uniform sampling of legal game triples.
		for (let a = 0; a < pools.length; a++)
			for (let b = a + 1; b < pools.length; b++)
				for (let c = b + 1; c < pools.length; c++) {
					const set = [pools[a], pools[b], pools[c]];
					if (!validAll(set.map((pool) => pool[0]))) continue;
					const weight = set.reduce((product, pool) => product * pool.length, 1);
					totalWeight += weight;
					if (Math.random() * totalWeight < weight) chosen = set;
				}
		if (!chosen)
			throw new Error("Catalogue needs three sufficiently distinct registered colour families");
		return shuffle(chosen.map((pool) => pool[Math.floor(Math.random() * pool.length)])).map(
			(g) => g.id,
		);
	}
	let samples;
	try {
		samples = JSON.parse(sessionStorage.getItem(key));
	} catch {}
	function validRecord(record) {
		if (!record) return false;
		return themes.every((t) => {
			const ids = record[t.id];
			if (!Array.isArray(ids) || new Set(ids).size !== ids.length) return false;
			const selected = ids.map((id) => byId.get(id));
			if (selected.some((g) => !g)) return false;
			if (t.id === "all") return validAll(selected);
			const pool = games.filter((g) => g.category === t.id);
			return (
				selected.length === Math.min(3, pool.length) && selected.every((g) => g.category === t.id)
			);
		});
	}
	if (!validRecord(samples)) {
		samples = Object.fromEntries(
			themes.map((t) => [
				t.id,
				t.id === "all"
					? allSample()
					: shuffle(games.filter((g) => g.category === t.id))
							.slice(0, 3)
							.map((g) => g.id),
			]),
		);
		sessionStorage.setItem(key, JSON.stringify(samples));
	}
	window.SGGEntrySamples = Object.freeze({
		get: (themeId) => samples[themeId].map((id) => byId.get(id)),
		allColorsDistinct: () => validAll(samples.all.map((id) => byId.get(id))),
	});
})();
