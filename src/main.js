import Three from "./core/Three";
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
	const container = document.querySelector("#app");
	const three = new Three(container);
	three.run();

	// Footer links shouldn't start a logo drag.
	document.querySelector(".site-footer")?.addEventListener("pointerdown", (e) => e.stopPropagation());
});
