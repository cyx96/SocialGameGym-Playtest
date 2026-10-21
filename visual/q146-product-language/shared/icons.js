/* Authored geometric icons, generated from source/icons.json. */
(() => {
	const registry = {"back":"<path d=\"m14 5-7 7 7 7\"/>","close":"<path d=\"m6 6 12 12M18 6 6 18\"/>","search":"<circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"m16 16 5 5\"/>","edit":"<path d=\"m15 5 4 4M4 20l4.5-1L20 7.5 16.5 4 5 15.5 4 20Z\"/>","compose":"<path d=\"M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6m3 1 4 4M10 14l1-4L18 3l3 3-7 7-4 1Z\"/>","copy":"<rect x=\"8\" y=\"8\" width=\"12\" height=\"12\" rx=\"2\"/><path d=\"M15 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4\"/>","reply":"<path d=\"m9 5-6 6 6 6M3 11h10a7 7 0 0 1 7 7v1\"/>","chevron-down":"<path d=\"m6 9 6 6 6-6\"/>","plus":"<path d=\"M12 5v14M5 12h14\"/>","minus":"<path d=\"M5 12h14\"/>","rules":"<path d=\"M12 5C8 3 5 3 2 4v16c4-1 7-1 10 1m0-16c4-2 7-2 10-1v16c-4-1-7-1-10 1V5\"/>","records":"<path d=\"M3 10a9 9 0 1 1 1 8M3 4v6h6M12 7v5l3 2\"/>","send":"<path d=\"M12 19V5m-6 6 6-6 6 6\"/>","check":"<path class=\"sg-checkmark\" pathLength=\"1\" d=\"m5 12 4 4L19 6\"/>","more":"<circle cx=\"5\" cy=\"12\" r=\".8\"/><circle cx=\"12\" cy=\"12\" r=\".8\"/><circle cx=\"19\" cy=\"12\" r=\".8\"/>","settings":"<path d=\"m10 3-.5 2.3-1.7 1-2.2-.7-2 3.4 1.7 1.6v2L3.6 14.5l2 3.4 2.2-.7 1.7 1L10 21h4l.5-2.3 1.7-1 2.2.7 2-3.4-1.7-1.6v-2l1.7-1.6-2-3.4-2.2.7-1.7-1L14 3Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>","person":"<circle cx=\"12\" cy=\"8\" r=\"3.5\"/><path d=\"M5 21v-2a7 7 0 0 1 14 0v2\"/>","player-type":"<circle cx=\"10\" cy=\"7.5\" r=\"3.2\"/><path d=\"M3.5 20v-2a6.5 6.5 0 0 1 11-4.7m2 3.7 3 3 3-3\"/>","builtin":"<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><path d=\"m7 9 3 3-3 3m6 0h4\"/>","agent":"<circle cx=\"12\" cy=\"12\" r=\"3\"/><circle cx=\"5\" cy=\"5\" r=\"2\"/><circle cx=\"19\" cy=\"5\" r=\"2\"/><circle cx=\"19\" cy=\"19\" r=\"2\"/><path d=\"m6.5 6.5 3.3 3.3m4.4 0 3.3-3.3m-3.3 7.7 3.3 3.3M3 19h6m-3-3v6\"/>","trash":"<path d=\"M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6\"/>","clock":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>","status-idle":"<circle cx=\"12\" cy=\"12\" r=\"7\"/>","desktop":"<rect x=\"4\" y=\"4\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"14\" y=\"4\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"4\" y=\"14\" width=\"6\" height=\"6\" rx=\"1\"/><rect x=\"14\" y=\"14\" width=\"6\" height=\"6\" rx=\"1\"/>","eye":"<path d=\"M2 12s3.4-6 10-6 10 6 10 6-3.4 6-10 6S2 12 2 12Z\"/><circle cx=\"12\" cy=\"12\" r=\"2.5\"/>"};
	window.SGGIcons = Object.freeze({
		names: Object.keys(registry),
		create(name) {
			if (!registry[name]) throw Error("Unknown icon: " + name);
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("viewBox", "0 0 24 24");
			svg.setAttribute("aria-hidden", "true");
			svg.setAttribute("focusable", "false");
			svg.dataset.sgIcon = name;
			svg.innerHTML = registry[name];
			return svg;
		},
	});
})();
