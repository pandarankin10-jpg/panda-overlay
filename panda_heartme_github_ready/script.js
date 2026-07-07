const overlay = document.getElementById("overlay");
const statusBox = document.getElementById("status");

// Change these if you want:
const HEARTS_PER_LIKE_EVENT = 4;
const HEARTS_PER_TEST_BURST = 8;
const SHOW_STATUS = true;

// TikFinity local WebSocket attempts.
// Different TikFinity versions/setups may use different local ports.
// This overlay also works as a visual test even if it cannot connect.
const SOCKET_URLS = [
  "ws://localhost:21213/",
  "ws://127.0.0.1:21213/",
  "ws://localhost:21214/",
  "ws://127.0.0.1:21214/"
];

function setStatus(text) {
  if (!SHOW_STATUS) {
    statusBox.style.display = "none";
    return;
  }
  statusBox.textContent = text;
}

function pandaHeartSVG() {
  return `
  <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="greenGlow" cx="35%" cy="25%" r="75%">
        <stop offset="0%" stop-color="#c9ff8a"/>
        <stop offset="45%" stop-color="#39ff14"/>
        <stop offset="100%" stop-color="#098c00"/>
      </radialGradient>
      <filter id="softGlow">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <path filter="url(#softGlow)"
      d="M50 88
         C28 70 8 55 8 34
         C8 20 18 12 30 12
         C40 12 47 18 50 26
         C53 18 60 12 70 12
         C82 12 92 20 92 34
         C92 55 72 70 50 88Z"
      fill="url(#greenGlow)"
      stroke="#a8ff7a"
      stroke-width="3"/>

    <ellipse cx="38" cy="48" rx="10" ry="12" fill="#fff"/>
    <ellipse cx="62" cy="48" rx="10" ry="12" fill="#fff"/>
    <circle cx="35" cy="36" r="9" fill="#111"/>
    <circle cx="65" cy="36" r="9" fill="#111"/>
    <circle cx="50" cy="55" r="23" fill="#fff"/>
    <ellipse cx="41" cy="53" rx="8" ry="10" fill="#111"/>
    <ellipse cx="59" cy="53" rx="8" ry="10" fill="#111"/>
    <circle cx="43" cy="50" r="2.5" fill="#fff"/>
    <circle cx="61" cy="50" r="2.5" fill="#fff"/>
    <ellipse cx="50" cy="61" rx="4" ry="3" fill="#111"/>
    <path d="M46 67 Q50 72 54 67" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M48 69 Q50 73 52 69" stroke="#ff5f93" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M30 22 C40 12 48 20 50 27" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

function spawnHeart(xPercent = null) {
  const heart = document.createElement("div");
  heart.className = "heart";
  heart.innerHTML = pandaHeartSVG();

  const x = xPercent ?? (55 + Math.random() * 35); // mostly right side, like TikTok hearts
  heart.style.left = `${x}vw`;

  const duration = 3.2 + Math.random() * 2.2;
  heart.style.animationDuration = `${duration}s`;
  heart.style.setProperty("--scale", (0.65 + Math.random() * 1.15).toFixed(2));
  heart.style.setProperty("--rotate", `${Math.random() * 70 - 35}deg`);
  heart.style.setProperty("--drift", `${Math.random() * 260 - 130}px`);

  overlay.appendChild(heart);
  setTimeout(() => heart.remove(), duration * 1000);
}

function burst(count = HEARTS_PER_LIKE_EVENT) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnHeart(), i * 70);
  }
}

// Test burst when you click the page.
document.addEventListener("click", () => burst(HEARTS_PER_TEST_BURST));

// Demo burst every few seconds so you can confirm it works in GitHub Pages / LIVE Studio.
setInterval(() => burst(2), 2500);

// Try to connect to TikFinity local WebSocket.
let socketIndex = 0;
let socket = null;

function connectTikFinity() {
  if (socketIndex >= SOCKET_URLS.length) {
    setStatus("Demo mode — TikFinity not connected");
    return;
  }

  const url = SOCKET_URLS[socketIndex];
  setStatus(`Trying TikFinity ${url}`);

  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      setStatus("Connected to TikFinity");
    };

    socket.onmessage = (event) => {
      let data = {};
      try {
        data = JSON.parse(event.data);
      } catch {
        data = { raw: event.data };
      }

      const text = JSON.stringify(data).toLowerCase();

      // Broad matching because TikFinity event names can vary by setup/version.
      if (
        text.includes("like") ||
        text.includes("heart") ||
        text.includes("follow") ||
        text.includes("gift")
      ) {
        burst(text.includes("gift") ? 14 : HEARTS_PER_LIKE_EVENT);
      }
    };

    socket.onerror = () => {
      socket.close();
    };

    socket.onclose = () => {
      socketIndex++;
      setTimeout(connectTikFinity, 1000);
    };
  } catch {
    socketIndex++;
    setTimeout(connectTikFinity, 1000);
  }
}

connectTikFinity();
