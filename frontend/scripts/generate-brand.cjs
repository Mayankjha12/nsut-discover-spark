// Deterministic geometric campus/spark mark. Uses Expo's existing image tooling.
const fs = require('node:fs');
const path = require('node:path');
const Jimp = require(require.resolve('jimp-compact', { paths: [path.dirname(require.resolve('@expo/image-utils'))] }));
const root = path.resolve(__dirname, '../assets/images');
const shapes = [
  { color: '#E45562', points: [[270,670],[270,390],[490,270],[640,352],[590,400],[490,345],[340,430],[340,670]] },
  { color: '#F3F4F6', points: [[410,670],[410,470],[485,470],[485,670]] },
  { color: '#F3F4F6', points: [[545,670],[545,445],[620,420],[620,670]] },
  { color: '#78DCC8', points: [[695,252],[722,321],[791,348],[722,375],[695,444],[668,375],[599,348],[668,321]] },
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
