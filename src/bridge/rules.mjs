/** Pure Ortak Köprü rules. Coordinates are in the 860 x 520 game board. */
export const BOARD = Object.freeze({ width: 860, height: 520 });
export const LEVEL = Object.freeze({
  start: { x: 120, y: 390, radius: 24 },
  goal: { x: 740, y: 250, radius: 24 },
  // An explicit obstacle: crossing its interior invalidates the bridge.
  obstacles: [{ x: 380, y: 260, width: 100, height: 150 }],
  joinTolerance: 12,
});
const EPS = 1e-9;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function pointSegmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length2 = dx * dx + dy * dy;
  const t = length2 ? Math.max(0, Math.min(1, ((p.x-a.x)*dx+(p.y-a.y)*dy)/length2)) : 0;
  return Math.hypot(p.x-a.x-t*dx, p.y-a.y-t*dy);
}
function cross(a,b,c) { return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x); }
function intersects(a,b,c,d) {
  const p=cross(a,b,c), q=cross(a,b,d), r=cross(c,d,a), s=cross(c,d,b);
  if (((p > EPS && q < -EPS) || (p < -EPS && q > EPS)) &&
      ((r > EPS && s < -EPS) || (r < -EPS && s > EPS))) return true;
  return (Math.abs(p)<=EPS && pointSegmentDistance(c,a,b)<=EPS) ||
    (Math.abs(q)<=EPS && pointSegmentDistance(d,a,b)<=EPS) ||
    (Math.abs(r)<=EPS && pointSegmentDistance(a,c,d)<=EPS) ||
    (Math.abs(s)<=EPS && pointSegmentDistance(b,c,d)<=EPS);
}
function segmentDistance(a,b,c,d) {
  if (intersects(a,b,c,d)) return 0;
  return Math.min(pointSegmentDistance(a,c,d), pointSegmentDistance(b,c,d),
    pointSegmentDistance(c,a,b), pointSegmentDistance(d,a,b));
}
function hitsRect(a,b,rect) {
  // Closed rectangles: touching the obstacle boundary is not a valid route.
  const {x,y,width:w,height:h} = rect;
  const inside = p => p.x>=x && p.x<=x+w && p.y>=y && p.y<=y+h;
  const corners=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
  return inside(a) || inside(b) || corners.some((p,i)=>intersects(a,b,p,corners[(i+1)%4]));
}
export function validateStroke(stroke) {
  if (!Array.isArray(stroke) || stroke.length < 2 || stroke.length > 256) return false;
  if (!stroke.every(p => p && typeof p.x === 'number' && typeof p.y === 'number' &&
    Number.isFinite(p.x) && Number.isFinite(p.y) && p.x>=0 && p.x<=BOARD.width && p.y>=0 && p.y<=BOARD.height)) return false;
  return stroke.some((p,i) => i>0 && distance(p,stroke[i-1])>=1);
}
export function evaluateBridge(strokes, level=LEVEL) {
  if (!Array.isArray(strokes) || strokes.length!==2 || !strokes.every(validateStroke))
    return { valid: false, success: false, reason: 'invalid_stroke' };
  const segments=strokes.map(s=>s.slice(1).map((p,i)=>[s[i],p]));
  if (segments.some(s=>s.some(([a,b])=>level.obstacles.some(r=>hitsRect(a,b,r)))))
    return { valid: true, success: false, reason: 'obstacle' };
  const touches=(segments, circle)=>segments.some(([a,b])=>pointSegmentDistance(circle,a,b)<=circle.radius);
  const joined=segments[0].some(([a,b])=>segments[1].some(([c,d])=>segmentDistance(a,b,c,d)<=level.joinTolerance));
  const connected=joined && ((touches(segments[0],level.start)&&touches(segments[1],level.goal)) ||
    (touches(segments[1],level.start)&&touches(segments[0],level.goal)));
  return {valid:true, success:connected, reason:connected?'connected':'disconnected'};
}
