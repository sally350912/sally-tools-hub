/* ============================================================
   絲綢流光 WebGL 開場（奶油底 × 海洋藍 × 金）
   桌機（fine pointer）才跑；手機 / 不支援 / 省電模式 → 靜態漸層
   ============================================================ */
(function(){
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('silk');
  if(!hero || !canvas) return;

  const finePointer = window.matchMedia('(pointer:fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  let gl = null;
  try{ gl = canvas.getContext('webgl', {antialias:true, alpha:false}); }catch(e){}

  // 降級：手機 / 省電 / 不支援 → 靜態漸層底
  if(!finePointer || reduce || !gl){
    hero.classList.add('hero--static');
    if(canvas) canvas.style.display='none';
    return;
  }

  const vertSrc = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0); }`;
  const fragSrc = `
    precision highp float;
    uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uMouseAmp;
    const vec3 CREAM=vec3(0.984,0.969,0.945); const vec3 OCEAN=vec3(0.910,0.518,0.353);
    const vec3 GOLD=vec3(0.812,0.416,0.251);  const vec3 DEEP=vec3(0.957,0.922,0.875);
    vec2 hash(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
    float noise(vec2 p){
      const float K1=0.366025404; const float K2=0.211324865;
      vec2 i=floor(p+(p.x+p.y)*K1); vec2 a=p-i+(i.x+i.y)*K2;
      vec2 o=(a.x>a.y)?vec2(1.0,0.0):vec2(0.0,1.0);
      vec2 b=a-o+K2; vec2 c=a-1.0+2.0*K2;
      vec3 h=max(0.5-vec3(dot(a,a),dot(b,b),dot(c,c)),0.0);
      vec3 n=h*h*h*h*vec3(dot(a,hash(i)),dot(b,hash(i+o)),dot(c,hash(i+1.0)));
      return dot(n,vec3(70.0));
    }
    float fbm(vec2 p){ float v=0.0,a=0.5; mat2 rot=mat2(1.6,1.2,-1.2,1.6);
      for(int i=0;i<5;i++){ v+=a*noise(p); p=rot*p; a*=0.5; } return v; }
    void main(){
      vec2 uv=gl_FragCoord.xy/uRes; vec2 p=uv; p.x*=uRes.x/uRes.y;
      float t=uTime*0.06; vec2 m=uMouse; m.x*=uRes.x/uRes.y;
      vec2 toM=p-m; float dist=length(toM);
      float push=exp(-dist*3.2)*(0.32+uMouseAmp*0.9); vec2 warp=normalize(toM+0.0001)*push*0.35;
      vec2 q=vec2(fbm(p*1.4+warp+vec2(0.0,t)), fbm(p*1.4+warp+vec2(5.2,t*1.3)));
      vec2 r=vec2(fbm(p*1.4+q*1.6+vec2(1.7,9.2)+t*0.4), fbm(p*1.4+q*1.6+vec2(8.3,2.8)-t*0.3));
      float f=fbm(p*1.4+r*1.8+warp*2.0);
      vec3 col=mix(CREAM,DEEP,uv.y*0.55+f*0.12);
      float ocean=smoothstep(0.25,0.78,f+q.x*0.32); col=mix(col,mix(col,OCEAN,0.30),ocean*0.5);
      float vein=smoothstep(0.46,0.5,f)*smoothstep(0.56,0.5,f); col=mix(col,GOLD,vein*0.42);
      float glow=exp(-dist*4.2)*(0.10+uMouseAmp*0.5); col=mix(col,GOLD,glow*0.5);
      col=mix(col,OCEAN,exp(-dist*7.5)*uMouseAmp*0.18);
      col=mix(CREAM,col,0.35+0.65*smoothstep(0.05,0.65,uv.x+(1.0-uv.y)*0.3));
      gl_FragColor=vec4(col,1.0);
    }`;
  function compile(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){ console.error(gl.getShaderInfoLog(s)); return null; } return s; }
  const prog=gl.createProgram();
  gl.attachShader(prog,compile(gl.VERTEX_SHADER,vertSrc));
  gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,fragSrc));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(prog,'aPos'); gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uRes=gl.getUniformLocation(prog,'uRes'), uTime=gl.getUniformLocation(prog,'uTime'),
        uMouse=gl.getUniformLocation(prog,'uMouse'), uMouseAmp=gl.getUniformLocation(prog,'uMouseAmp');

  let mx=0.72,my=0.5,tx=0.72,ty=0.5,amp=0,lastX=null,lastY=null;
  hero.addEventListener('pointermove',e=>{
    const r=canvas.getBoundingClientRect();
    const nx=(e.clientX-r.left)/r.width, ny=1.0-(e.clientY-r.top)/r.height;
    if(lastX!==null){ amp=Math.min(1.0,amp+Math.hypot(nx-lastX,ny-lastY)*6.0); }
    lastX=nx; lastY=ny; tx=nx; ty=ny;
  });
  function resize(){
    const dpr=Math.min(window.devicePixelRatio||1, 1.75); // 限 dpr，整合顯卡也順
    canvas.width=hero.clientWidth*dpr; canvas.height=hero.clientHeight*dpr;
    gl.viewport(0,0,canvas.width,canvas.height);
  }
  window.addEventListener('resize',resize); resize();
  let running=true;
  document.addEventListener('visibilitychange',()=>{ running=!document.hidden; if(running) requestAnimationFrame(frame); });
  const t0=performance.now();
  function frame(now){
    if(!running) return;
    const t=(now-t0)/1000;
    mx+=(tx-mx)*0.045; my+=(ty-my)*0.045; amp*=0.96;
    gl.uniform2f(uRes,canvas.width,canvas.height); gl.uniform1f(uTime,t);
    gl.uniform2f(uMouse,mx,my); gl.uniform1f(uMouseAmp,amp);
    gl.drawArrays(gl.TRIANGLES,0,3); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* nav 滾動加底色（landing 用 .hero 判斷；內頁直接常駐 solid 由各頁設定）*/
(function(){
  const nav=document.querySelector('nav'); if(!nav) return;
  if(!document.querySelector('.hero')){ nav.classList.add('solid'); return; }
  window.addEventListener('scroll',()=>{ nav.classList.toggle('solid', window.scrollY>40); });
})();
