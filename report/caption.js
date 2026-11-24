(()=>{
const el=id=>document.getElementById(id);
const output=el('postText'),status=el('postStatus');
let manuallyEdited=false;
function tokens(value,prefix){return value.split(/[\s,、，]+/u).map(x=>x.replace(/^[@＠#＃]+/u,'').trim()).filter(Boolean).map(x=>prefix+x);}
function hasInput(){return ['title','host','postHook','postMention','postPlace','postTags'].some(id=>el(id).value.trim());}
function build(){
 if(!hasInput())return '';
 const title=el('title').value.trim(),host=el('host').value.trim().replace(/\s*\n\s*/g,' ');
 const mentions=[...new Set(tokens(el('postMention').value,'@'))].join(' ');
 const tags=[...new Set(['#筑波大学','#未来社会デザイン棟',...tokens(el('postTags').value,'#')])].join(' ');
 const eventBlock=['【EVENT REPORT】',title?'「'+title+'」':'',[host?'('+host+')':'',mentions].filter(Boolean).join(' '),el('postPlace').value.trim()?'📍'+el('postPlace').value.trim():''].filter(Boolean).join('\n');
 const reservationBlock='施設利用予約はホームページから🔗\nhttps://stb.tsukuba.ac.jp/~miraishakai/reservation/';
 return [el('postHook').value.trim(),eventBlock,reservationBlock,tags].filter(Boolean).join('\n\n');
}
function count(){el('copyPost').disabled=!output.value.trim();el('postCount').textContent=Array.from(output.value).length+'文字（URL・改行を含む単純文字数）';}
function guidance(){const missing=[];if(!el('postHook').value.trim())missing.push('フックの一言');if(!el('postMention').value.trim())missing.push('主催団体の@メンション');if(!el('title').value.trim())missing.push('イベント名');if(!el('host').value.trim())missing.push('主催団体名');if(!el('postPlace').value.trim())missing.push('場所');return missing.length?'未入力：'+missing.join('、')+'。':'';}
function update(){if(manuallyEdited){status.textContent='入力内容が変わりました。投稿文の直接編集を保持しています。反映する場合は「入力内容で作り直す」を押してください。';return;}output.value=build();count();status.textContent=hasInput()?(guidance()||'入力内容を投稿文に反映しました。'):'入力すると、ここに投稿文が作成されます。';}
for(const id of ['title','host','postHook','postMention','postPlace','postTags'])el(id).addEventListener('input',update);
output.addEventListener('input',()=>{manuallyEdited=true;count();status.textContent='投稿文を直接編集しています。';});
el('rebuildPost').onclick=()=>{manuallyEdited=false;update();};
el('hookExample').onclick=()=>{el('postHook').value='当日の様子をお届けします！';update();};
el('copyPost').onclick=async()=>{try{await navigator.clipboard.writeText(output.value);status.textContent='投稿文をコピーしました。投稿時のメンション・タグ付けも確認してください。';}catch(error){output.focus();output.select();status.textContent='投稿文を選択しました。⌘C（WindowsはCtrl+C）でコピーしてください。';}};
update();
})();
