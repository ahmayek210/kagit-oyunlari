import html from './staging.html';
import pg from 'pg';
import { attachDatabasePool } from '@neon/functions';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { transition } from '../src/online/room-state.mjs';
const pool = new pg.Pool({connectionString:process.env.DATABASE_URL,max:5});
attachDatabasePool(pool);
const headers={'content-type':'application/json','access-control-allow-origin':'*','access-control-allow-headers':'authorization, content-type','access-control-allow-methods':'GET, POST, OPTIONS','cache-control':'no-store'};
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
const hash=t=>createHash('sha256').update(t).digest();
async function fetch(request) {
 if(request.method==='GET' && new URL(request.url).pathname==='/') return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
 if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
 try {
  const url=new URL(request.url), path=url.pathname.replace(/\/$/,'');
  if (request.method==='GET' && path==='/health') {await pool.query('SELECT 1');return reply(200,{ok:true});}
  if(request.method!=='POST') return reply(404,{error:'not_found'});
  const raw=await request.text(); if(raw.length>20000) return reply(413,{error:'too_large'});
  let body; try {body=JSON.parse(raw);} catch {return reply(400,{error:'invalid_json'});}
  if(path==='/session') {
   if(typeof body.name!=='string' || !body.name.trim() || body.name.trim().length>22) return reply(400,{error:'invalid_name'});
   const token=randomBytes(32).toString('base64url'), id=randomUUID();
   await pool.query("INSERT INTO guest_sessions(id,token_hash,display_name,expires_at) VALUES ($1,$2,$3,now()+interval '1 day')",[id,hash(token),body.name.trim()]);
   return reply(201,{token,id});
  }
  const token=request.headers.get('authorization')?.replace(/^Bearer /,'');
  if(!token || token.length>100) return reply(401,{error:'unauthorized'});
  const session=(await pool.query('SELECT id,display_name FROM guest_sessions WHERE token_hash=$1 AND expires_at>now()',[hash(token)])).rows[0];
  if(!session)return reply(401,{error:'unauthorized'});
  if(path==='/create') {
   const id=randomUUID(); const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
   for(let i=0;i<5;i++) {const code=Array.from(randomBytes(6),b=>alphabet[b%alphabet.length]).join('');
    const state={hostId:session.id,members:[{id:session.id,name:session.display_name,ready:false}],phase:'lobby',round:null,events:[]};
    try {await pool.query("INSERT INTO rooms(id,code,game_id,expires_at,aggregate) VALUES($1,$2,'shared_bridge',now()+interval '1 day',$3)",[id,code,state]);return reply(201,{code,state});} catch(e){if(e.code!=='23505')throw e;}
   } throw Error('code_exhausted');
  }
  const code=typeof body.code==='string'?body.code.toUpperCase():'';
  if(!/^[A-Z2-9]{6}$/.test(code))return reply(400,{error:'invalid_code'});
  const client=await pool.connect();
  try {
   await client.query('BEGIN');
   const row=(await client.query('SELECT id,aggregate FROM rooms WHERE code=$1 AND expires_at>now() FOR UPDATE',[code])).rows[0];
   if(!row){await client.query('ROLLBACK');return reply(404,{error:'room_not_found'});}
   let state=row.aggregate;
   if(path==='/join') {
    if(!state.members.some(m=>m.id===session.id)) {
     if(state.phase!=='lobby'||state.members.length>=2) throw Error('room_full');
     state.members.push({id:session.id,name:session.display_name,ready:false});
    }
   } else if(path==='/state') {
    if(!state.members.some(m=>m.id===session.id))throw Error('not_member');
    if(state.phase==='playing' && Date.now()>=state.round.deadline) state=transition(state,session.id,{type:'timeout',eventId:randomUUID()},Date.now());
   } else if(path==='/command') {
    if(!body.command || typeof body.command!=='object')throw Error('invalid_command');
    state=transition(state,session.id,body.command,Date.now());
   } else throw Error('not_found');
   if (state.phase === 'closed') await client.query('DELETE FROM rooms WHERE id=$1',[row.id]);
   else await client.query('UPDATE rooms SET aggregate=$1 WHERE id=$2',[state,row.id]);
   await client.query('COMMIT');return reply(200,{code,state});
  } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
 } catch(e) {const known=['room_full','not_member','invalid_state','invalid_event','invalid_stroke','invalid_command','already_submitted','not_found'];return reply(known.includes(e.message)?400:500,{error:known.includes(e.message)?e.message:'server_error'});}
}
export default {fetch};

