/* Contextual help consumes only the current authorised surface; no tutorial state or commands. */
(() => {
	const mount = () => {
		const app = window.SessionApp;
		if (!app || window.__SGG_PROFILE_PEEK__) return;
		const context = app.context;
		const initial = window.__SGG_INITIAL_PROFILE__ === true;
		const key = initial
			? "ui.guide.profile"
			: !app.readonly
				? null
				: context.phase === "game" || context.phase === "decision"
					? "ui.guide.gameReadOnly"
					: context.phase === "feedback"
						? "ui.guide.feedbackReadOnly"
						: context.phase === "social" && context.remaining === 0
							? "ui.guide.quotaReadOnly"
							: "ui.guide.readOnlyHelp";
		if (!key) return;
		const note = document.createElement("p");
		note.className = "sg-phase-guide";
		SGGI18n.bind(note, key);
		if (initial) document.querySelector("#profile-edit")?.prepend(note);
		else {
			const toolbar = document.querySelector(".sg-pane-toolbar,.sg-toolbar");
			if (!toolbar) return;
			note.classList.add("sg-phase-notice");
			note.dataset.reading = document.querySelector("main.sg-page")?.dataset.width || "frame";
			toolbar.after(note);
		}
	};
	if (document.readyState === "loading")
		document.addEventListener("DOMContentLoaded", mount, { once: true });
	else mount();
})();
