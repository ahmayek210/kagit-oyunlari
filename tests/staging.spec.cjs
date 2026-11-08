const { test, expect } = require('@playwright/test');
const target=process.env.STAGING_URL;
test.skip(!target,'STAGING_URL required');
test('two independent players form a bridge and a third is rejected',async({browser})=>{
 const a=await browser.newContext(),b=await browser.newContext(),c=await browser.newContext();
 const p=await a.newPage(),q=await b.newPage(),third=await c.newPage();
 await Promise.all([p.goto(target),q.goto(target),third.goto(target)]);
 await p.locator('#name').fill('Bir');await p.locator('#create').click();await expect(p.locator('#roomcode')).not.toBeEmpty();const code=await p.locator('#roomcode').textContent();
 await q.locator('#name').fill('Iki');await q.locator('#code').fill(code);await q.locator('#join').click();await expect(q.locator('#room')).toBeVisible();
 await third.locator('#name').fill('Uc');await third.locator('#code').fill(code);await third.locator('#join').click();await expect(third.locator('#status')).toContainText('room_full');
 await p.locator('#ready').click();await q.locator('#ready').click();await expect(p.locator('#players')).toContainText('Iki ✓');await p.locator('#start').click();await expect(q.locator('#send')).toBeEnabled();
 async function line(page,points){const box=await page.locator('#board').boundingBox();const xy=([x,y])=>({x:box.x+x*box.width/860,y:box.y+y*box.height/520});let pos=xy(points[0]);await page.mouse.move(pos.x,pos.y);await page.mouse.down();for(const point of points.slice(1)){pos=xy(point);await page.mouse.move(pos.x,pos.y,{steps:10});}await page.mouse.up();await page.locator('#send').click();}
 await line(p,[[120,390],[300,200],[430,200]]);await line(q,[[440,200],[600,200],[740,250]]);await expect(p.locator('#status')).toContainText('Köprü tamamlandı',{timeout:10000});
 await p.reload();await expect(p.locator('#room')).toBeVisible({timeout:10000});await p.locator('#again').click();await q.locator('#again').click();await expect(p.locator('#ready')).toBeEnabled({timeout:10000});
 await Promise.all([a.close(),b.close(),c.close()]);
});
test('staging rejects forged scores, duplicate and invalid moves under concurrent submissions',async({request})=>{
 async function call(path,data,token){const r=await request.post(target+path,{data,headers:token?{authorization:'Bearer '+token}:{}});return {status:r.status(),data:await r.json()};}
 const a=(await call('session',{name:'API A'})).data,b=(await call('session',{name:'API B'})).data,c=(await call('session',{name:'API C'})).data;
 const created=await call('create',{},a.token),code=created.data.code;
 expect((await call('join',{code},b.token)).status).toBe(200);expect((await call('join',{code},c.token)).status).toBe(400);
 const command=(token,type,id,extra={})=>call('command',{code,command:{type,eventId:id,...extra}},token);
 await command(a.token,'ready','ready-001',{ready:true});await command(b.token,'ready','ready-002',{ready:true});await command(a.token,'start','start-001');
 expect((await command(a.token,'submit','invalid-1',{stroke:[]})).status).toBe(400);
 const s1=[{x:120,y:390},{x:430,y:200}],s2=[{x:430,y:200},{x:740,y:250}];
 const [x,y]=await Promise.all([command(a.token,'submit','event-001',{stroke:s1,score:999,userId:b.id}),command(b.token,'submit','event-002',{stroke:s2,score:999})]);
 expect(x.status).toBe(200);expect(y.status).toBe(200);const state=(await call('state',{code},a.token)).data.state;expect(state.phase).toBe('finished');expect(state.round.result.success).toBe(true);expect(state.round.result.score).toBeUndefined();
 const dup=await command(a.token,'submit','event-001',{stroke:s1});expect(dup.status).toBe(200);expect((await command(c.token,'submit','event-003',{stroke:s1})).status).toBe(400);
});
