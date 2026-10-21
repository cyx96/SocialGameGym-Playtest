/* Presentation only. Unread counts and requirements must come from authorised app state. */
(() => {
	"use strict";
	function update(button, { label, mode, unread = 0, required = false }) {
		button.dataset.mode = mode;
		button.dataset.required = String(required);
		const art = button.querySelector(".launch-art");
		art.querySelector(".tool-access")?.remove();
		let badge = art.querySelector(".tool-unread");
		if (!badge) {
			badge = document.createElement("span");
			badge.className = "tool-unread";
			badge.setAttribute("aria-hidden", "true");
			art.append(badge);
		}
		const count = Number.isSafeInteger(unread) && unread > 0 ? unread : 0,
			previous = Number(badge.dataset.count || 0),
			initialized = badge.hasAttribute("data-count");
		badge.dataset.count = count;
		badge.textContent = count > 99 ? "99+" : String(count);
		badge.hidden = count === 0;
		if (initialized && count > previous && badge.getClientRects().length)
			SGGMotion.run(
				badge,
				[
					{ opacity: 0.5, transform: "translateY(2px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ role: "state" },
			);
		button.setAttribute(
			"aria-label",
			"打开" +
				label +
				(mode === "read" ? "，只读，可查看" : mode === "off" ? "，未开启" : "，可操作") +
				(required ? "，有待完成操作" : "") +
				(count ? "，" + count + "条未读通知" : ""),
		);
	}
	window.SGGLauncherState = Object.freeze({ update, version: "launcher-state@1" });
})();
