import { User } from '../types';

export const ADMIN_EMAIL = 'limon2581444@gmail.com';
export const ADMIN_PASSWORD = '00000000';
export const ADMIN_NUMBER = '01712345678';
export const ADMIN_DEMO_ID = '00000000';
export const ADMIN_DEMO_PASS = '00000000';
export const TELEGRAM_USERNAME = 'dropper_sabbir';
export const TELEGRAM_URL = 'https://t.me/dropper_sabbir';
export const BKASH_NUMBER = '01568760651';

export const FREE_BOT_URL =
  "javascript:(function(){if(document.getElementById(\"tl-btn\"))return;let e=document.createElement(\"canvas\"),t=e.getContext(\"2d\");e.width=120;e.height=120;t.fillStyle=\"#0a0f1d\";t.beginPath();t.arc(60,60,58,0,2*Math.PI);t.fill();t.lineWidth=4;t.strokeStyle=\"#00f2fe\";t.stroke();t.fillStyle=\"#00f2fe\";t.fillRect(40,65,6,20);t.fillRect(42,55,2,40);t.fillStyle=\"#4facfe\";t.fillRect(57,40,6,35);t.fillRect(59,30,2,55);t.fillStyle=\"#00f2fe\";t.fillRect(74,50,6,25);t.fillRect(76,45,2,35);t.fillStyle=\"#ffffff\";t.font=\"900 13px sans-serif\";t.textAlign=\"center\";t.fillText(\"TRADE\",60,32);t.fillStyle=\"#00f2fe\";t.fillText(\"LENS\",60,100);let n=e.toDataURL(),o=document.createElement(\"div\");o.id=\"tl-btn\";o.style.cssText=\"position:fixed;right:20px;bottom:120px;width:75px;height:75px;border-radius:50%;background:#0a0f1d;border:3px solid #00f2fe;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:bold;cursor:move;text-align:center;box-shadow:0 0 20px rgba(0,242,254,0.6);user-select:none;overflow:hidden;touch-action:none;\";o.innerHTML='<img src=\"'+n+'\" style=\"width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;\">';document.body.appendChild(o);let i=!1,r,c,d,S;o.onpointerdown=e=>{i=!1;o.setPointerCapture(e.pointerId);r=e.clientX;c=e.clientY;let t=o.getBoundingClientRect();d=t.left;S=t.top};o.onpointermove=e=>{if(!i&&Math.abs(e.clientX-r)<4&&Math.abs(e.clientY-c)<4)return;i=!0;let t=d+(e.clientX-r),n=S+(e.clientY-c);o.style.left=Math.max(0,Math.min(t,window.innerWidth-75))+\"px\";o.style.top=Math.max(0,Math.min(n,window.innerHeight-75))+\"px\";o.style.right=\"auto\";o.style.bottom=\"auto\"};o.onpointerup=e=>{i=!1;try{o.releasePointerCapture(e.pointerId)}catch(t){}};o.onclick=e=>{e.preventDefault();e.stopPropagation()}})();";
export const PAID_BOT_URL =
  `javascript:(function(){if(document.getElementById("tl-btn"))return;let e=document.createElement("canvas"),t=e.getContext("2d");e.width=120;e.height=120;t.fillStyle="#0a0f1d";t.beginPath();t.arc(60,60,58,0,2*Math.PI);t.fill();t.lineWidth=4;t.strokeStyle="#00f2fe";t.stroke();t.fillStyle="#00f2fe";t.fillRect(40,65,6,20);t.fillRect(42,55,2,40);t.fillStyle="#4facfe";t.fillRect(57,40,6,35);t.fillRect(59,30,2,55);t.fillStyle="#00f2fe";t.fillRect(74,50,6,25);t.fillRect(76,45,2,35);t.fillStyle="#ffffff";t.font="900 13px sans-serif";t.textAlign="center";t.fillText("TRADE",60,32);t.fillStyle="#00f2fe";t.fillText("LENS",60,100);let n=e.toDataURL(),o=document.createElement("div");o.id="tl-btn";o.style.cssText="position:fixed;right:20px;bottom:120px;width:75px;height:75px;border-radius:50%;background:#0a0f1d;border:3px solid #00f2fe;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:bold;cursor:pointer;text-align:center;box-shadow:0 0 20px rgba(0,242,254,0.6);user-select:none;overflow:hidden;touch-action:none;";let L=document.createElement("div");L.id="tl-full-scan";L.style.cssText="position:fixed;top:0;left:0;width:250vw;height:250vh;background:linear-gradient(135deg, rgba(255,255,255,0) 25%, rgba(0,242,254,0.3) 40%, rgba(255,255,255,0.9) 50%, rgba(34,197,94,0.6) 60%, rgba(255,255,255,0) 75%);box-shadow:0 0 100px rgba(255,255,255,0.8), inset 0 0 80px rgba(0,242,254,0.7);z-index:9999999;display:none;pointer-events:none;";document.body.appendChild(L);if(!document.getElementById("tl-full-scan-style")){let s=document.createElement("style");s.id="tl-full-scan-style";s.innerHTML="@keyframes tlMirrorFlash { 0% { transform: translate(60vw, -70vh); } 100% { transform: translate(-70vw, 60vh); } }";document.head.appendChild(s)}function playBeep(){try{let ctx=new(window.AudioContext||window.webkitAudioContext)();let now=ctx.currentTime;[523.25,659.25,783.99,1046.50].forEach((freq,idx)=>{let osc=ctx.createOscillator();let gain=ctx.createGain();osc.type="sine";osc.frequency.setValueAtTime(freq,now+idx*0.08);gain.gain.setValueAtTime(0,now+idx*0.08);gain.gain.linearRampToValueAtTime(0.06,now+idx*0.08+0.04);gain.gain.exponentialRampToValueAtTime(0.001,now+idx*0.08+0.7);osc.connect(gain);gain.connect(ctx.destination);osc.start(now+idx*0.08);osc.stop(now+idx*0.08+0.8)})}catch(e){}}function l(){o.innerHTML='<img src="'+n+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;">';o.style.background="#0a0f1d"}l();document.body.appendChild(o);let i=!1,s=!1,a=!1,r,c,d,S;o.onpointerdown=e=>{i=!1;s=!1;o.setPointerCapture(e.pointerId);r=e.clientX;c=e.clientY;let t=o.getBoundingClientRect();d=t.left;S=t.top};o.onpointermove=e=>{if(!i&&Math.abs(e.clientX-r)<4&&Math.abs(e.clientY-c)<4)return;i=!0;s=!0;let t=d+(e.clientX-r),n=S+(e.clientY-c);o.style.left=Math.max(0,Math.min(t,window.innerWidth-75))+"px";o.style.top=Math.max(0,Math.min(n,window.innerHeight-75))+"px";o.style.right="auto";o.style.bottom="auto"};o.onpointerup=e=>{i=!1;try{o.releasePointerCapture(e.pointerId)}catch(t){}};function T(e){let all=Array.from(document.querySelectorAll('*')),target=null;if("UP"===e){target=all.find(el=>el.childElementCount===0&&(el.innerText||el.textContent||"").trim().toUpperCase()==="BUY"||el.classList.contains("btn-success")||el.classList.contains("btn-call"))}else{target=all.find(el=>el.childElementCount===0&&(el.innerText||el.textContent||"").trim().toUpperCase()==="SELL"||el.classList.contains("btn-danger")||el.classList.contains("btn-put"))}if(!target){let buttons=Array.from(document.querySelectorAll("button"));if("UP"===e)target=buttons[buttons.length-2];else target=buttons[buttons.length-1]}if(target){let rect=target.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;['pointerdown','mousedown','touchstart','pointerup','mouseup','touchend','click'].forEach(evt=>{let evOptions={bubbles:!0,cancelable:!0,view:window,clientX:cx,clientY:cy};let event;if(evt.startsWith('touch')){event=new Event(evt,{bubbles:!0,cancelable:!0});event.touches=[{clientX:cx,clientY:cy}]}else{event=new MouseEvent(evt,evOptions)}target.dispatchEvent(event)})}else{console.warn("Element not found")}}o.onclick=async()=>{if(s||a)return;a=!0;o.innerHTML="<span style='font-size:10px;'>Scanning...</span>";L.style.display="block";L.style.animation="tlMirrorFlash 2s linear 1";playBeep();await new Promise(e=>setTimeout(e,2000));L.style.display="none";L.style.animation="";let e=Math.random()>.5?"UP":"DOWN";T(e);o.style.background="UP"===e?"#16a34a":"#dc2626";let t=10;o.innerHTML="<div>"+e+'</div><div style="font-size:11px;margin-top:2px;font-weight:normal;">'+t+"s</div>";let n=setInterval(()=>{--t>0?o.innerHTML="<div>"+e+'</div><div style="font-size:11px;margin-top:2px;font-weight:normal;">'+t+"s</div>":(clearInterval(n),l(),a=!1)},1000)}})();`;

export const INITIAL_USERS: User[] = [
  {
    email: 'alex.crypto@gmail.com',
    status: 'pending',
    payment: {
      amount: 30,
      method: 'Binance',
      transactionId: 'TX789218490B',
      date: '2026-09-20 14:22:10',
    },
    created: '2026-09-20 14:10:00',
    createdAt: '2026-09-20T14:10:00Z',
  },
  {
    email: 'vip.trader@gmail.com',
    status: 'active',
    proAccess: true,
    payment: {
      amount: 35,
      method: 'bKash',
      transactionId: 'BK994821034A',
      date: '2026-09-18 11:20:00',
    },
    created: '2026-09-18 11:00:00',
    createdAt: '2026-09-18T11:00:00Z',
    activeDate: '2026-09-18 11:25:00',
    activeAt: '2026-09-18T11:25:00Z',
  },
  {
    email: 'starter.user@gmail.com',
    status: 'active',
    payment: null,
    created: '2026-09-21 08:15:00',
    createdAt: '2026-09-21T08:15:00Z',
  },
];
