import * as THREE from "three";
import WebGLContext from "../core/WebGLContext";
import vertexShader from "../shaders/logo.vert";
import fragmentShader from "../shaders/fire.frag";
import { createLogoTexture, LOGO_WIDTH, LOGO_HEIGHT } from "../utils/NoFunLogo";
import TextScreen from "../utils/TextScreen";
import TextPhysics from "../utils/TextPhysics";
import { aboutLines } from "../utils/AboutScreen";

export default class Scene {
	constructor() {
		this.cols = 80;
		this.margin = 1;
		this.maxLogoScale = 7;
		this.logoScale = this.maxLogoScale;
		this.flameRoom = 22; // logo texels of flame above the wordmark, used to centre the composition
		this.windResponse = 8;
		this.palette = {
			bg: 0x0d0e12,
			logo: 0xffffff,
			outline: 0x000000,
			flames: [0xc8321e, 0xff6a1a, 0xffb83d, 0xfff4dc],
		};

		this.context = new WebGLContext();
		this.scene = new THREE.Scene();
		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.lines = aboutLines();
		this.layout = this.#layout();
		this.logo = { x: 0, y: 0, vx: 0, vy: 0 };
		this.logoPrev = null;
		this.drag = null;

		this.#addObjects();
		this.#bindPointer();
	}

	#getResolution() {
		return this.context.renderer.getDrawingBufferSize(new THREE.Vector2());
	}

	#layout() {
		const { CELL_W, CELL_H } = TextScreen;
		const res = this.#getResolution();
		const cols = this.cols + 2 * this.margin;
		const rows = this.lines.length + 2 * this.margin;
		const scale = Math.max(1, Math.min(res.x / (cols * CELL_W), res.y / (rows * CELL_H)));
		const width = Math.ceil(res.x / scale);
		const height = Math.ceil(res.y / scale);
		const originX = Math.floor((width - this.cols * CELL_W) / 2 / CELL_W) * CELL_W;
		const originY = Math.floor((height - this.lines.length * CELL_H) / 2 / CELL_H) * CELL_H;
		return { scale, width, height, originX, originY };
	}

	// Largest integer scale (up to maxLogoScale) at which wordmark + face + flames fit the screen.
	#fitLogoScale(width, height) {
		const fit = Math.min(
			(width * 0.8) / LOGO_WIDTH,
			(height * 0.85) / (LOGO_HEIGHT + this.flameRoom),
		);
		return Math.max(2, Math.min(this.maxLogoScale, Math.floor(fit)));
	}

	#centerLogo(width, height) {
		const s = this.logoScale;
		this.logo.x = Math.floor((width - LOGO_WIDTH * s) / 2);
		this.logo.y = Math.floor((height - (LOGO_HEIGHT + this.flameRoom) * s) / 2 + this.flameRoom * s);
	}

	#addObjects() {
		const { width, height, originX, originY } = this.layout;

		this.screen = new TextScreen(width, height);
		this.screen.setLines(this.lines, originX, originY);
		this.logoScale = this.#fitLogoScale(width, height);
		this.physics = new TextPhysics(this.screen, this.logoScale);
		this.#centerLogo(width, height);

		this.material = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: {
				uResolution: { value: this.#getResolution() },
				uTime: { value: 0 },
				uScreen: { value: this.screen.texture },
				uScreenSize: { value: new THREE.Vector2(width, height) },
				uFontPx: { value: this.layout.scale },
				uLogo: { value: createLogoTexture() },
				uLogoSize: { value: new THREE.Vector2(LOGO_WIDTH, LOGO_HEIGHT) },
				uLogoOrigin: { value: new THREE.Vector2() },
				uLogoScale: { value: this.logoScale },
				uLogoVelocity: { value: new THREE.Vector2() },
				uBg: { value: new THREE.Color(this.palette.bg) },
				uLogoColor: { value: new THREE.Color(this.palette.logo) },
				uOutlineColor: { value: new THREE.Color(this.palette.outline) },
				uFlameRamp: { value: this.palette.flames.map((hex) => new THREE.Color(hex)) },
			},
			depthTest: false,
			depthWrite: false,
		});
		this.#syncLogoUniform();

		this.rampCss = this.palette.flames.map((hex) => "#" + hex.toString(16).padStart(6, "0"));

		const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
		quad.frustumCulled = false;
		this.scene.add(quad);
	}

	#bindPointer() {
		window.addEventListener("pointerdown", (e) => {
			if (e.isPrimary) this.drag = { x: e.clientX, y: e.clientY };
		});
		window.addEventListener("pointermove", (e) => {
			if (!this.drag || !e.isPrimary) return;
			const k = this.context.pixelRatio / this.layout.scale;
			this.logo.x += (e.clientX - this.drag.x) * k;
			this.logo.y += (e.clientY - this.drag.y) * k;
			this.drag = { x: e.clientX, y: e.clientY };
		});
		window.addEventListener("pointerup", () => (this.drag = null));
		window.addEventListener("pointercancel", () => (this.drag = null));
	}

	#syncLogoUniform() {
		this.material.uniforms.uLogoOrigin.value.set(
			this.logo.x,
			this.screen.height - this.logo.y - LOGO_HEIGHT * this.logoScale,
		);
	}

	animate(delta, elapsed) {
		this.material.uniforms.uTime.value = elapsed;

		const dt = Math.min(delta, 0.05);
		if (dt > 0) {
			const prev = this.logoPrev ?? this.logo;
			this.logo.vx = (this.logo.x - prev.x) / dt;
			this.logo.vy = (this.logo.y - prev.y) / dt;
			this.logoPrev = { x: this.logo.x, y: this.logo.y };
		}

		const wind = this.material.uniforms.uLogoVelocity.value;
		const k = 1 - Math.exp(-this.windResponse * dt);
		wind.x += (this.logo.vx / this.logoScale - wind.x) * k;
		wind.y += (-this.logo.vy / this.logoScale - wind.y) * k;

		this.physics.update(dt, elapsed, this.logo.x, this.logo.y, wind.x * this.logoScale, -wind.y * this.logoScale);
		this.screen.render(this.rampCss);
		this.#syncLogoUniform();
	}

	onResize() {
		this.material.uniforms.uResolution.value.copy(this.#getResolution());

		const next = this.#layout();
		const dx = next.originX - this.layout.originX;
		const dy = next.originY - this.layout.originY;
		this.layout = next;
		this.screen.resize(next.width, next.height, dx, dy);
		const scale = this.#fitLogoScale(next.width, next.height);
		if (scale !== this.logoScale) {
			this.logoScale = scale;
			this.physics.scale = scale;
			this.material.uniforms.uLogoScale.value = scale;
			this.#centerLogo(next.width, next.height);
		} else {
			this.logo.x += dx;
			this.logo.y += dy;
		}
		this.logoPrev = null;
		this.material.uniforms.uScreenSize.value.set(next.width, next.height);
		this.material.uniforms.uFontPx.value = next.scale;
		this.#syncLogoUniform();
	}
}
