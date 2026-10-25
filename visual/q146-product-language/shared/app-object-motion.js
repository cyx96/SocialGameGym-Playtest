/* Selected functional paper previews. Decorative only; click always belongs to the real App launcher. */
(() => {
	"use strict";
	const fine = matchMedia("(hover:hover) and (pointer:fine)"),
		motion = window.SGGMotion;
	const states = new WeakMap(),
		active = new Set(),
		engaged = new Set();
	let raf = 0,
		last = 0;
	const clamp = (x) => Math.max(0, Math.min(1, x));
	const phase = (p, a, b) => {
		const t = clamp((p - a) / (b - a));
		return t * t * (3 - 2 * t);
	};
	const rad = (d) => (d * Math.PI) / 180;
	function part(s, name, t) {
		const n = s.parts.get(name);
		if (n) n.style.transform = t;
	}
	function light(s, name, x = 0, y = 0) {
		const n = s.parts.get(name);
		if (!n) return;
		const nx = Math.sin(rad(y)) * Math.cos(rad(x)),
			ny = -Math.sin(rad(x)),
			nz = Math.cos(rad(y)) * Math.cos(rad(x));
		const diffuse = Math.abs(-0.4 * nx - 0.5 * ny + 0.77 * nz);
		for (const shade of n.querySelectorAll(".paper-shade"))
			shade.style.opacity = String(Math.max(0, Math.min(0.23, (0.77 - diffuse) * 0.38)));
	}
	function enhance(host = document) {
		for (const node of [
			...(host.matches?.(".sg-app-object") ? [host] : []),
			...host.querySelectorAll(".sg-app-object"),
		])
			if (!states.has(node)) {
				for (const svg of node.querySelectorAll("svg"))
					window.SGGIcons.isolate(svg, "sga-" + ++serial + "-");
				const s = {
					node,
					x: 0,
					v: 0,
					target: 0,
					parts: new Map(
						[...node.querySelectorAll("[data-piece]")].map((n) => [n.dataset.piece, n]),
					),
				};
				states.set(node, s);
				render(s);
			}
	}
	let serial = 0;
	function render(s) {
		const p = clamp(s.x),
			app = s.node.dataset.appObject,
			mode = "a";
		s.node.dataset.progress = p.toFixed(6);
		s.node.toggleAttribute("data-live", Boolean(s.target));

		if (app === "profile") {
			if (mode === "a") {
				part(s, "card-turn", `translateY(${-3 * Math.sin(Math.PI * p)}px) rotateY(${180 * p}deg)`);
				light(s, "card-turn", 0, 180 * p);
				for (const name of ["paper-left", "paper-right"]) {
					s.parts.get(name).style.opacity = "0";
				}
			} else {
				part(s, "card-turn", `rotateX(${-6 * p}deg)`);
				light(s, "card-turn", -6 * p, 0);
				for (const [name, sign] of [
					["paper-left", -1],
					["paper-right", 1],
				]) {
					const angle = sign * 180 * (1 - p);
					part(s, name, `translateZ(-1px) rotateY(${angle}deg)`);
					s.parts.get(name).style.opacity = String(phase(p, 0.015, 0.12));
					light(s, name, 0, angle);
				}
			}
		} else if (app === "dm") {
			const open = phase(p, 0, 0.67),
				angle = -150 * open;
			part(s, "flap", `translateZ(1.6px) rotateX(${angle}deg)`);
			light(s, "flap", angle, 0);
			if (mode === "a") {
				const read = phase(p, 0.24, 0.98);
				part(s, "letter", `translateY(${-44 * read}px) translateZ(.6px)`);
				part(s, "envelope-body", "translateZ(1px)");
			} else {
				const spread = phase(p, 0.18, 1);
				part(s, "envelope-body", "translateZ(-.2px)");
				part(s, "envelope-left", `rotateY(${118 * spread}deg)`);
				light(s, "envelope-left", 0, 118 * spread);
				part(s, "envelope-right", `rotateY(${-118 * spread}deg)`);
				light(s, "envelope-right", 0, -118 * spread);
				part(s, "envelope-bottom", `translateZ(.8px) rotateX(${135 * spread}deg)`);
				light(s, "envelope-bottom", 135 * spread, 0);
			}
		} else if (app === "forum") {
			const response = phase(p, 0.1, 1);
			part(s, "discussion", `translate3d(${-12 * p}px,${-12 * p}px,1px)`);
			part(s, "reply", `translate3d(${8 * response}px,${12 * response}px,-1px)`);
			part(
				s,
				"reply-contact",
				`translate(${-12 * p - 8 * response + 0.5}px,${-12 * p - 12 * response + 1.5}px)`,
			);
			s.parts.get("reply").style.opacity = String(phase(p, 0.1, 0.4));
		} else if (app === "rating") {
			// One paper star makes an impression, then lifts to reveal it. The same
			// continuous pose function is traversed backwards on exit and interruption.
			const press = phase(p, 0.06, 0.54),
				lift = phase(p, 0.6, 1);
			const x = 9 * press - 24 * lift,
				y = 25 * press - 48 * lift,
				size = 1 - 0.36 * press + 0.16 * lift;
			part(s, "rating-center", `translate3d(${x}px,${y}px,${2 + 8 * lift}px) scale(${size})`);
			part(s, "rating-sheet", `translateY(${8 * (1 - phase(p, 0, 0.3))}px)`);
			s.parts.get("rating-sheet").style.opacity = String(phase(p, 0.02, 0.24));
			s.parts.get("rating-imprint").style.opacity = String(0.4 * phase(p, 0.5, 0.64));
			light(s, "rating-center", 0, 0);
		} else if (app === "questionnaire") {
			const answer = phase(p, 0.18, 0.95),
				angle = -80 * (1 - answer);
			part(s, "question-page", `translateY(${-3 * p}px) rotateX(${12 * p}deg)`);
			part(
				s,
				"new-check",
				`translateZ(${0.5 + 5 * Math.sin(Math.PI * answer)}px) rotateX(${angle}deg)`,
			);
			s.parts.get("new-check").style.opacity = String(phase(p, 0.15, 0.35));
			light(s, "question-body", 12 * p, 0);
			light(s, "new-check", angle + 12 * p, 0);
		} else if (app === "game") {
			const travel = phase(p, 0.1, 0.94);
			// One visible game action. The paper character clears the gap and lands;
			// the monitor and its folded support stay still, like the other App objects.
			const x = 54 * travel,
				y = -12 * travel - 14 * Math.sin(Math.PI * travel);
			part(s, "screen-player", `translate(${x}px,${y}px)`);
		}
	}

	function blocked(s) {
		return (
			!s.node.isConnected ||
			s.node.closest("[inert],[hidden],[aria-hidden=true],button:disabled") ||
			document.hidden ||
			motion.instant()
		);
	}
	function finish(s) {
		s.x = 0;
		s.v = 0;
		s.target = 0;
		active.delete(s);
		engaged.delete(s);
		render(s);
	}
	function frame(now) {
		const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
		last = now;
		for (const s of [...active]) {
			if (blocked(s)) {
				finish(s);
				continue;
			}
			const budget = motion.options(s.target ? "expand" : "exit").duration / 1000,
				omega = 4 / Math.max(0.06, budget),
				y = s.x - s.target,
				c = s.v + omega * y,
				decay = Math.exp(-omega * dt);
			s.x = s.target + (y + c * dt) * decay;
			s.v = (s.v - omega * c * dt) * decay;
			if (Math.abs(s.x - s.target) < 0.00015 && Math.abs(s.v) < 0.004) {
				s.x = s.target;
				s.v = 0;
				active.delete(s);
				if (!s.target) engaged.delete(s);
			}
			render(s);
		}
		if (active.size) raf = requestAnimationFrame(frame);
		else {
			raf = 0;
			last = 0;
		}
	}
	function aim(s, target) {
		if (blocked(s) || !fine.matches) {
			finish(s);
			return;
		}
		s.target = target;
		if (target) engaged.add(s);
		active.add(s);
		if (!raf) raf = requestAnimationFrame(frame);
	}
	function settle() {
		for (const s of [...active]) finish(s);
		cancelAnimationFrame(raf);
		raf = 0;
		last = 0;
		for (const n of document.querySelectorAll(".sg-app-object")) {
			const s = states.get(n);
			if (s) finish(s);
		}
	}
	function stateFor(e) {
		const button = e.target.closest?.(".launch-tool");
		if (!button) return;
		enhance(button);
		return states.get(button.querySelector(".sg-app-object"));
	}
	document.addEventListener(
		"pointerover",
		(e) => {
			const s = stateFor(e);
			if (
				s &&
				e.pointerType === "mouse" &&
				!s.node.closest(".launch-tool").contains(e.relatedTarget)
			) {
				motion.input("pointer");
				aim(s, 1);
			}
		},
		{ passive: true },
	);
	document.addEventListener(
		"pointerout",
		(e) => {
			const s = stateFor(e);
			if (s && !s.node.closest(".launch-tool").contains(e.relatedTarget)) aim(s, 0);
		},
		{ passive: true },
	);
	document.addEventListener(
		"pointerdown",
		(e) => {
			const s = stateFor(e);
			if (s) finish(s);
		},
		{ passive: true },
	);
	document.addEventListener("pointercancel", settle, { passive: true });
	motion.onSettle(settle);
	fine.addEventListener("change", settle);
	window.addEventListener("blur", settle);
	window.addEventListener("resize", settle);
	document.addEventListener("visibilitychange", settle);
	new MutationObserver(() => {
		for (const s of [...engaged]) if (blocked(s)) finish(s);
	}).observe(document.documentElement, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ["disabled", "inert", "hidden", "aria-hidden"],
	});
	window.SGGAppObjects = Object.freeze({
		enhance,
		settle,
		get running() {
			return active.size;
		},
	});
	enhance();
})();
