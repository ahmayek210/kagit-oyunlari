import { evaluateBridge, validateStroke } from '../bridge/rules.mjs';

// Pure aggregate: the caller MUST authenticate actorId and serialize updates per room.
export function transition(room, actorId, command, now) {
  if (!room || !actorId || !command || !Number.isFinite(now)) throw new Error('invalid_request');
  const member = room.members.find(m => m.id === actorId);
  if (!member) throw new Error('not_member');
  if (typeof command.eventId !== 'string' || !/^[a-zA-Z0-9-]{8,64}$/.test(command.eventId)) throw new Error('invalid_event');
  if (room.events.includes(command.eventId)) return room;
  const next = structuredClone(room);
  const player = next.members.find(m => m.id === actorId);
  switch (command.type) {
    case 'ready':
      if (next.phase !== 'lobby' || typeof command.ready !== 'boolean') throw new Error('invalid_state');
      player.ready = command.ready;
      break;
    case 'start':
      if (next.phase !== 'lobby' || next.hostId !== actorId || next.members.length !== 2 || !next.members.every(m => m.ready)) throw new Error('invalid_state');
      next.phase = 'playing'; next.round = { deadline: now + 34000, submissions: {}, result: null };
      break;
    case 'submit': {
      if (next.phase !== 'playing' || !next.round || now >= next.round.deadline) throw new Error('invalid_state');
      if (Object.hasOwn(next.round.submissions, actorId)) throw new Error('already_submitted');
      if (!validateStroke(command.stroke)) throw new Error('invalid_stroke');
      next.round.submissions[actorId] = command.stroke;
      if (Object.keys(next.round.submissions).length === 2) {
        next.round.result = evaluateBridge(next.members.map(m => next.round.submissions[m.id]));
        next.phase = 'finished';
      }
      break;
    }
    case 'timeout':
      if (next.phase !== 'playing' || now < next.round.deadline) throw new Error('invalid_state');
      next.round.result = { valid: true, success: false, reason: 'timeout' }; next.phase = 'finished';
      break;
    case 'rematch':
      if (next.phase !== 'finished') throw new Error('invalid_state');
      player.rematch = true;
      if (next.members.every(m => m.rematch)) {
        next.phase = 'lobby'; next.round = null;
        next.members.forEach(m => { m.ready = false; m.rematch = false; });
      }
      break;
    default: throw new Error('invalid_command');
  }
  next.events.push(command.eventId);
  return next;
}
