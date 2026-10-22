/* Presentation only. Unread counts and requirements must come from authorised app state. */
(() => {
	"use strict";
	function update(button, { label, mode, unread = 0, required = false, modeLabel }) {
		button.dataset.mode = mode;
		button.dataset.required = String(required);
		const hint = button.querySelector(".tool-mode");
		const art = button.querySelector(".launch-art");
		art.querySelector(".tool-access")?.remove();
		const count = Number.isSafeInteger(unread) && unread > 0 ? unread : 0;
		const badge = SGGButtons.badge(art, count);
		badge?.classList.add("tool-unread");
		const paint = () => {
			if (hint)
				hint.textContent =
					mode === "read"
						? modeLabel || SGGI18n.t("asset.readOnly")
						: mode === "write"
							? SGGI18n.t("asset.canAct")
							: "";
			button.setAttribute(
				"aria-label",
				SGGI18n.t("asset.openApp", { label: SGGI18n.systemCopy(label) }) +
					SGGI18n.t(
						mode === "read"
							? "asset.launchRead"
							: mode === "off"
								? "asset.launchOff"
								: "asset.launchWrite",
					) +
					(required ? SGGI18n.t("asset.launchRequired") : "") +
					(count ? SGGI18n.t("asset.launchUnread", { count }) : ""),
			);
		};
		paint();
		button.__sgLocaleState?.();
		button.__sgLocaleState = SGGI18n.observe(button, paint);
	}
	window.SGGLauncherState = Object.freeze({ update, version: "launcher-state@1" });
})();
