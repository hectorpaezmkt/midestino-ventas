@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
}

body {
  font-family: 'Poppins', system-ui, sans-serif;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior-y: contain;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
