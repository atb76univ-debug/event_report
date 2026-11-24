const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
const originalYearSource='assets/background_v3.mp4?v=v3-1',customYearSource=originalYearSource;
let sourceHasOriginalYear=true,yearSourceRequest=0;
const template=document.createElement('video');template.src=customYearSource;template.muted=true;template.playsInline=true;template.preload='auto';
const overlayCanvas=document.createElement('canvas');overlayCanvas.width=1080;overlayCanvas.height=1920;const overlayCtx=overlayCanvas.getContext('2d',{willReadFrequently:true});
let items=[];
let selected=0,t=0,playing=false,recording=false,active=-1,ready=false;
function load(item){item.fit='cover';item.x=50;item.y=50;item.start??=0;return new Promise((resolve,reject)=>{let e=item.el=document.createElement(item.type==='video'?'video':'img');if(item.type==='video'){e.muted=true;e.playsInline=true;e.preload='auto';e.onloadeddata=resolve;e.onerror=reject;}else{e.onload=resolve;e.onerror=reject;}e.src=item.src;});}
function cards(){let root=$('cards');root.replaceChildren();$('mediaCount').textContent=items.length+'素材';if(!items.length){let empty=document.createElement('p');empty.className='hint';empty.textContent='素材がありません。写真・動画を追加してください。';root.append(empty);}items.forEach((it,i)=>{let c=document.createElement('div');c.className='card'+(i===selected?' selected':'');let im=document.createElement('img');im.src=it.type==='image'?it.src:'assets/video-placeholder.svg';let text=document.createElement('div'),b=document.createElement('b'),sm=document.createElement('small');b.textContent=it.name;sm.textContent=`${(12*i/items.length).toFixed(1)}–${(12*(i+1)/items.length).toFixed(1)}秒 · ${it.type==='video'?'動画':'写真'}`;text.append(b,sm);c.append(im,text);let order=document.createElement('div');order.className='order';for(let dir of [-1,1]){let btn=document.createElement('button');btn.textContent=dir<0?'↑':'↓';btn.setAttribute('aria-label',dir<0?'前に移動':'後ろに移動');btn.disabled=i+dir<0||i+dir>=items.length;btn.onclick=e=>{e.stopPropagation();pause();[items[i],items[i+dir]]=[items[i+dir],items[i]];selected=i+dir;cards();controls();seek(t);};order.append(btn);}let remove=document.createElement('button');remove.textContent='削除';remove.className='remove';remove.setAttribute('aria-label',it.name+'を削除');remove.onclick=async e=>{e.stopPropagation();if(recording)return;pause();const current=items[selected];items.splice(i,1);if(it.type==='video')it.el.pause();if(it.src.startsWith('blob:'))URL.revokeObjectURL(it.src);selected=Math.max(0,items.indexOf(current));selected=Math.min(selected,Math.max(0,items.length-1));active=-1;cards();controls();await seek(0);$('status').textContent=it.name+'を構成から削除しました。元ファイルは残っています。';};order.append(remove);c.append(order);c.onclick=()=>{if(recording)return;selected=i;cards();controls();seek(12*i/items.length);};root.append(c);});}
function controls(){let a=items[selected];for(let id of ['fit','panX','panY','clipStart'])$(id).disabled=!a;$('play').disabled=!items.length;$('export').disabled=!items.length;if(!a)return;$('fit').value=a.fit;$('panX').value=a.x;$('panY').value=a.y;$('clipStart').disabled=a.type!=='video';$('clipStart').value=a.start;$('clipStart').max=a.type==='video'?Math.max(0,a.el.duration-12/items.length):0;}
function fittedText(text,x,y,max,size,weight=500){
 const family='"Zen Kaku Gothic New",sans-serif';
 ctx.font=`500 ${size}px ${family}`;
 while(ctx.measureText(text).width>max&&size>12)ctx.font=`500 ${--size}px ${family}`;
 ctx.fillText(text,x,y);
}
// Composite order (back to front): uploaded photo/video -> v3 background design -> information text.
// Only the white center window of the v3 artwork is made transparent.
function draw(){
 if(!ready||template.readyState<2)return;
 const box={x:0,y:373,w:1080,h:981};

 // 1) Bottom layer: uploaded photo/video inside the central window.
 ctx.clearRect(0,0,1080,1920);
 ctx.fillStyle='#f7f7ed';
 ctx.fillRect(box.x,box.y,box.w,box.h);
 if(items.length){
  const a=items[Math.min(items.length-1,Math.floor(t/12*items.length))];
  const e=a?.el,w=e?.videoWidth||e?.naturalWidth,h=e?.videoHeight||e?.naturalHeight;
  if(w&&h){
   const k=a.fit==='cover'?Math.max(box.w/w,box.h/h):Math.min(box.w/w,box.h/h);
   ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();
   ctx.drawImage(e,box.x+(box.w-w*k)*a.x/100,box.y+(box.h-h*k)*a.y/100,w*k,h*k);
   ctx.restore();
  }
 }

 // 2) Middle layer: animated background design. Key out only the blank white window.
 overlayCtx.clearRect(0,0,1080,1920);
 overlayCtx.drawImage(template,0,0,1080,1920);
 const windowPixels=overlayCtx.getImageData(box.x,box.y,box.w,box.h);
 const px=windowPixels.data;
 for(let i=0;i<px.length;i+=4){
  const r=px[i],g=px[i+1],b=px[i+2];
  if(r>238&&g>238&&b>238&&Math.max(r,g,b)-Math.min(r,g,b)<10)px[i+3]=0;
 }
 overlayCtx.putImageData(windowPixels,box.x,box.y);
 ctx.drawImage(overlayCanvas,0,0);

 // 3) Top layer: information text, drawn above both the background design and media.
 ctx.fillStyle='white';ctx.textAlign='left';ctx.textBaseline='alphabetic';
 const progress=Math.max(0,Math.min(1,(t-.16)/.64));
 const textSlide=800*Math.pow(1-progress,3);
 ctx.fillStyle='white';
 if(progress>0)ctx.fillRect(148+textSlide,1400,1080,177);
 ctx.save();ctx.translate(textSlide,0);ctx.fillStyle='black';ctx.textAlign='left';
 const host=$('host').value.split('\n').map(s=>s.trim()).filter(Boolean);
 if(host.length>1){
  fittedText(host[0],330,1445,720,36,500);
  fittedText(host.slice(1).join(' '),330,1484,720,36,500);
  fittedText($('title').value,330,1540,720,46,500);
 }else{
  fittedText(host[0]||'',330,1477,720,53,500);
  fittedText($('title').value,330,1540,720,48,500);
 }
 ctx.restore();
 ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(t-.16)/.64));ctx.translate(textSlide*.55,0);
 ctx.fillStyle='white';ctx.textAlign='right';
 fittedText('@ '+$('venue').value,1017,1663,880,61,500);
 ctx.restore();
 $('seek').value=t;$('time').textContent=`0:${String(Math.floor(t)).padStart(2,'0')} / 0:12`;
}

async function at(e,time){time=Math.max(0,Math.min(time,e.duration-.03));if(Math.abs(e.currentTime-time)<.015&&e.readyState>=2)return;await new Promise((resolve,reject)=>{let timeout=setTimeout(()=>{cleanup();reject(Error('動画の読み込みがタイムアウトしました'));},10000);function cleanup(){clearTimeout(timeout);e.removeEventListener('seeked',done);e.removeEventListener('error',fail);}function done(){cleanup();resolve();}function fail(){cleanup();reject(Error('動画を読み込めませんでした'));}e.addEventListener('seeked',done);e.addEventListener('error',fail);e.currentTime=time;});}
async function syncMedia(force=false){if(!items.length){active=-1;return;}let i=Math.min(items.length-1,Math.floor(t/12*items.length));let a=items[i];if(force||i!==active){for(let it of items)if(it.type==='video')it.el.pause();active=i;if(a.type==='video'){await at(a.el,a.start+t-i*12/items.length);if(playing)await a.el.play();}}}
async function seek(time){if(recording)return;pause();t=Number(time);try{await at(template,t);await syncMedia(true);draw();}catch(e){$('status').textContent=e.message;}}
function pause(){playing=false;template.pause();for(let a of items)if(a.type==='video')a.el.pause();$('play').textContent='▶ 再生';}
async function play(){if(!items.length)return;if(playing){pause();return;}if(t>=11.95)t=0;await at(template,t);playing=true;await syncMedia(true);try{await template.play();$('play').textContent='Ⅱ 一時停止';}catch(e){pause();$('status').textContent='再生できませんでした：'+e.message;}}
function loop(){if(playing){t=Math.min(11.999,template.currentTime);syncMedia().catch(e=>{$('status').textContent=e.message;pause();});if(template.ended){pause();}}draw();requestAnimationFrame(loop);} 
$('play').onclick=play;$('seek').oninput=e=>seek(e.target.value);for(let id of ['title','host','venue'])$(id).oninput=draw;
$('year').oninput=async()=>{
 const useOriginal=$('year').value==='2026';
 if(useOriginal===sourceHasOriginalYear){draw();return;}
 const request=++yearSourceRequest,previousTime=t;
 pause();ready=false;sourceHasOriginalYear=useOriginal;
 $('export').disabled=true;$('play').disabled=true;
 try{
  const loaded=new Promise((resolve,reject)=>{
   function cleanup(){template.removeEventListener('loadeddata',done);template.removeEventListener('error',fail);}
   function done(){cleanup();resolve();}
   function fail(){cleanup();reject(Error('背景動画を読み込めませんでした'));}
   template.addEventListener('loadeddata',done);template.addEventListener('error',fail);
  });
  template.src=useOriginal?originalYearSource:customYearSource;template.load();
  await loaded;if(request!==yearSourceRequest)return;
  await at(template,previousTime);if(request!==yearSourceRequest)return;
  ready=true;controls();await syncMedia(true);draw();
  $('status').textContent='年の表示を更新しました。';
 }catch(error){if(request===yearSourceRequest)$('status').textContent=error.message;}
};
for(let id of ['fit','panX','panY','clipStart'])$(id).oninput=()=>{let a=items[selected];if(!a)return;a.fit=$('fit').value;a.x=+$('panX').value;a.y=+$('panY').value;a.start=Math.max(0,Math.min(+$('clipStart').value||0,+$('clipStart').max));if(id==='clipStart')seek(t);draw();};
$('upload').onchange=async e=>{pause();try{for(let file of e.target.files){let a={name:file.name,src:URL.createObjectURL(file),type:file.type.startsWith('video')?'video':'image'};await load(a);items.push(a);}selected=items.length-1;cards();controls();await seek(0);$('status').textContent='素材を追加しました。各素材は全体12秒の中で均等に表示されます。';e.target.value='';}catch(err){$('status').textContent='素材を読み込めません。HEICはJPEGに変換して追加してください。';}};
$('export').onclick=async()=>{if(!items.length)return;if(!window.MediaRecorder||!canvas.captureStream){$('status').textContent='このブラウザは動画書き出し非対応です。Chromeで開いてください。';return;}let mime=['video/mp4;codecs=avc1.42E01E','video/webm;codecs=vp9','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));if(!mime){$('status').textContent='対応する動画形式がありません。Chromeで開いてください。';return;}let stream,rec;try{await seek(0);recording=true;$('export').disabled=true;$('play').disabled=true;document.querySelectorAll('input,textarea,select,.card button').forEach(e=>e.disabled=true);stream=canvas.captureStream(30);let chunks=[];rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10000000});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};let stopped=new Promise((resolve,reject)=>{rec.onstop=resolve;rec.onerror=reject;});rec.start(250);$('status').textContent='12秒の動画を書き出しています。この画面を開いたままお待ちください。';await play();if(!playing)throw Error('再生を開始できませんでした');await new Promise((resolve,reject)=>{let timer=setTimeout(()=>{template.removeEventListener('ended',done);reject(Error('書き出しがタイムアウトしました'));},20000);function done(){clearTimeout(timer);resolve();}template.addEventListener('ended',done,{once:true});});rec.stop();await stopped;stream.getTracks().forEach(x=>x.stop());let url=URL.createObjectURL(new Blob(chunks,{type:mime})),a=document.createElement('a');a.href=url;a.download=($('title').value.replace(/[\\/:*?"<>|]/g,'_')||'イベント')+'_レポート.'+(mime.startsWith('video/mp4')?'mp4':'webm');a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);$('status').textContent='動画を書き出しました（音声なし）。';}catch(e){pause();$('status').textContent='書き出しに失敗しました：'+e.message;}finally{if(rec&&rec.state!=='inactive')rec.stop();if(stream)stream.getTracks().forEach(x=>x.stop());recording=false;document.querySelectorAll('input,textarea,select').forEach(e=>e.disabled=false);$('export').disabled=false;$('play').disabled=false;cards();controls();}};
Promise.all([new Promise((resolve,reject)=>{template.onloadeddata=resolve;template.onerror=reject;}),...items.map(load)]).then(async()=>{try{await document.fonts.load('500 58px "Zen Kaku Gothic New"');await document.fonts.load('500 38px "Zen Kaku Gothic New"');}catch(e){}ready=true;cards();controls();await seek(0);controls();$('status').textContent='写真・動画を追加して作成を始めてください。';requestAnimationFrame(loop);}).catch(()=>{$('status').textContent='素材の読み込みに失敗しました。ページを再読み込みしてください。';});
