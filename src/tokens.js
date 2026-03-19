export const C = {
  navy: '#0B1D35',
  blue: '#1354F9',
  blueSoft: '#EBF0FF',
  blueLight: '#C7D4FE',
  slate: '#4A5878',
  slateL: '#8896B3',
  border: '#DDE3EE',
  bg: '#F5F7FC',
  white: '#FFFFFF',
  green: '#12A05C',
  greenBg: '#EAFAF3',
  amber: '#E07B00',
  red: '#D43B3B',
  redBg: '#FEF0F0'
};

export const globalCss = `
  :root {
    color-scheme: light;
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    font-family: "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: ${C.bg};
    color: ${C.navy};
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: "Bricolage Grotesque", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    margin: 0;
    color: ${C.navy};
  }
  button {
    font-family: inherit;
  }
  .fadeUp {
    opacity: 0;
    transform: translateY(8px);
    animation: fadeUp 0.24s ease-out forwards;
  }
  .fadeIn {
    opacity: 0;
    animation: fadeIn 0.18s ease-out forwards;
  }
  .zoomIn {
    transform: scale(0.96);
    opacity: 0;
    animation: zoomIn 0.18s ease-out forwards;
  }
  .spin {
    animation: spin 0.8s linear infinite;
  }
  .pulse {
    animation: pulse 1.2s ease-in-out infinite;
  }
  .scanline {
    position: relative;
    overflow: hidden;
  }
  .scanline::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
    mix-blend-mode: soft-light;
    animation: scanline 3.2s linear infinite;
    pointer-events: none;
  }
  .gridOverlay {
    background-image:
      linear-gradient(rgba(18,160,92,0.2) 1px, transparent 1px),
      linear-gradient(90deg, rgba(18,160,92,0.2) 1px, transparent 1px);
    background-size: 50px 50px;
    background-position: -1px -1px;
  }
  .targetCorners::before,
  .targetCorners::after {
    content: '';
    position: absolute;
    inset: 10px;
    border-radius: 8px;
    border: 2px solid rgba(18,160,92,0.8);
    clip-path: polygon(
      0 0, 14% 0, 14% 4%, 4% 4%, 4% 14%, 0 14%,
      0 0, 0 0,
      100% 0, 86% 0, 86% 4%, 96% 4%, 96% 14%, 100% 14%,
      100% 0, 100% 0,
      100% 100%, 86% 100%, 86% 96%, 96% 96%, 96% 86%, 100% 86%,
      100% 100, 100% 100%,
      0 100%, 14% 100%, 14% 96%, 4% 96%, 4% 86%, 0 86%
    );
  }
  .blink {
    animation: blink 1s step-end infinite;
  }
  .shake {
    animation: shake 0.24s ease-in-out;
  }
  .cardHover {
    transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
  }
  .cardHover:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(11,29,53,0.16);
    border-color: ${C.blueLight};
  }
  .btnPrimary {
    transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
  }
  .btnPrimary:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(19,84,249,0.26);
  }
  @keyframes fadeUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
  @keyframes zoomIn {
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.18); opacity: 0.4; }
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  @keyframes blink {
    50% { opacity: 0; }
  }
  @keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    50% { transform: translateX(4px); }
    75% { transform: translateX(-2px); }
    100% { transform: translateX(0); }
  }
`;

