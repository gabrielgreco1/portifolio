import {PDFDocument,StandardFonts,rgb,PDFString} from 'pdf-lib';
import {collectionDocument} from './document.mjs';
const W=595.28,H=841.89,M=44,BOTTOM=H-54,CW=W-M*2;
const colors={ink:'#24332d',green:'#315d46',muted:'#68776e',line:'#dce2da',paper:'#ffffff',soft:'#f0f4ed'};
const color=hex=>rgb(...hex.slice(1).match(/../g).map(n=>parseInt(n,16)/255));
const styles={lead:{font:'body',size:11,line:16,gap:12},contact:{font:'bold',size:9.2,line:13,gap:3},link:{size:8.2,line:12,gap:4,color:'green'},section:{font:'bold',size:9,line:14,before:14,gap:9,color:'green'},company:{font:'serif',size:22,line:27,before:7,gap:4},role:{font:'bold',size:10,line:14,gap:2},meta:{size:8.5,line:12,gap:9,color:'muted'},body:{size:9.5,line:12.7,gap:5},metrics:{font:'bold',size:8.5,line:13,gap:10,color:'green'},chapter:{font:'bold',size:8,line:12,before:7,gap:4,color:'green'},subtitle:{font:'bold',size:10,line:13,gap:5},bullet:{size:9.5,line:12.7,gap:4,indent:10},quote:{font:'serif',size:12,line:16,gap:9},image:{size:9,line:13,gap:12}};

export async function prepareCollectionPdf(collection,fetchImage=globalThis.fetch){
 const model=collectionDocument(collection),pdf=await PDFDocument.create();
 pdf.setTitle(`Gabriel Greco - ${model.title}`);pdf.setAuthor('Gabriel Greco');pdf.setLanguage(collection.page.language);
 const fonts={body:await pdf.embedFont(StandardFonts.Helvetica),bold:await pdf.embedFont(StandardFonts.HelveticaBold),serif:await pdf.embedFont(StandardFonts.TimesRoman)};
 const printable=value=>String(value).replace(/→/g,' > ').replace(/[↳↗↑↓]/g,'').replace(/[\u2010-\u2015−]/g,'-').replace(/\u00a0/g,' ').split('').map(c=>{try{fonts.body.encodeText(c);return c;}catch{return '?';}}).join('');
 function lines(value,style,width=CW){
  const font=fonts[style.font||'body'],size=style.size,words=printable(value).split(/\s+/),result=[];let current='';
  for(let word of words){while(font.widthOfTextAtSize(word,size)>width){if(current){result.push(current);current='';}let n=word.length;while(n>1&&font.widthOfTextAtSize(word.slice(0,n),size)>width)n--;result.push(word.slice(0,n));word=word.slice(n);}
   const next=current?`${current} ${word}`:word;if(current&&font.widthOfTextAtSize(next,size)>width){result.push(current);current=word;}else current=next;
  }if(current)result.push(current);return result;
 }
 const pages=[];let page,y,contextLabel=model.title;
 const text=(value,x,top,font,size,tint='ink',url)=>page.push({kind:'text',text:printable(value),x,y:top,font,size,color:colors[tint],width:fonts[font].widthOfTextAtSize(printable(value),size),...(url?{url}:{})});
 function newPage(continued=true){page=[];pages.push(page);y=72;text('GABRIEL GRECO',M,30,'bold',8,'green');text((contextLabel+(pages.length>1&&continued?(model.pt?' / CONTINUAÇÃO':' / CONTINUED'):'')).toUpperCase(),M,44,'body',7,'muted');page.push({kind:'line',x:M,y:57,width:CW,color:colors.line});}
 newPage(false);text(model.name,M,76,'serif',30);y=115;
 const subtitle=printable(model.title);text(subtitle,M,y,'body',11,'green');y+=22;
 if(!model.complete){text(model.pt?'SELEÇÃO PARCIAL - somente o conteúdo coletado':'PARTIAL SELECTION - collected content only',M,y,'bold',8,'green');y+=20;}
 const prepared=model.blocks.map(block=>{const style={font:'body',...styles[block.kind]};return {...block,style,lines:block.kind==='cards'?[]:lines(block.text,style,CW-(style.indent||0))};});
 for(let index=0;index<prepared.length;index++){
  const block=prepared[index],s=block.style;
  if(['company','section'].includes(block.kind))contextLabel=block.text;
  if(block.kind==='cards'){
   const gap=24,cardWidth=(CW-gap)/2;
   const cards=block.cards.map(card=>({parts:[
    {text:card.title,font:'bold',size:10.5,line:14,color:'ink',gap:6},
    {text:card.body,font:'body',size:9.5,line:12.7,color:'ink',gap:6},
    {text:card.meta,font:'body',size:8,line:11,color:'muted',gap:6},
    {text:card.url?(model.pt?'Visitar projeto >':'View project >'):null,font:'body',size:8,line:11,color:'green',gap:0,url:card.url},
   ].filter(part=>part.text).map(part=>({...part,lines:lines(part.text,part,cardWidth)}))}));
   for(let row=0;row<cards.length;row+=2){
    const pair=cards.slice(row,row+2),heights=pair.map(card=>card.parts.reduce((sum,part)=>sum+part.lines.length*part.line+part.gap,0));
    const rowHeight=Math.max(...heights);if(y+rowHeight>BOTTOM)newPage();
    pair.forEach((card,column)=>{let top=y;for(const part of card.parts){for(const line of part.lines){text(line,M+column*(cardWidth+gap),top,part.font,part.size,part.color,part.url);top+=part.line;}top+=part.gap;}});
    y+=rowHeight+12;
   }
   continue;
  }
  if(block.kind==='image'){
   let image;try{const response=await fetchImage(block.url,{signal:AbortSignal.timeout(4000)});if(response.ok){const bytes=new Uint8Array(await response.arrayBuffer());image=bytes[0]===137?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);}}catch{}
   if(image){if(y+110>BOTTOM)newPage();const factor=Math.min(150/image.width,90/image.height);page.push({kind:'image',image,url:block.url,x:M,y,width:image.width*factor,height:image.height*factor});y+=image.height*factor+9;}
  }
  // Keep headings with the next meaningful lines; never strand a title.
  const heading=['section','company','role','chapter','subtitle'].includes(block.kind);
  let reserve=block.lines.length*s.line+(s.before||0)+s.gap;
  if(heading)for(let j=index+1;j<Math.min(index+(block.kind==='company'?10:4),prepared.length);j++){const next=prepared[j];if(next.kind==='cards'){reserve+=130;break;}if(next.kind==='company'||next.kind==='section')break;reserve+=Math.min(next.lines.length,2)*next.style.line+(next.style.before||0)+next.style.gap;if(block.kind==='company'?next.kind==='bullet':['body','bullet','metrics'].includes(next.kind))break;}
  if(y+Math.min(reserve,250)>BOTTOM)newPage(!['company','section'].includes(block.kind));
  y+=(s.before||0);
  if(block.kind==='section'){page.push({kind:'line',x:M,y:y-7,width:CW,color:colors.line});}
  let at=0;
  while(at<block.lines.length){
   let fit=Math.floor((BOTTOM-y)/s.line);
   if(fit<Math.min(2,block.lines.length-at)){newPage();fit=Math.floor((BOTTOM-y)/s.line);}
   if(block.lines.length-at-fit===1&&fit>2)fit--;
   const count=Math.min(fit,block.lines.length-at);
   for(let i=0;i<count;i++){if(block.kind==='bullet'&&at===0&&i===0)text('·',M,y,'bold',s.size,'green');text(block.lines[at+i],M+(s.indent||0),y,s.font,s.size,s.color||'ink',block.url);y+=s.line;}
   at+=count;if(at<block.lines.length)newPage();
  }
  y+=s.gap;
 }
 // Provenance is one compact colophon, rather than a repeated technical footer
 // after every field. Every source remains available in the exact JSON attached.
 const note=model.pt?'Conteúdo profissional organizado para leitura. Textos de navegação, frases decorativas e referências de imagens ficam no JSON completo anexado.':'Professional content arranged for reading. Navigation text, decorative quotes and image references remain in the complete attached JSON.';
 const noteStyle={font:'body',size:7.5,line:10.5};const noteLines=lines(note,noteStyle);if(y+noteLines.length*10.5+30>BOTTOM)newPage();y+=17;for(const line of noteLines){text(line,M,y,'body',7.5,'muted');y+=10.5;}
 pages.forEach((items,index)=>{page=items;page.push({kind:'line',x:M,y:H-38,width:CW,color:colors.line});text('gabrielgreco.com',M,H-24,'body',7,'muted','https://gabrielgreco.com');const label=`${String(index+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;text(label,W-M-fonts.body.widthOfTextAtSize(label,7),H-24,'body',7,'muted');});
 for(const items of pages){const target=pdf.addPage([W,H]);for(const op of items){
  if(op.kind==='text'){target.drawText(op.text,{x:op.x,y:H-op.y-op.size,font:fonts[op.font],size:op.size,color:color(op.color)});if(op.url&&/^https?:\/\//.test(op.url)){const annotation=pdf.context.obj({Type:'Annot',Subtype:'Link',Rect:[op.x,H-op.y-op.size,op.x+op.width,H-op.y+2],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(op.url)}});target.node.addAnnot(pdf.context.register(annotation));}}
  else if(op.kind==='line')target.drawLine({start:{x:op.x,y:H-op.y},end:{x:op.x+op.width,y:H-op.y},thickness:.5,color:color(op.color)});
  else if(op.kind==='image')target.drawImage(op.image,{x:op.x,y:H-op.y-op.height,width:op.width,height:op.height});
 }}
 await pdf.attach(new TextEncoder().encode(JSON.stringify(collection,null,2)),'collection.json',{mimeType:'application/json',description:'Complete original collection with source provenance'});
 return {bytes:await pdf.save(),pages:pages.map(items=>items.map(({image,...op})=>op)),width:W,height:H,title:model.title};
}
export async function buildCollectionPdf(collection,fetchImage=globalThis.fetch){return(await prepareCollectionPdf(collection,fetchImage)).bytes;}
