/* Motion contract adapted from the accepted Q78 forum composer: shared expand/collapse roles. */
window.createInlineFeedbackEditor = ({
	slot,
	surface,
	inner,
	launch,
	instant,
	changed,
	closed,
}) => {
	let phase = "closed",
		token = 0,
		timer = 0,
		cleanup = () => {},
		dead = false;
	function finishMotion(open, stamp) {
		if (dead || stamp !== token) return;
		clearTimeout(timer);
		cleanup();
		phase = open ? "open" : "closed";
		slot.dataset.editorState = phase;
		if (open) {
			surface.style.height = inner.scrollHeight + "px";
			slot.style.height = inner.scrollHeight + "px";
		} else {
			surface.hidden = true;
			surface.inert = true;
			launch.hidden = false;
			inner.replaceChildren();
			slot.style.height = launch.getBoundingClientRect().height + "px";
			closed?.();
		}
		changed?.(phase);
	}
	function set(open, { immediate = false } = {}) {
		if (dead) return;
		cleanup();
		clearTimeout(timer);
		const stamp = ++token,
			noMotion = immediate || instant();
		const current = slot.getBoundingClientRect().height;
		slot.style.height = current + "px";
		surface.style.height = current + "px";
		surface.hidden = false;
		surface.inert = !open;
		launch.hidden = true;
		slot.classList.toggle("instant", noMotion);
		slot.offsetHeight;
		phase = open ? "opening" : "closing";
		slot.dataset.editorState = phase;
		changed?.(phase);
		const target = open ? inner.scrollHeight : 64;
		surface.style.height = target + "px";
		slot.style.height = target + "px";
		const end = (e) => {
			if (e.target === slot && e.propertyName === "height") finishMotion(open, stamp);
		};
		slot.addEventListener("transitionend", end);
		cleanup = () => slot.removeEventListener("transitionend", end);
		if (noMotion || Math.abs(current - target) < 0.5) finishMotion(open, stamp);
		else
			timer = setTimeout(
				() => finishMotion(open, stamp),
				SGGMotion.options(open ? "expand" : "collapse").duration + 80,
			);
	}
	const observer = new ResizeObserver(() => {
		if (!dead && phase === "open") {
			slot.classList.add("instant");
			surface.style.height = inner.scrollHeight + "px";
			slot.style.height = inner.scrollHeight + "px";
		}
	});
	observer.observe(inner);
	slot.style.height = "64px";
	slot.dataset.editorState = "closed";
	surface.hidden = true;
	surface.inert = true;
	return {
		set,
		complete: () => {
			if (phase === "opening" || phase === "closing") set(phase === "opening", { immediate: true });
		},
		destroy: () => {
			dead = true;
			++token;
			clearTimeout(timer);
			cleanup();
			observer.disconnect();
		},
		get phase() {
			return phase;
		},
	};
};
