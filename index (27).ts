@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── Base ───────────────────────────────────────────────────────────── */

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  background: linear-gradient(180deg, #f8f8f8 0%, #efefef 100%);
  min-height: 100vh;
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

button,
input,
textarea,
select {
  font: inherit;
}

/* ─── App shell ──────────────────────────────────────────────────────── */

.app-screen {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(180deg, #f8f8f8 0%, #efefef 100%);
}

.app-shell {
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #fafafa 0%, #f1f1f1 100%);
}

.app-content {
  padding: 0 0 110px;
  min-height: 100vh;
}

.app-bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  pointer-events: none;
}

.app-bottom-nav-inner {
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-top: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.06);
}

.app-tab-button {
  flex: 1;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 16px;
  padding: 10px 6px 8px;
  transition: all 0.15s ease;
  cursor: pointer;
}

.app-tab-button span {
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.app-tab-button.is-active {
  color: #111;
  background: rgba(0, 0, 0, 0.04);
}

/* ─── Shared cards ───────────────────────────────────────────────────── */

.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.58);
  border-radius: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
}

.glass-nav {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-top: 1px solid rgba(255, 255, 255, 0.55);
}

/* ─── Buttons ────────────────────────────────────────────────────────── */

.btn-primary {
  background: #000;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}

.btn-primary:hover {
  opacity: 0.92;
}

.btn-primary:active {
  transform: scale(0.985);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}

.btn-secondary:hover {
  opacity: 0.92;
}

.btn-secondary:active {
  transform: scale(0.985);
}

/* ─── Inputs ─────────────────────────────────────────────────────────── */

.glass-input {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.glass-input:focus {
  border-color: rgba(0, 0, 0, 0.18);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}

/* ─── Scrollbar ──────────────────────────────────────────────────────── */

::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 99px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.15);
}

/* ─── Banknote 3D rotation ───────────────────────────────────────────── */

.banknote-scene {
  perspective: 1200px;
  width: 600px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banknote-wrapper {
  width: 580px;
  height: 260px;
  position: relative;
  transform-style: preserve-3d;
}

.banknote {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: rotateBanknote 6s linear infinite;
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.15));
}

@keyframes rotateBanknote {
  0% {
    transform: rotateY(0deg);
  }

  100% {
    transform: rotateY(360deg);
  }
}

.banknote-face {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}

.banknote-front {
  transform: rotateY(0deg);
}

.banknote-back {
  transform: rotateY(180deg);
}

/* ─── B page ticket override ─────────────────────────────────────────── */

.b-ticket,
.b-ticket * {
  animation: none !important;
}

.b-ticket {
  transform: none !important;
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.15));
}

.b-ticket .banknote,
.b-ticket .banknote-wrapper,
.b-ticket .banknote-face,
.b-ticket .banknote-front,
.b-ticket .banknote-back {
  animation: none !important;
  transform: none !important;
  backface-visibility: visible !important;
  -webkit-backface-visibility: visible !important;
}
