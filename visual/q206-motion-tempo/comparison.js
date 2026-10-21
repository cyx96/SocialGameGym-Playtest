(() => {
	"use strict";
	const choices = window.SGGTempoCandidates,
		frame = document.querySelector("#preview");
	const params = new URLSearchParams(location.search);
	let scene = params.get("scene") === "app" ? "app" : "gateway";
	const selected = { gateway: "composed", app: "gentle" };
	for (const key of ["gateway", "app"])
		if (choices.some((c) => c.id === params.get(key))) selected[key] = params.get(key);
	const buttons = choices.map((choice) => {
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = choice.name;
		button.dataset.tempo = choice.id;
		button.onclick = () => {
			selected[scene] = choice.id;
			render();
		};
		document.querySelector(".comparison-choices").append(button);
		return button;
	});
	function render() {
		const choice = choices.find((c) => c.id === selected[scene]);
		for (const b of document.querySelectorAll("[data-scene]"))
			b.setAttribute("aria-pressed", String(b.dataset.scene === scene));
		for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.tempo === choice.id));
		document.querySelector("#timing").textContent =
			scene === "gateway"
				? `${choice.gateway}ms · ${choice.description}`
				: `展开 ${choice.open}ms ／ 收起 ${choice.close}ms · ${choice.description}`;
		document.querySelector("#preference").textContent =
			`当前：入口 ${choices.find((c) => c.id === selected.gateway).name}；App ${choices.find((c) => c.id === selected.app).name}`;
		const query = new URLSearchParams({ scene, ...selected });
		history.replaceState(null, "", "?" + query);
		frame.src = "scene.html?" + new URLSearchParams({ scene, tempo: choice.id });
	}
	for (const b of document.querySelectorAll("[data-scene]"))
		b.onclick = () => {
			scene = b.dataset.scene;
			render();
		};
	document.querySelector("#replay").onclick = () =>
		frame.contentWindow.postMessage({ channel: "sgg:tempo-replay" }, location.origin);
	render();
})();
