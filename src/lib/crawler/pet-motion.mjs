export const PET_DURATION = { spin: 1580, overload: 3100 };
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp(n); return t*t*(3-2*t); };

// Pure clock-driven poses: the live character and frame captures use the same timeline.
export function petPose(kind, ms, reduced = false) {
  const pose = { frame: -1, x: 0, y: 0, sx: 1, sy: 1, angle: 0, heat: 0, burst: -1, steam: 0 };
  if (reduced) { pose.heat = kind === 'overload' ? Math.sin(clamp(ms/700)*Math.PI)*.4 : 0; return pose; }
  if (kind === 'spin') {
    if (ms < 230) { const p = Math.sin(ms/230*Math.PI/2); pose.sy=1-.1*p; pose.sx=1+.07*p; pose.angle=-.06*p; }
    else if (ms < 1120) {
      const p=(ms-230)/890;
      pose.y=-43*Math.sin(Math.PI*p);
      pose.sx=1;pose.sy=1;
      const turn=smooth(p);
      pose.frame=turn<.05||turn>.96?-1:Math.min(7,Math.floor(turn*8));
      pose.angle=.035*Math.sin(p*Math.PI*2);
    } else {
      const p=clamp((ms-1120)/460),bounce=Math.sin(p*Math.PI*3)*Math.exp(-p*5);
      pose.sy=1-.14*bounce;pose.sx=1+.08*bounce;pose.y=-Math.max(0,-bounce)*9;
    }
  } else if (kind === 'overload') {
    const ramp=smooth(ms/1300),cool=1-smooth((ms-1950)/1000);
    pose.heat=ramp*cool;
    pose.x=Math.sin(ms*.09)*2.6*pose.heat;
    pose.angle=Math.sin(ms*.045)*.022*pose.heat;
    pose.sy=1-.07*pose.heat;pose.sx=1+.04*pose.heat;
    pose.steam=smooth((ms-700)/600)*cool;
    if(ms>=1450) {pose.burst=clamp((ms-1450)/1250);pose.y=-24*Math.sin(clamp((ms-1450)/550)*Math.PI);}
  }
  return pose;
}

export function clickGesture(count) { return count >= 5 ? 'overload' : count >= 3 ? 'spin' : 'menu'; }
