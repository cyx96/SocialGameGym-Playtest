/* One spatial language for collections and game posters. Distances are in card-width units. */
window.SGGCatalogMotion = Object.freeze({
	track: 348,
	headroom: 20,
	spring: Object.freeze({
		type: "spring",
		stiffness: 900,
		damping: 54,
		mass: 1,
		restDelta: 0.002,
		restSpeed: 0.05,
	}),
	depth: (d) => 0.65 + 0.35 * Math.exp(-0.97 * d * d),
	scale: (d) => 0.42 + 0.58 * Math.exp(-0.97 * d * d),
	position: (d) =>
		(0.42 * d + 0.48 * Math.tanh(d / 0.95)) * 348 - (d < 0 ? 20 * (1 - Math.exp(-3 * d * d)) : 0),
	step: 348 * (0.42 + 0.48 / 0.95),
	reveal: (d) => {
		const x = Math.max(0, Math.min(1, (Math.abs(d) - 0.08) / 0.42));
		return 1 - x * x * (3 - 2 * x);
	},
	edge: (h) => Math.max(48, Math.min(80, (h + 76) * 0.1)),
});
