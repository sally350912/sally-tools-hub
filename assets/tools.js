/* ============================================================
   工具引擎 — 各工具內頁呼叫 Atelier.xxx(mountEl) 掛載
   全部純前端、零成本；AI 類只產 prompt 給使用者貼進自己的 AI
   ============================================================ */
window.Atelier = (function(){
  const NT = n => 'NT$ ' + Math.round(n).toLocaleString('en-US');
  function toast(msg){
    let t=document.getElementById('a-toast');
    if(!t){ t=document.createElement('div'); t.id='a-toast'; document.body.appendChild(t);
      t.style.cssText='position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#3E5C76;color:#F6F1E8;padding:11px 20px;border-radius:2px;font-size:.82rem;letter-spacing:.12em;opacity:0;transition:opacity .2s;z-index:9999;pointer-events:none'; }
    t.textContent=msg; t.style.opacity='1'; clearTimeout(t._h); t._h=setTimeout(()=>t.style.opacity='0',1600);
  }
  function copy(text){ navigator.clipboard.writeText(text); toast('已複製'); }

  /* ---------- 字數檢查 ---------- */
  const PLATFORMS=[{nm:'Threads',max:500},{nm:'X / Twitter',max:280},{nm:'IG 個人簡介 Bio',max:150},{nm:'LINE 群發訊息',max:500},{nm:'IG 貼文文案',max:2200}];
  function wordCount(el){
    el.innerHTML=`<label class="field"><span class="lab">把貼文貼進來</span><textarea id="wc-in" placeholder="貼上你的貼文…"></textarea></label>
      <div class="t-stats"><div><b id="wc-t">0</b><span class="s">總字數</span></div><div><b id="wc-ns">0</b><span class="s">不含空白換行</span></div><div><b id="wc-ln">0</b><span class="s">行數</span></div></div>
      <div id="wc-pl"></div>`;
    const inp=el.querySelector('#wc-in');
    el.querySelector('#wc-pl').innerHTML=PLATFORMS.map((p,i)=>`<div class="plat"><div class="plat-top"><span>${p.nm}</span><span class="ct" id="wc-c${i}">0 / ${p.max}</span></div><div class="bar"><span id="wc-b${i}" class="none" style="width:0%"></span></div></div>`).join('');
    function run(){
      const v=inp.value, total=[...v].length, ns=[...v.replace(/\s/g,'')].length, ln=v.length?v.split('\n').length:0;
      el.querySelector('#wc-t').textContent=total; el.querySelector('#wc-ns').textContent=ns; el.querySelector('#wc-ln').textContent=ln;
      PLATFORMS.forEach((p,i)=>{ const over=total>p.max, c=el.querySelector('#wc-c'+i), b=el.querySelector('#wc-b'+i);
        c.textContent=`${total} / ${p.max}`+(over?`（超 ${total-p.max}）`:''); c.className='ct'+(over?' over':'');
        b.style.width=Math.min(100,total/p.max*100)+'%'; b.className=total===0?'none':(over?'over':''); });
    }
    inp.addEventListener('input',run); run();
  }

  /* ---------- 接案報價計算 ---------- */
  function quote(el){
    el.innerHTML=`<label class="field" style="max-width:200px"><span class="lab">時薪（NT$／小時）</span><input type="number" id="q-rate" value="800" min="0"></label>
      <div class="qhead"><span>工作項目</span><span>工時(h)</span><span></span></div><div id="q-rows"></div>
      <button class="t-btn sec" id="q-add" style="margin-top:6px">＋ 加一列</button>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin:16px 0">
        <label class="field" style="flex:1;min-width:130px;margin:0"><span class="lab">急件加成（%）</span><input type="number" id="q-rush" value="0" min="0"></label>
        <label class="field" style="flex:1;min-width:130px;margin:0"><span class="lab">其他費用（NT$）</span><input type="number" id="q-misc" value="0" min="0"></label></div>
      <div class="qtotal"><div class="line"><span>總工時</span><span id="q-h">0 h</span></div><div class="line"><span>人力小計</span><span id="q-sub">NT$ 0</span></div>
        <div class="line" id="q-rl" style="display:none"><span>急件加成</span><span id="q-ra">NT$ 0</span></div><div class="line" id="q-ml" style="display:none"><span>其他費用</span><span id="q-ma">NT$ 0</span></div>
        <div class="line" style="margin-top:10px"><span style="color:var(--ink)">報價總計</span><span class="grand" id="q-g">NT$ 0</span></div></div>
      <div class="t-row"><button class="t-btn" id="q-copy">複製報價說明</button></div>
      <div class="t-out" id="q-out"></div>
      <div class="t-note">給接案的你：時薪設成「想要的月收入 ÷ 可工作時數」，報價就不會做白工。</div>`;
    const rows=el.querySelector('#q-rows');
    function addRow(n='',h=''){ const d=document.createElement('div'); d.className='qrow';
      d.innerHTML=`<input type="text" class="r-n" placeholder="例：首頁設計" value="${n}"><input type="number" class="r-h" placeholder="0" min="0" value="${h}"><button class="del">✕</button>`;
      d.querySelector('.del').onclick=()=>{d.remove();calc();}; d.querySelectorAll('input').forEach(i=>i.addEventListener('input',calc)); rows.appendChild(d); }
    function calc(){
      const rate=+el.querySelector('#q-rate').value||0, rush=+el.querySelector('#q-rush').value||0, misc=+el.querySelector('#q-misc').value||0;
      let hours=0, items=[]; rows.querySelectorAll('.qrow').forEach(r=>{ const nm=r.querySelector('.r-n').value.trim(), hr=+r.querySelector('.r-h').value||0; hours+=hr; if(nm||hr) items.push({nm:nm||'未命名項目',hr,sub:hr*rate}); });
      const sub=hours*rate, ra=sub*rush/100, g=sub+ra+misc;
      el.querySelector('#q-h').textContent=hours+' h'; el.querySelector('#q-sub').textContent=NT(sub); el.querySelector('#q-g').textContent=NT(g);
      el.querySelector('#q-rl').style.display=rush>0?'flex':'none'; el.querySelector('#q-ra').textContent='+'+NT(ra);
      el.querySelector('#q-ml').style.display=misc>0?'flex':'none'; el.querySelector('#q-ma').textContent='+'+NT(misc);
      let out='【報價說明】\n———\n'; items.forEach(it=>out+=`・${it.nm}　${it.hr}h × ${NT(rate)} ＝ ${NT(it.sub)}\n`);
      out+=`———\n總工時：${hours} h\n人力小計：${NT(sub)}\n`; if(rush>0) out+=`急件加成 ${rush}%：+${NT(ra)}\n`; if(misc>0) out+=`其他費用：+${NT(misc)}\n`;
      out+=`\n報價總計：${NT(g)}\n（本報價未稅，有效期 14 天）`;
      el.querySelector('#q-out').textContent=items.length?out:'（填入項目後自動產生報價說明）';
    }
    el.querySelector('#q-add').onclick=()=>addRow();
    ['#q-rate','#q-rush','#q-misc'].forEach(s=>el.querySelector(s).addEventListener('input',calc));
    el.querySelector('#q-copy').onclick=()=>{ const t=el.querySelector('#q-out').textContent; if(!t||t.startsWith('（')){toast('先填工作項目');return;} copy(t); };
    addRow('首頁設計',6); addRow('內頁切版',4); calc();
  }

  /* ---------- 通用 Prompt 產生器 ---------- */
  function prompt(el, cfg){
    el.innerHTML = cfg.fields.map(f=>{
      let input;
      if(f.type==='textarea') input=`<textarea data-f="${f.id}" placeholder="${f.ph||''}"></textarea>`;
      else if(f.type==='select') input=`<select data-f="${f.id}">${f.options.map(o=>`<option>${o}</option>`).join('')}</select>`;
      else input=`<input type="text" data-f="${f.id}" placeholder="${f.ph||''}">`;
      return `<label class="field"><span class="lab">${f.label}</span>${input}</label>`;
    }).join('') + `<label class="field"><span class="lab">產生的 Prompt</span><div class="t-out" id="pp"></div></label>
      <div class="t-row"><button class="t-btn" id="pc">複製 Prompt</button><a class="t-btn sec" href="https://chatgpt.com" target="_blank" rel="noopener" style="text-decoration:none">ChatGPT ↗</a><a class="t-btn sec" href="https://claude.ai/new" target="_blank" rel="noopener" style="text-decoration:none">Claude ↗</a></div>
      <div class="t-note">此工具<b>不呼叫 AI、不花錢、不收資料</b>，只幫你把問題問對。複製後貼進你慣用的 AI 即可。</div>`;
    function build(){ const v={}; el.querySelectorAll('[data-f]').forEach(x=>v[x.dataset.f]=x.value.trim()); el.querySelector('#pp').textContent=cfg.tpl(v); }
    el.querySelectorAll('[data-f]').forEach(x=>{ x.addEventListener('input',build); x.addEventListener('change',build); });
    el.querySelector('#pc').onclick=()=>copy(el.querySelector('#pp').textContent);
    build();
  }

  /* ---------- 決策轉盤 ---------- */
  function wheel(el){
    el.innerHTML = `<span class="lab" style="display:block;margin-bottom:8px">選項（每個一格，2 個以上就能轉）</span>
      <div id="wh-rows"></div>
      <button class="t-btn sec" id="wh-add" style="margin:2px 0 4px">＋ 加一個選項</button>
      <div style="display:flex;flex-direction:column;align-items:center;gap:18px;margin-top:16px">
        <div style="position:relative;width:300px;max-width:82vw;aspect-ratio:1">
          <div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%);z-index:2;font-size:28px;color:var(--ocean);line-height:1">▼</div>
          <canvas id="wh-cv" width="600" height="600" style="width:100%;height:100%;display:block"></canvas>
        </div>
        <button class="t-btn" id="wh-go">轉一下 🎯</button>
        <div id="wh-res" style="font-family:var(--brush);font-size:1.5rem;color:var(--ocean);min-height:1.6em;text-align:center"></div>
      </div>
      <div class="t-note">把「想太多」變成「先動再說」。轉到哪就先做那個，不甘心再轉一次也行。</div>`;
    const cv=el.querySelector('#wh-cv'), ctx=cv.getContext('2d'), rowsWrap=el.querySelector('#wh-rows');
    const COLORS=['#E8845A','#D9A441','#8FA07E','#6E8CA0','#C77B6B','#B5894E','#A88FB0','#E0A878'];
    let opts=[], rot=0, spinning=false;
    const readOpts=()=>{ opts=[...rowsWrap.querySelectorAll('input')].map(i=>i.value.trim()).filter(Boolean); };
    function addRow(val=''){
      const d=document.createElement('div'); d.style.cssText='display:flex;gap:8px;margin-bottom:8px';
      d.innerHTML=`<input type="text" placeholder="輸入一個選項" value="${String(val).replace(/"/g,'&quot;')}" style="flex:1"><button class="t-btn sec" title="刪除" style="flex:0 0 auto;padding:9px 13px">✕</button>`;
      d.querySelector('input').addEventListener('input',()=>{ readOpts(); draw(); });
      d.querySelector('button').onclick=()=>{ d.remove(); readOpts(); draw(); };
      rowsWrap.appendChild(d);
    }
    function draw(){
      ctx.clearRect(0,0,600,600); const n=opts.length; if(!n) return;
      const cx=300, cy=300, r=288, seg=Math.PI*2/n;
      for(let i=0;i<n;i++){
        const a0=rot+i*seg;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,a0,a0+seg); ctx.closePath();
        ctx.fillStyle=COLORS[i%COLORS.length]; ctx.fill();
        ctx.strokeStyle='#FBF7F1'; ctx.lineWidth=3; ctx.stroke();
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(a0+seg/2);
        ctx.textAlign='right'; ctx.fillStyle='#2B2622'; ctx.font='600 22px "Noto Sans TC",sans-serif';
        const t=opts[i].length>11?opts[i].slice(0,11)+'…':opts[i];
        ctx.fillText(t, r-20, 8); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(cx,cy,36,0,Math.PI*2); ctx.fillStyle='#FBF7F1'; ctx.fill();
      ctx.strokeStyle='#E8845A'; ctx.lineWidth=4; ctx.stroke();
    }
    function result(){
      const n=opts.length, seg=Math.PI*2/n; let a=(-Math.PI/2-rot)%(Math.PI*2); if(a<0)a+=Math.PI*2;
      el.querySelector('#wh-res').textContent='→ '+opts[Math.floor(a/seg)%n];
    }
    function spin(){
      readOpts(); if(opts.length<2){ toast('至少給 2 個選項'); return; } if(spinning) return;
      spinning=true; el.querySelector('#wh-res').textContent='';
      const dur=3400+Math.random()*900, t0=performance.now(), from=rot, to=from+(5+Math.random()*3)*Math.PI*2;
      const ease=t=>1-Math.pow(1-t,3);
      (function f(now){ const p=Math.min(1,(now-t0)/dur); rot=from+(to-from)*ease(p); draw();
        if(p<1) requestAnimationFrame(f); else { spinning=false; result(); } })(t0);
    }
    el.querySelector('#wh-go').onclick=spin;
    el.querySelector('#wh-add').onclick=()=>addRow('');
    ['看 Netflix 放空','出門走走','讀那本買很久的書','睡個回籠覺','找朋友聊天','動手做工具室的新工具'].forEach(addRow);
    readOpts(); draw();
  }

  /* ---------- 行程規劃分享器 ---------- */
  function itinerary(el){
    const esc=s=>String(s).replace(/"/g,'&quot;');
    el.innerHTML = `<label class="field"><span class="lab">行程標題</span><input type="text" id="it-title" value="今天的行程"></label>
      <span class="lab" style="display:block;margin-bottom:8px">行程項目（時間＋內容；內容可直接貼網址：地圖、訂位、報名連結）</span>
      <div id="it-rows"></div>
      <div class="t-row" style="margin-top:0">
        <button class="t-btn sec" id="it-add">＋ 加一行</button>
        <button class="t-btn sec" id="it-sort">⏱ 依時間排序</button>
      </div>
      <label class="field" style="margin-top:18px"><span class="lab">預覽（可複製貼到 LINE）</span><div class="t-out" id="it-out"></div></label>
      <div class="t-row"><button class="t-btn" id="it-copy">複製成 LINE 備忘錄</button></div>
      <div class="t-note">用 ↑ ↓ 調整順序、✕ 刪除；按「依時間排序」自動由早到晚排好。整理好的文字直接貼進 LINE 就是一張行程備忘錄。</div>`;
    const rows=el.querySelector('#it-rows');
    function addRow(t='',c=''){
      const d=document.createElement('div'); d.className='it-row'; d.style.cssText='display:flex;gap:6px;margin-bottom:8px;align-items:center';
      d.innerHTML=`<input type="text" class="it-t" placeholder="09:00" value="${esc(t)}" style="flex:0 0 74px;text-align:center">
        <input type="text" class="it-c" placeholder="活動／地點／網址" value="${esc(c)}" style="flex:1">
        <button class="t-btn sec it-up" title="上移" style="flex:0 0 auto;padding:8px 10px">↑</button>
        <button class="t-btn sec it-dn" title="下移" style="flex:0 0 auto;padding:8px 10px">↓</button>
        <button class="t-btn sec it-del" title="刪除" style="flex:0 0 auto;padding:8px 10px">✕</button>`;
      d.querySelectorAll('input').forEach(i=>i.addEventListener('input',render));
      d.querySelector('.it-up').onclick=()=>{ const p=d.previousElementSibling; if(p) rows.insertBefore(d,p); render(); };
      d.querySelector('.it-dn').onclick=()=>{ const n=d.nextElementSibling; if(n) rows.insertBefore(n,d); render(); };
      d.querySelector('.it-del').onclick=()=>{ d.remove(); render(); };
      rows.appendChild(d);
    }
    const data=()=>[...rows.querySelectorAll('.it-row')].map(r=>({t:r.querySelector('.it-t').value.trim(),c:r.querySelector('.it-c').value.trim()})).filter(x=>x.t||x.c);
    function build(){
      const title=el.querySelector('#it-title').value.trim()||'今天的行程';
      const items=data(); let out='📅 '+title+'\n━━━━━━━━━━━\n';
      if(!items.length){ out+='（還沒有項目）\n'; }
      items.forEach(x=>{
        const isUrl=/^https?:\/\//i.test(x.c);
        if(x.t&&x.c){ out+= isUrl ? ('🕒 '+x.t+'\n　🔗 '+x.c+'\n') : ('🕒 '+x.t+'　'+x.c+'\n'); }
        else if(x.t){ out+='🕒 '+x.t+'\n'; }
        else { out+= isUrl ? ('🔗 '+x.c+'\n') : ('・'+x.c+'\n'); }
      });
      out+='━━━━━━━━━━━';
      return out;
    }
    function render(){ el.querySelector('#it-out').textContent=build(); }
    function sortByTime(){
      const arr=[...rows.querySelectorAll('.it-row')];
      arr.sort((a,b)=>(a.querySelector('.it-t').value.trim()||'99:99').localeCompare(b.querySelector('.it-t').value.trim()||'99:99'));
      arr.forEach(r=>rows.appendChild(r)); render();
    }
    el.querySelector('#it-add').onclick=()=>addRow();
    el.querySelector('#it-sort').onclick=sortByTime;
    el.querySelector('#it-title').addEventListener('input',render);
    el.querySelector('#it-copy').onclick=()=>{ if(data().length){ copy(build()); } else toast('先加幾個行程'); };
    [['09:00','晨間規劃，挑今天最重要的一件事'],['10:30','拜訪／聯繫客戶'],['12:30','午餐＋休息'],['14:00','回訊息、出報價'],['19:30','發一則貼文']].forEach(p=>addRow(p[0],p[1]));
    render();
  }

  /* ---------- 生命靈數 × 溝通對應 ---------- */
  function numerology(el){
    const D={
      '1':{t:'領導者',d:'天生的開創者，獨立、有主見、行動力強，認定目標就往前衝。盲點是固執、不愛被指揮，有時顯得強勢。',talk:['先講結論再講原因，30 秒帶到重點，別鋪陳','給 2-3 個方案讓他自己選，讓決定權在他手上','用「這能讓你更快達標／贏過對手」當訴求','讓他主導節奏，你扮演幫他執行的軍師'],no:'別囉嗦繞圈、別替他做決定、別質疑他的判斷。'},
      '2':{t:'協調者',d:'細膩體貼、善於傾聽與配合，是團隊裡的潤滑劑。重視關係與和諧、怕衝突，容易委屈自己、想太多。',talk:['先閒聊、建立關係，再慢慢進到正事','多問多聽，讓他感覺被理解、被在乎','用「我們一起」「不急，你慢慢考慮」降低壓力','給見證、口碑、別人的好評讓他安心'],no:'別逼單、別給期限壓力、別在他猶豫時硬推。'},
      '3':{t:'表達者',d:'開朗、有創意、感染力強，天生會聊也愛分享。靠感覺做事，優點是有魅力，盲點是三分鐘熱度、情緒起伏大。',talk:['氣氛輕鬆帶點幽默，別一上來就正經','留空間讓他講，適時真心稱讚','用故事、畫面、感受打動，少講枯燥規格','收尾給他「分享出去很有面子」的理由'],no:'別太嚴肅、別潑冷水、別只丟一堆數據。'},
      '4':{t:'實務者',d:'腳踏實地、有紀律、重視規則與安全感，做事可靠。不喜歡變動與冒險，盲點是固執、放不開、糾結細節。',talk:['用數據、案例、白紙黑字的證明說話','流程、步驟、時程講清楚，不要含糊','說到做到、準時、細節到位，慢慢累積信任','主動給規格表、保固、退換條件這類安全感'],no:'別空口說白話、別臨時改規則、別催他快點決定。'},
      '5':{t:'自由者',d:'好奇、靈活、愛冒險，討厭被框住，學東西快、適應力強。盲點是善變、難專一、容易衝動。',talk:['講重點、節奏快，別長篇大論','強調彈性、不綁約、隨時可調整','用新鮮感、限定、新玩法勾起興趣','給他選擇權，別逼他當下承諾'],no:'別一堆規則綁死、別逼長約、別講得又臭又長。'},
      '6':{t:'照顧者',d:'溫暖、有責任感，重視家庭與被需要的感覺，願意付出。盲點是愛操心、容易過度犧牲、對人對己標準都高。',talk:['先關心他在乎的人（家人、團隊），再談產品','強調保障、安心、長期值得','真誠不誇大，他對推銷很敏感','給口碑與「這對家人也好」的角度'],no:'別只顧著賣、別誇大、別忽略他重視的人。'},
      '7':{t:'思考者',d:'理性、愛鑽研、追求真相與深度，需要獨處空間，有洞察力。盲點是多疑、難親近、想太多而慢行動。',talk:['給完整資料讓他自己研究、自己判斷','邏輯要通，能回答他每一個「為什麼」','給他思考空間，別緊迫盯人','用專業與深度贏尊重，別裝熟、別硬聊'],no:'別硬推、別過度熱情、別給沒根據的話術。'},
      '8':{t:'實現者',d:'目標導向、有企圖心，重視成就、金錢與效率，天生會扛責任。盲點是工作狂、控制慾、把價值跟成果綁太緊。',talk:['開門見山先講投報率與結果','尊重他的時間，能 30 秒講完最好','用數字、效率、競爭優勢說話','給他掌控感與尊榮感，別矮化他'],no:'別拖泥帶水、別浪費他時間、別跟他裝熟攀關係。'},
      '9':{t:'理想者',d:'心胸寬大、有同理心，重視意義與付出，想讓事情更好。盲點是想太多、容易心軟、界線不清、理想與現實有落差。',talk:['先談意義、願景、對別人的好處','連結到更大的價值，而不只是錢','真誠、有人情味，他很重感覺','給他「你也在做一件好事」的參與感'],no:'別只談錢、別太現實功利、別逼得太緊。'},
      '11':{t:'啟發者（大師數）',d:'直覺敏銳、有理想與感染力，能啟發別人。但很敏感、容易內耗，理想太高時會給自己很大壓力。',talk:['真誠、有深度，談理念與初衷','給靈感與認同，呼應他的直覺','講「這背後的意義」，別只講功能','語氣放柔，尊重他的敏感'],no:'別敷衍、別只講表面、別太商業氣。'},
      '22':{t:'大建築師（大師數）',d:'兼具大格局與執行力，能把理想真的蓋出來。承擔得多、要求高，壓力大時容易硬撐。',talk:['同時給大藍圖與具體落地步驟','用可執行的計畫與成果說服他','談長期、規模、影響力','尊重他的格局，別只看眼前小利'],no:'別小家子氣、別只談短期、別給空泛承諾。'},
      '33':{t:'大導師（大師數）',d:'充滿愛與奉獻精神，重視教育、療癒與成全別人。容易把別人的事扛在身上，要學會先照顧自己。',talk:['強調對人的幫助、成長與療癒','用溫度與愛溝通，別功利','連結到教育、付出、利他的價值','肯定他的奉獻，別讓他覺得被利用'],no:'別太功利、別冷冰冰、別只談自己的好處。'}
    };
    el.innerHTML=`<label class="field"><span class="lab">輸入生日</span><input type="date" id="nm-date" min="1900-01-01" max="2026-12-31"></label>
      <div class="t-row" style="margin-top:0"><button class="t-btn" id="nm-go">算我的生命靈數</button></div>
      <div id="nm-res" style="margin-top:18px"></div>
      <div class="t-note">生命靈數＝把生日數字一路加總到個位數（11／22／33 為大師數保留）。溝通建議當參考，真人還是要看實際互動 🙂</div>`;
    function calc(ds){ let s=ds.replace(/\D/g,'').split('').reduce((a,b)=>a+ +b,0);
      while(s>9 && ![11,22,33].includes(s)) s=String(s).split('').reduce((a,b)=>a+ +b,0); return s; }
    function show(n){
      const o=D[String(n)]; if(!o) return;
      el.querySelector('#nm-res').innerHTML=`
        <div style="text-align:center;margin-bottom:14px">
          <div style="font-family:var(--brush);font-size:3.6rem;color:var(--ocean);line-height:1">${n}</div>
          <div style="font-family:var(--brush);font-size:1.5rem;margin-top:4px">${o.t}</div>
        </div>
        <p style="margin:0 0 14px;color:var(--ink-soft);text-align:center">${o.d}</p>
        <div class="t-out" style="white-space:normal;line-height:1.95">✅ <b style="color:var(--ocean)">跟這種人溝通這樣做</b><br>${o.talk.map(x=>'・'+x).join('<br>')}<br><br>⚠️ <b style="color:var(--ocean)">地雷</b><br>${o.no}</div>
        <div class="t-row"><button class="t-btn sec" id="nm-copy">複製結果</button></div>`;
      el.querySelector('#nm-copy').onclick=()=>copy(`🔢 生命靈數 ${n}｜${o.t}\n${o.d}\n\n✅ 跟這種人溝通這樣做：\n${o.talk.map(x=>'・'+x).join('\n')}\n\n⚠️ 地雷：${o.no}`);
    }
    el.querySelector('#nm-go').onclick=()=>{ const v=el.querySelector('#nm-date').value; if(!v){ toast('先選生日'); return; } show(calc(v)); };
  }

  /* ---------- Prompt 工具設定（port 自 Notion 業務 AI 工具包）---------- */
  const CONFIGS = {
    dm:{ fields:[
      {id:'industry',label:'行業',type:'select',options:['保險','房仲','電信']},
      {id:'dmtype',label:'DM 類型',type:'select',options:['開發','銷售','節慶問候','回訪喚醒','轉介請託']},
      {id:'me',label:'我是誰（公司／品牌＋專長區域＋資歷）'},
      {id:'target',label:'對方是誰（年齡／身份／痛點／跟我的關係）',type:'textarea'},
      {id:'product',label:'產品／服務（主打方案＋賣點 3 點＋適合對象）',type:'textarea'},
      {id:'cta',label:'主要 CTA（想讓對方做什麼）',ph:'例：預約 15 分鐘諮詢'} ],
      tpl:v=>{
        const R={'保險':{law:'金管會保險業招攬廣告自律規範',ban:'「保證收益」「絕對理賠」「最便宜」「不買就完蛋」'},'房仲':{law:'不動產經紀業管理條例',ban:'「保證最高價」「絕對賣掉」「最後一戶」（除非屬實）、虛報坪數格局'},'電信':{law:'NCC 廣告管理規範',ban:'攻擊競品、隱瞞綁約、不標示優惠期／原價、「業界最強」'}};
        const T={'開發':{rel:'完全陌生／冷名單',goal:'建立信任、邀請低門檻互動',cta:'低（收資料、聊 15 分鐘）',len:'150-250 字'},'銷售':{rel:'溫名單／舊客戶',goal:'推特定商品、促成行動',cta:'高（預約、回電、點擊）',len:'200-300 字'},'節慶問候':{rel:'既有客戶／溫名單',goal:'節日維繫感情、完全不推銷',cta:'低（純祝福、保持聯繫）',len:'80-150 字'},'回訪喚醒':{rel:'舊客戶／冷名單',goal:'重啟對話、喚醒沉睡客戶',cta:'低（關心近況、軟性提問）',len:'120-200 字'},'轉介請託':{rel:'熟客／滿意的舊客',goal:'委婉請求介紹朋友',cta:'中（請推薦有需要的朋友）',len:'120-200 字'}};
        const r=R[v.industry]||{law:'[法規]',ban:'[禁用詞]'}, t=T[v.dmtype]||{};
        return `請你扮演${v.industry||'[行業]'}業務文案助手。\n\n【任務】寫一則「${v.dmtype||'[類型]'}」LINE／DM 訊息，目的是讓對方願意${v.cta||'[具體行動]'}。\n本類型特性：對象＝${t.rel||''}；核心目的＝${t.goal||''}；CTA 強度＝${t.cta||''}；建議字數＝${t.len||''}。\n\n【我是誰】${v.me||'[公司／品牌＋專長＋資歷]'}\n\n【對方是誰】${v.target||'[年齡／身份／痛點／關係]'}\n\n【產品／服務】${v.product||'[主打方案＋賣點 3 點＋適合對象]'}\n\n【限制條件】（最重要，法規地雷在這）\n- 必須符合：${r.law}\n- 不得使用：${r.ban}\n- 語氣：自然、不卑不亢、繁體中文台灣口吻\n\n【輸出】字數上限 ${t.len||'200 字'}，給 3 個不同訴求的版本，可用適度表情符號。\n\n（小技巧：最後貼 3 則你平常傳給客戶的訊息，AI 會學你的口氣，寫出來不像機器人。）`;
      } },

    image:{ fields:[
      {id:'industry',label:'行業',type:'select',options:['保險','房仲','電信']},
      {id:'imgtype',label:'圖像類型',type:'select',options:['社群貼文圖','產品介紹圖卡','個人形象圖','節慶問候圖']},
      {id:'use',label:'用途',ph:'例：LINE 推播圖卡'},
      {id:'audience',label:'目標受眾（年齡／身份／想傳達的感受）'},
      {id:'subject',label:'主視覺＋視覺符號',type:'textarea'},
      {id:'style',label:'風格／氛圍',ph:'例：扁平插畫、專業溫暖'},
      {id:'color',label:'品牌色（#色碼）',ph:'例：#3E5C76'} ],
      tpl:v=>{
        const R={'保險':'真實客戶臉、金管會 Logo、恐嚇式畫面、「保證」「絕對」字眼設計','房仲':'修圖物件、未授權物件圖、具體門牌、「最後一戶」設計字眼','電信':'競品 Logo／主色、未授權手機機型、誤導訊號圖、隱藏綁約'};
        const T={'社群貼文圖':{scene:'FB／IG 對泛大眾、建立形象',comp:'主視覺＋留白給文字',ratio:'1:1 或 4:5'},'產品介紹圖卡':{scene:'LINE 推播給特定客戶、介紹商品',comp:'視覺化重點＋多留白',ratio:'3:4 或 4:5'},'個人形象圖':{scene:'LINE 頭像／名片／簡報／Banner 通用',comp:'人物或代表符號置中、乾淨背景',ratio:'1:1（頭像）或 16:9（Banner）'},'節慶問候圖':{scene:'LINE／FB 節日祝福',comp:'節日元素＋留白寫祝福',ratio:'1:1 或 4:5'}};
        const avoid=R[v.industry]||'[避免元素]', t=T[v.imgtype]||{};
        return `請依以下需求，產生一張「${v.imgtype||'[圖像類型]'}」的生圖提示詞（建議用 Adobe Firefly／Canva AI 等商用安全工具）。\n\n【用途】${v.use||'[用途]'}，場景＝${t.scene||''}\n【目標受眾】${v.audience||'[受眾]'}\n【主視覺】${v.subject||'[主視覺＋符號]'}\n【風格構圖】${v.style||'[風格／氛圍]'}；建議構圖＝${t.comp||''}\n【版面比例】${t.ratio||'1:1'}\n【必須出現】品牌色 ${v.color||'[#色碼]'}、留白區、核心視覺符號\n【避免元素】（最重要，版權地雷在這）${avoid}；不要競品 Logo、不要真實人物臉、不要侵權元素\n【真實性】合法商用插畫／概念風，不模仿任何特定品牌視覺\n\n⚠️ 出圖後檢查：沒有真實人臉、沒有任何 Logo／商標、沒有「保證／絕對／最」字眼設計、與實際商品不誤導。`;
      } },

    chibi:{ fields:[
      {id:'lock',label:'外觀鎖（角色長相，每次固定不變）',type:'textarea',ph:'例：2-3 頭身 Q 版女性，棕色微捲長髮+瀏海，圓潤大眼、粉嫩腮紅；日系扁平插畫、奶油色背景，溫暖低飽和'},
      {id:'outfit',label:'服裝',type:'select',options:['經典 OL','知性套裝','時髦主管','休閒星期五','文青風','鄰家風','韓系穿搭','街頭風','海邊度假','旅行裝','夏日洋裝','居家睡衣','慵懶居家','冬日宅家','運動套裝','晨跑風','約會穿搭','派對洋裝','婚禮賓客','過年喜氣']},
      {id:'scene',label:'場景',type:'select',options:['早晨咖啡','認真工作','跟寵物互動','假日逛市場','滑手機追劇','雨天通勤','自己煮飯','咖啡廳看書','晨跑運動','睡前療癒']},
      {id:'expr',label:'表情',type:'select',options:['開心大笑','愛心眼','自信比讚','灑花慶祝','委屈撒嬌','害羞臉紅','拜託求你','哭哭難過','震驚崩潰','思考困惑','恍然大悟','翻白眼無奈','加油打氣','燃燒鬥志','過勞崩潰','認真做筆記','想睡覺','OK 沒問題','拒絕 NO','招呼揮手']} ],
      tpl:v=>{
        const O={'經典 OL':'黑色西裝外套 + 白色襯衫 + 黑色窄裙 + 黑色高跟鞋','知性套裝':'米色西裝外套 + 淺粉襯衫 + 卡其長褲 + 樂福鞋','時髦主管':'深藍西裝 + 絲質吊帶 + 寬褲 + 尖頭跟鞋','休閒星期五':'針織衫 + 牛仔褲 + 小白鞋 + 帆布托特包','文青風':'米白棉麻襯衫 + 卡其吊帶裙 + 草編帽','鄰家風':'粉色針織毛衣 + 牛仔短裙 + 白襪 + 帆布鞋','韓系穿搭':'奶油色針織背心 + 白襯衫 + 黑色百褶裙','街頭風':'oversized 連帽 T + 黑色運動褲 + 球鞋','海邊度假':'白色背心洋裝 + 草帽 + 拖鞋 + 太陽眼鏡','旅行裝':'橄欖綠工裝外套 + 白 T + 牛仔短褲 + 後背包','夏日洋裝':'碎花無袖洋裝 + 涼鞋 + 編織包','居家睡衣':'米色長袖睡衣套裝 + 拖鞋','慵懶居家':'oversized T-shirt + 短褲 + 毛襪','冬日宅家':'毛茸茸睡袍 + 拖鞋 + 手捧馬克杯','運動套裝':'黑色運動內衣 + 高腰瑜珈褲 + 慢跑鞋','晨跑風':'粉色運動 T + 黑色短褲 + 馬尾 + 運動手錶','約會穿搭':'奶茶色針織洋裝 + 短靴 + 小包','派對洋裝':'黑色小禮服 + 珍珠耳環 + 高跟鞋','婚禮賓客':'粉藕色雪紡洋裝 + 米色高跟鞋','過年喜氣':'紅色針織毛衣 + 黑色長褲 + 紅色包包'};
        const S={'早晨咖啡':'站在木質流理台前，雙手捧著冒熱氣的馬克杯，窗外晨光灑入，旁邊有小盆栽','認真工作':'坐在筆電前打字，桌上有一杯拿鐵和便利貼，背景淺色辦公桌','跟寵物互動':'坐在地板上，懷裡抱著寵物，背景溫馨客廳','假日逛市場':'手提帆布袋，挑選新鮮蔬果，背景傳統市場攤位','滑手機追劇':'躺在沙發上，蓋著毛毯滑手機，旁邊有爆米花和飲料','雨天通勤':'撐著透明雨傘走在街上，背景雨中城市街景','自己煮飯':'站在廚房翻炒鍋子，繫著圍裙，背景溫馨家庭廚房','咖啡廳看書':'坐在咖啡廳窗邊，手捧一本書，桌上有拿鐵和甜點','晨跑運動':'在公園步道慢跑，背景綠樹晨光','睡前療癒':'坐在床上喝熱牛奶，床頭燈散發暖光，旁邊有寵物'};
        const E={'開心大笑':'嘴巴張大露牙、眼睛瞇成弧線、雙手舉高、星星圍繞','愛心眼':'眼睛變成愛心、臉超紅、雙手捧臉、粉色背景','自信比讚':'戴著太陽眼鏡、嘴角上揚、單手豎起大拇指','灑花慶祝':'雙手向上揮舞、彩色紙花飛舞、嘴巴 O 型開心','委屈撒嬌':'大眼水汪汪、嘴巴小小撅起、雙手在胸前合十','害羞臉紅':'雙頰超紅、眼神閃躲、雙手摀嘴、頭微低','拜託求你':'雙手合十、眼睛閉起、頭微傾、頭頂閃光','哭哭難過':'大顆淚珠、嘴巴 ω 型、雙手揉眼睛','震驚崩潰':'嘴巴張到最大、雙手抱頭、眼睛瞪大、背景閃電','思考困惑':'一手托下巴、頭微傾、頭頂大問號、皺眉','恍然大悟':'嘴巴 O 型、眼睛發亮、頭頂亮起燈泡','翻白眼無奈':'眼睛上飄、嘴角下垂、雙手攤開','加油打氣':'雙手握拳舉高、嘴巴張開喊加油、頭頂火焰','燃燒鬥志':'眼睛冒火、嘴巴堅定、雙手叉腰、紅色火焰背景','過勞崩潰':'眼睛變圈圈、舌頭吐出、頭頂冒煙、癱倒姿勢','認真做筆記':'拿筆低頭寫字、眼神專注、桌上有筆記本','想睡覺':'眼睛半閉、嘴巴打哈欠、鼻涕泡泡、抱枕頭','OK 沒問題':'單手比 OK 手勢、自信微笑、眨眼','拒絕 NO':'雙手交叉成 X、嘴角抿緊、頭搖晃線條','招呼揮手':'單手揮舞、開心笑容、頭微傾、彩色背景'};
        return `[外觀鎖]\n${v.lock||'[填角色長相，例：2-3 頭身 Q 版女性，棕色長髮、圓潤大眼，日系扁平插畫、奶油色背景]'}\n\n穿著：${v.outfit||''}（${O[v.outfit]||''}）\n場景：${S[v.scene]||''}\n表情：${v.expr||''}（${E[v.expr]||''}）\n輸出：1:1 正方形、保持同一畫風。\n\n（一致性技巧：第一次把原圖一起上傳說「以這張為角色基準」，後續每次拿上一張當參考圖；頭身比例／背景色／線條色每次都要寫。）`;
      } },

    video:{ fields:[
      {id:'brand',label:'品牌名稱＋一句話介紹（你是誰、做什麼）',type:'textarea',ph:'例：好日子花藝，賣乾燥花和花藝課程'},
      {id:'audience',label:'目標受眾（寫給誰看）',ph:'例：25-35 歲女性上班族'},
      {id:'tone',label:'品牌語氣',ph:'例：溫暖療癒 / 專業但親切 / 幽默輕鬆'},
      {id:'goal',label:'這支影片的目標',type:'select',options:['引流漲粉','知識教學','產品介紹','品牌故事','活動預告']},
      {id:'topic',label:'主題／關鍵字（這支要講什麼）',type:'textarea',ph:'例：為什麼你需要在桌上放一束花'} ],
      tpl:v=>`你是「短影音腳本手」，專精社群短影音的文字層（字幕＋口白），不寫畫面、不寫運鏡、不寫 AI 影片提示詞。全程繁體中文、台灣口吻。\n\n紀律：一支影片只講一件事；固定 30 秒；口白總字數 120-150 字（正常語速唸得完）；口白要口語、唸起來順、避免書面語與長句；字幕是口白的精華摘要，比口白短 30-50%，抓關鍵字。\n\n【品牌】${v.brand||'[品牌名稱＋一句話介紹]'}\n【目標受眾】${v.audience||'[受眾]'}\n【品牌語氣】${v.tone||'[語氣]'}\n【影片目標】${v.goal||'引流漲粉'}\n【主題】${v.topic||'[主題／關鍵字]'}\n\n請分兩步：\n\n步驟一｜先給我三個「不同切角」的方向（差異要明顯，不能只是換句話講同件事；至少涵蓋兩種 Hook 類型：提問／數字／衝突／好奇／反差／挑戰）。每個方向格式：\n【角度 X】｜切角名稱\n核心概念：一句話\n適合情境：一句話\nHook 預覽：開場第一句（10 字內、夠短夠狠）\n\n步驟二｜等我回覆選定一個方向後，展開完整 30 秒「五段式」腳本，每段都要【字幕】＋【口白】＋（這段任務）：\n0-3 秒 Hook（讓人停下別滑走）｜3-10 秒 痛點/情境（讓人覺得「對，我就是這樣」）｜10-20 秒 核心價值（給解法/乾貨）｜20-27 秒 強化/佐證（案例、數字、或降低門檻）｜27-30 秒 CTA（明確的下一步）。\n\n最後附「口白檢查報告」：總字數（120-150）、唸讀秒數（每秒 4-5 字估）、最長單句（超過 20 字要拆短）、是否口語化、是否符合品牌語氣、CTA 是否明確。\n\n現在先做步驟一，等我回覆選哪個角度，再做步驟二。`
    },
  };

  return { wordCount, quote, prompt, wheel, itinerary, numerology, CONFIGS, copy, toast };
})();
