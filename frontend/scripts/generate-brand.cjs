// NSUT Hub monogram. Uses Expo's existing image tooling.
const fs = require('node:fs');
const path = require('node:path');
const Jimp = require(require.resolve('jimp-compact', { paths: [path.dirname(require.resolve('@expo/image-utils'))] }));
const root = path.resolve(__dirname, '../assets/images');
const shapes = [
  { color: '#F3F4F6', points: [[230,714],[230,310],[305,310],[445,557],[445,310],[515,310],[515,714],[440,714],[300,467],[300,714]] },
  { color: '#E98A91', points: [[565,310],[635,310],[635,476],[725,476],[725,310],[795,310],[795,714],[725,714],[725,548],[635,548],[635,714],[565,714]] },
];
fs.writeFileSync(path.join(root,'brand-mark.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="216" fill="#0F1115"/>${shapes.map(s=>`<polygon fill="${s.color}" points="${s.points.map(p=>p.join(',')).join(' ')}"/>`).join('')}</svg>\n`);
function polygon(image, shape) {
  const points=shape.points, color=Jimp.cssColorToHex(shape.color);
  for(let y=0;y<1024;y++) {
    const crossings=[];
    for(let i=0,j=points.length-1;i<points.length;j=i++) {
      const [xi,yi]=points[i], [xj,yj]=points[j];
      if((yi>y)!==(yj>y)) crossings.push(xi+(y-yi)*(xj-xi)/(yj-yi));
    }
    crossings.sort((a,b)=>a-b);
    for(let i=0;i<crossings.length;i+=2) for(let x=Math.ceil(crossings[i]);x<crossings[i+1];x++) image.setPixelColor(color,x,y);
  }
}
(async()=>{
  const foreground=new Jimp(1024,1024,0x00000000);
  shapes.forEach(shape=>polygon(foreground,shape));
  await foreground.writeAsync(path.join(root,'adaptive-icon.png'));
  await foreground.clone().resize(512,512).writeAsync(path.join(root,'splash-image.png'));
  const icon=new Jimp(1024,1024,0x0F1115FF).composite(foreground,0,0);
  await icon.writeAsync(path.join(root,'icon.png'));
  await icon.clone().resize(64,64).writeAsync(path.join(root,'favicon.png'));
})();
