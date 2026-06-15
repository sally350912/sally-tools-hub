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
      {id:'platform',label:'平台',type:'select',options:['Instagram Reels','TikTok','YouTube Shorts','Facebook Reels']},
      {id:'length',label:'影片長度',type:'select',options:['15 秒','30 秒','60 秒']},
      {id:'topic',label:'主題／產品',type:'textarea',ph:'例：手沖咖啡濾掛包；或「業務新人第一個月撐過去的方法」'},
      {id:'audience',label:'目標受眾',ph:'例：剛入行的保險業務'},
      {id:'style',label:'風格／語氣（可留空）',ph:'例：親切口語、有點幽默'},
      {id:'cta',label:'希望觀眾做的事（CTA）',ph:'例：留言「工具包」、追蹤、私訊'} ],
      tpl:v=>{
        const len=v.length||'30 秒', plat=v.platform||'[平台]';
        return `你是短影音腳本編劇。請幫我寫一支「${plat}」的 ${len} 短影音腳本，繁體中文、台灣口吻、自然不做作。\n\n【主題／產品】${v.topic||'[主題]'}\n【目標受眾】${v.audience||'[受眾]'}\n【風格語氣】${v.style||'親切、口語、有記憶點'}\n【希望觀眾做的事（CTA）】${v.cta||'[CTA]'}\n\n請依下列結構輸出：\n1. 三組「前 3 秒鉤子」選項（不同切角，讓我挑一個）\n2. 逐段腳本：每段標【口白】＋【畫面／B-roll 提示】＋【螢幕字幕】\n3. 結尾 CTA 一句話\n4. 5 個適合的 hashtag\n\n長度抓在 ${len} 內唸得完，節奏明快、一句一個重點，開頭不要鋪陳直接給鉤子。`;
      } },
  };

  return { wordCount, quote, prompt, CONFIGS, copy, toast };
})();
