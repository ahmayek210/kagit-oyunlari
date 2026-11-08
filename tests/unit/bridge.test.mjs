import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBridge, validateStroke } from '../../src/bridge/rules.mjs';
const p=(x,y)=>({x,y});
const left=[p(120,390),p(300,200),p(430,200)];
const right=[p(440,200),p(600,200),p(740,250)];
test('two joined strokes connect the targets around the obstacle',()=>assert.deepEqual(evaluateBridge([left,right]),{valid:true,success:true,reason:'connected'}));
test('two submissions alone do not form a bridge',()=>assert.equal(evaluateBridge([[p(20,20),p(30,30)],[p(50,50),p(60,60)]]).reason,'disconnected'));
test('crossing an obstacle invalidates an otherwise connected path',()=>assert.equal(evaluateBridge([[p(120,390),p(430,350)],[p(430,350),p(740,250)]]).reason,'obstacle'));
test('crossing segments connect even when endpoints are far apart',()=>{
 const level={start:{x:0,y:0,radius:2},goal:{x:100,y:0,radius:2},obstacles:[],joinTolerance:0};
 assert.equal(evaluateBridge([[p(0,0),p(80,80)],[p(20,80),p(100,0)]],level).success,true);
});
test('rejects malformed, out-of-bounds, empty and oversized input',()=>{
 for(const stroke of [[],[p(1,1)],[p(1,1),p(NaN,2)],[p(-1,0),p(1,1)],Array(257).fill(p(1,1)),[p(2,2),p(2,2)]]) assert.equal(validateStroke(stroke),false);
 assert.equal(evaluateBridge([left]).valid,false);
});
test('gap beyond tolerance is disconnected',()=>assert.equal(evaluateBridge([left,[p(450,200),p(740,250)]]).success,false));
