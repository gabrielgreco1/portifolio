// Keep a readable, bounded simulation while using all available screen space.
// Extreme aspect ratios get centered margins instead of stretched characters.
export function arcadeViewport(cssWidth,cssHeight){
 const height=Math.max(320,Math.min(430,Math.round(cssHeight)));
 const width=Math.max(280,Math.min(1500,Math.round(cssWidth/cssHeight*height)));
 const scale=Math.min(cssWidth/width,cssHeight/height);
 return{width,height,scale,x:Math.max(0,(cssWidth-width*scale)/2),y:Math.max(0,(cssHeight-height*scale)/2)};
}
export function arcadePointerX(clientX,rect,view){return Math.max(0,Math.min(view.width,(clientX-rect.left-view.x)/view.scale));}
