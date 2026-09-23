import { User } from '../types';

export const TELEGRAM_USERNAME = 'dropper_sabbir';
export const TELEGRAM_URL = 'https://t.me/dropper_sabbir';

export const FREE_BOT_URL =
  "javascript:(function(){if(document.getElementById(\"tl-btn\"))return;let e=document.createElement(\"canvas\"),t=e.getContext(\"2d\");e.width=120;e.height=120;t.fillStyle=\"#0a0f1d\";t.beginPath();t.arc(60,60,58,0,2*Math.PI);t.fill();t.lineWidth=4;t.strokeStyle=\"#00f2fe\";t.stroke();t.fillStyle=\"#00f2fe\";t.fillRect(40,65,6,20);t.fillRect(42,55,2,40);t.fillStyle=\"#4facfe\";t.fillRect(57,40,6,35);t.fillRect(59,30,2,55);t.fillStyle=\"#00f2fe\";t.fillRect(74,50,6,25);t.fillRect(76,45,2,35);t.fillStyle=\"#ffffff\";t.font=\"900 13px sans-serif\";t.textAlign=\"center\";t.fillText(\"TRADE\",60,32);t.fillStyle=\"#00f2fe\";t.fillText(\"LENS\",60,100);let n=e.toDataURL(),o=document.createElement(\"div\");o.id=\"tl-btn\";o.style.cssText=\"position:fixed;right:20px;bottom:120px;width:75px;height:75px;border-radius:50%;background:#0a0f1d;border:3px solid #00f2fe;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:bold;cursor:move;text-align:center;box-shadow:0 0 20px rgba(0,242,254,0.6);user-select:none;overflow:hidden;touch-action:none;\";o.innerHTML='<img src=\"'+n+'\" style=\"width:100%;height:100%;object-fit:cover;border-radius:50%;pointer-events:none;\">';document.body.appendChild(o);let i=!1,r,c,d,S;o.onpointerdown=e=>{i=!1;o.setPointerCapture(e.pointerId);r=e.clientX;c=e.clientY;let t=o.getBoundingClientRect();d=t.left;S=t.top};o.onpointermove=e=>{if(!i&&Math.abs(e.clientX-r)<4&&Math.abs(e.clientY-c)<4)return;i=!0;let t=d+(e.clientX-r),n=S+(e.clientY-c);o.style.left=Math.max(0,Math.min(t,window.innerWidth-75))+\"px\";o.style.top=Math.max(0,Math.min(n,window.innerHeight-75))+\"px\";o.style.right=\"auto\";o.style.bottom=\"auto\"};o.onpointerup=e=>{i=!1;try{o.releasePointerCapture(e.pointerId)}catch(t){}};o.onclick=e=>{e.preventDefault();e.stopPropagation()}})();";

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
