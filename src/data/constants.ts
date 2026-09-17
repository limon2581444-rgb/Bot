import { User } from '../types';

export const ADMIN_EMAIL = 'limon2581444@gmail.com';
export const ADMIN_PASSWORD = 'limonAbc123';
export const TELEGRAM_USERNAME = 'dropper_sabbir';
export const TELEGRAM_URL = 'https://t.me/dropper_sabbir';

export const FREE_BOT_URL =
  "javascript:(function(){if(document.getElementById(\"tl-btn\"))return;let e=document.createElement(\"canvas\"),t=e.getContext(\"2d\");e.width=120;e.height=120;t.fillStyle=\"#0a0f1d\";t.beginPath();t.arc(60,60,58,0,2*Math.PI);t.fill();t.lineWidth=4;t.strokeStyle=\"#00f2fe\";t.stroke();t.fillStyle=\"#00f2fe\";t.fillRect(40,65,6,20);t.fillRect(42,55,2,40);t.fillStyle=\"#4facfe\";t.fillRect(57,40,6,35);t.fillRect(59,30,2,55);t.fillStyle=\"#00f2fe\";t.fillRect(74,50,6,25);t.fillRect(76,45,2,35);t.fillStyle=\"#ffffff\";t.font=\"900 13px sans-serif\";t.textAlign=\"center\";t.fillText(\"TRADE\",60,32);t.fillStyle=\"#00f2fe\";t.fillText(\"LENS\",60,100);let n=e.toDataURL(),o=document.createElement(\"div\");o.id=\"tl-btn\";o.style.cssText=\"position:fixed;right:20px;bottom:120px;width:75px;height:75px;border-radius:50%;background:#0a0f1d;border:3px solid #00f2fe;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:bold;cursor:move;text-align:center;box-shadow:0 0 20px rgba(0,242,254,0.6);user-select:none;overflow:hidden;touch-action:none;\";o.innerHTML='<img src=\"'+n+'\" style=\"width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;\">';document.body.appendChild(o);let i=!1,r,c,d,S;o.onpointerdown=e=>{i=!1;o.setPointerCapture(e.pointerId);r=e.clientX;c=e.clientY;let t=o.getBoundingClientRect();d=t.left;S=t.top};o.onpointermove=e=>{if(!i&&Math.abs(e.clientX-r)<4&&Math.abs(e.clientY-c)<4)return;i=!0;let t=d+(e.clientX-r),n=S+(e.clientY-c);o.style.left=Math.max(0,Math.min(t,window.innerWidth-75))+\"px\";o.style.top=Math.max(0,Math.min(n,window.innerHeight-75))+\"px\";o.style.right=\"auto\";o.style.bottom=\"auto\"};o.onpointerup=e=>{i=!1;try{o.releasePointerCapture(e.pointerId)}catch(t){}};o.onclick=e=>{e.preventDefault();e.stopPropagation()}})();";
export const PAID_BOT_URL =
  "javascript:(function(){if(document.getElementById(\"tl-btn\"))return;let e=document.createElement(\"canvas\"),t=e.getContext(\"2d\");e.width=120;e.height=120;t.fillStyle=\"#0a0f1d\";t.beginPath();t.arc(60,60,58,0,2*Math.PI);t.fill();t.lineWidth=4;t.strokeStyle=\"#00f2fe\";t.stroke();t.fillStyle=\"#00f2fe\";t.fillRect(40,65,6,20);t.fillRect(42,55,2,40);t.fillStyle=\"#4facfe\";t.fillRect(57,40,6,35);t.fillRect(59,30,2,55);t.fillStyle=\"#00f2fe\";t.fillRect(74,50,6,25);t.fillRect(76,45,2,35);t.fillStyle=\"#ffffff\";t.font=\"900 13px sans-serif\";t.textAlign=\"center\";t.fillText(\"TRADE\",60,32);t.fillStyle=\"#00f2fe\";t.fillText(\"LENS\",60,100);let n=e.toDataURL(),o=document.createElement(\"div\");o.id=\"tl-btn\";o.style.cssText=\"position:fixed;right:20px;bottom:120px;width:75px;height:75px;border-radius:50%;background:#0a0f1d;border:3px solid #00f2fe;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:bold;cursor:pointer;text-align:center;box-shadow:0 0 20px rgba(0,242,254,0.6);user-select:none;overflow:hidden;touch-action:none;\";let L=document.createElement(\"div\");L.id=\"tl-full-scan\";L.style.cssText=\"position:fixed;left:0;top:0;width:100vw;height:4px;background:#00f2fe;box-shadow:0 0 15px #00f2fe, 0 0 30px #00f2fe;z-index:9999999;display:none;pointer-events:none;\";document.body.appendChild(L);if(!document.getElementById(\"tl-full-scan-style\")){let s=document.createElement(\"style\");s.id=\"tl-full-scan-style\";s.innerHTML=\"@keyframes tlFullScan { 0% { top: 0%; } 50% { top: calc(100vh - 4px); } 100% { top: 0%; } }\";document.head.appendChild(s)}function l(){o.innerHTML='<img src=\"'+n+'\" style=\"width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;\">';o.style.background=\"#0a0f1d\"}l();document.body.appendChild(o);let i=!1,s=!1,a=!1,r,c,d,S;o.onpointerdown=e=>{i=!1;s=!1;o.setPointerCapture(e.pointerId);r=e.clientX;c=e.clientY;let t=o.getBoundingClientRect();d=t.left;S=t.top};o.onpointermove=e=>{if(!i&&Math.abs(e.clientX-r)<4&&Math.abs(e.clientY-c)<4)return;i=!0;s=!0;let t=d+(e.clientX-r),n=S+(e.clientY-c);o.style.left=Math.max(0,Math.min(t,window.innerWidth-75))+\"px\";o.style.top=Math.max(0,Math.min(n,window.innerHeight-75))+\"px\";o.style.right=\"auto\";o.style.bottom=\"auto\"};o.onpointerup=e=>{i=!1;try{o.releasePointerCapture(e.pointerId)}catch(t){}};function T(e){let t=null,n=Array.from(document.querySelectorAll(\"button, div, a\"));if(\"UP\"===e)t=n.find(e=>e.textContent.trim()===\"Up\"||e.textContent.trim()===\"Yukarıda\"||e.classList.contains(\"btn-call\"));else if(\"DOWN\"===e)t=n.find(e=>e.textContent.trim()===\"Down\"||e.textContent.trim()===\"Altında\"||e.classList.contains(\"btn-put\"));if(t){let e=[\"pointerdown\",\"mousedown\",\"touchstart\",\"pointerup\",\"mouseup\",\"touchend\",\"click\"];e.forEach(e=>{try{t.dispatchEvent(new MouseEvent(e,{bubbles:!0,cancelable:!0,view:window}))}catch(n){}})}else console.warn(\"Button not found\")}o.onclick=async()=>{if(s||a)return;a=!0;o.innerHTML=\"<span style='font-size:10px;'>Scanning...</span>\";L.style.display=\"block\";L.style.animation=\"tlFullScan 2s linear 1\";await new Promise(e=>setTimeout(e,2000));L.style.display=\"none\";L.style.animation=\"\";let e=Math.random()>.5?\"UP\":\"DOWN\";T(e);o.style.background=\"UP\"===e?\"#16a34a\":\"#dc2626\";let t=10;o.innerHTML=\"<div>\"+e+'</div><div style=\"font-size:11px;margin-top:2px;font-weight:normal;\">'+t+\"s</div>\";let n=setInterval(()=>{--t>0?o.innerHTML=\"<div>\"+e+'</div><div style=\"font-size:11px;margin-top:2px;font-weight:normal;\">'+t+\"s</div>\":(clearInterval(n),l(),a=!1)},1000)}})();";

export const INITIAL_USERS: User[] = [
  {
    email: 'alex.crypto@gmail.com',
    password: 'password123',
    status: 'pending',
    payment: {
      amount: 15,
      method: 'Binance',
      date: '2026-09-16 18:42:10',
    },
    created: '2026-09-16 18:30:00',
  },
  {
    email: 'vip.trader@gmail.com',
    password: 'password123',
    status: 'approved',
    payment: {
      amount: 30,
      method: 'bKash',
      date: '2026-09-15 11:20:00',
    },
    created: '2026-09-15 11:00:00',
  },
  {
    email: 'starter.user@gmail.com',
    password: 'password123',
    status: 'active',
    payment: null,
    created: '2026-09-17 08:15:00',
  },
];
