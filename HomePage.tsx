@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── Global Background ──────────────────────────────────────────────────── */
body {
  background: linear-gradient(135deg, #ffffff, #f2f2f2);
  min-height: 100vh;
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

* { box-sizing: border-box; }

/* ─── Glass Card ──────────────────────────────────────────────────────────── */
.glass-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

/* ─── Glass Nav (bottom) ─────────────────────────────────────────────────── */
.glass-nav {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

/* ─── Primary Button ──────────────────────────────────────────────────────── */
.btn-primary {
  background: #000;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.btn-primary:hover { opacity: 0.92; }
.btn-primary:active { transform: scale(0.98); }

/* ─── Secondary Button ───────────────────────────────────────────────────── */
.btn-secondary {
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-secondary:hover { opacity: 0.92; }

/* ─── Input ───────────────────────────────────────────────────────────────── */
.glass-input {
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s;
}
.glass-input:focus { border-color: rgba(0, 0, 0, 0.2); }

/* ─── Scrollbar ───────────────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.15); }

/* ─── Banknote 3D rotation (home page) ────────────────────────────────────── */
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
  filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15));
}

@keyframes rotateBanknote {
  0%   { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}

.banknote-face {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}

.banknote-front { transform: rotateY(0deg); }
.banknote-back { transform: rotateY(180deg); }
