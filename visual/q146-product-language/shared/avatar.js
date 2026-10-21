/* Bounded identity presentation; never derives a preset from role, state or game. */
(() => {
	const registry = window.SGGAvatarRegistry,
		base = new URL("../assets/avatars/", document.currentScript.src),
		aliases = { neutral: "default", "default-neutral": "default", fairness: "allocation" };
	const escape = (value) =>
		String(value).replace(
			/[&<>"']/g,
			(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
		);
	function resolve(preset) {
		const key = aliases[preset] || preset;
		return registry[key] ? key : "default";
	}
	function url(preset) {
		return new URL(registry[resolve(preset)].file, base).href;
	}
	function html({ preset = "default", size = "row", src, person } = {}) {
		preset = resolve(preset);
		size = ["reply", "message", "context", "row", "profile", "detail"].includes(size)
			? size
			: "row";
		return (
			'<span class="sg-avatar" data-preset="' +
			preset +
			'" data-family="' +
			preset +
			'" data-size="' +
			size +
			'"' +
			(person ? ' data-person="' + escape(person) + '"' : "") +
			' aria-hidden="true"><img data-avatar-preset="' +
			preset +
			'" src="' +
			escape(src || url(preset)) +
			'" width="64" height="64" alt="" draggable="false"></span>'
		);
	}
	function node({ preset = "default", size = "row", src, badge, ready = false, person } = {}) {
		const template = document.createElement("template");
		template.innerHTML = html({ preset, size, src, person });
		const n = template.content.firstElementChild;
		if (ready) n.dataset.ready = "true";
		if (badge && window.SGGIcons) {
			const tag = document.createElement("span");
			tag.className = "sg-avatar-badge";
			tag.append(SGGIcons.create(badge));
			n.append(tag);
		}
		return n;
	}
	document.addEventListener(
		"error",
		(e) => {
			const img = e.target;
			if (
				!(img instanceof HTMLImageElement) ||
				!img.hasAttribute("data-avatar-preset") ||
				img.dataset.avatarFallback
			)
				return;
			img.dataset.avatarFallback = "true";
			img.src = url("default");
		},
		true,
	);
	window.SGGAvatar = Object.freeze({ version: "avatar@1.0.0", registry, resolve, url, html, node });
})();
