/* Exported from the confirmed Q84-C palette source. Explicit preview theme only. */
(() => {
	const themes = {"coordination":{"ink":"#1d5e8d","mid":"#67a5d9","wash":"#e2edf7","paper":"#f8fafc","canvas":"#f9fbfc","surface":"#ffffff","label":"#1f2225","secondary":"#53595e","line":"#cbced1"},"information":{"ink":"#4a5391","mid":"#8c99dd","wash":"#e7ebf8","paper":"#f9fafc","canvas":"#fafbfc","surface":"#ffffff","label":"#202126","secondary":"#56585f","line":"#cccdd2"},"creation":{"ink":"#02685f","mid":"#46b3a6","wash":"#dfefed","paper":"#f7fbfa","canvas":"#f9fbfb","surface":"#ffffff","label":"#1e2322","secondary":"#515a59","line":"#cacfce"},"cooperation":{"ink":"#585f0c","mid":"#9ca65b","wash":"#eaeddf","paper":"#f9faf7","canvas":"#fbfbf9","surface":"#ffffff","label":"#21221e","secondary":"#585951","line":"#cdceca"},"trust":{"ink":"#1d6940","mid":"#69b183","wash":"#e2efe6","paper":"#f8fbf9","canvas":"#f9fbfa","surface":"#ffffff","label":"#1f2320","secondary":"#535a55","line":"#cbcfcc"},"allocation":{"ink":"#864525","mid":"#d28a69","wash":"#f6e8e1","paper":"#fcf9f8","canvas":"#fcfaf9","surface":"#ffffff","label":"#25201e","secondary":"#5e5653","line":"#d1cdca"},"market":{"ink":"#755201","mid":"#bf9752","wash":"#f2eade","paper":"#fbf9f7","canvas":"#fcfbf9","surface":"#ffffff","label":"#24211d","secondary":"#5c5751","line":"#d0cdc9"},"protection":{"ink":"#026576","mid":"#46aec5","wash":"#deeff3","paper":"#f7fafb","canvas":"#f9fbfc","surface":"#ffffff","label":"#1d2324","secondary":"#515a5c","line":"#cacfd0"},"incentives":{"ink":"#72457c","mid":"#ba8ac5","wash":"#f1e8f3","paper":"#fbf9fb","canvas":"#fbfafc","surface":"#ffffff","label":"#232024","secondary":"#5b565c","line":"#cfccd0"},"governance":{"ink":"#086187","mid":"#5aa8d4","wash":"#e0edf6","paper":"#f7fafc","canvas":"#f9fbfc","surface":"#ffffff","label":"#1e2225","secondary":"#52595e","line":"#caced1"},"competition":{"ink":"#5e4d8b","mid":"#a392d6","wash":"#ece9f6","paper":"#faf9fc","canvas":"#fbfafc","surface":"#ffffff","label":"#222125","secondary":"#58575e","line":"#cecdd1"},"matching":{"ink":"#824061","mid":"#ce84a7","wash":"#f5e7ed","paper":"#fcf9fa","canvas":"#fcfafb","surface":"#ffffff","label":"#252022","secondary":"#5e5559","line":"#d1ccce"}};
	for (const palette of Object.values(themes)) Object.freeze(palette);
	window.SGGThemes = Object.freeze({
		ids: Object.freeze(Object.keys(themes)),
		get: (id) => themes[id] || null,
		apply(id, root = document.documentElement) {
			if (!themes[id]) throw Error("Unknown theme: " + id);
			root.dataset.sgTheme = id;
			Object.entries(themes[id]).forEach(([k, v]) => root.style.setProperty("--" + k, v));
		},
	});
	const id = document.documentElement.dataset.sgTheme;
	if (id && themes[id]) SGGThemes.apply(id);
})();
