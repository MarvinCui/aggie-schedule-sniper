const test = require('node:test');
const assert = require('node:assert/strict');
const travel = require('../shared/travel-estimates');
const buildings = require('../shared/campus-buildings');

test('resolves campus building names, aliases and room suffixes', () => {
  assert.equal(travel.resolve('Wellman Hall 106').name, 'Wellman Hall');
  assert.equal(travel.resolve('wellman room 106').name, 'Wellman Hall');
  assert.equal(travel.resolve('TLC 1010').name, 'Teaching and Learning Complex');
  assert.equal(travel.resolve('Sciences Lecture Hall 123').name, 'Khaira Lecture Hall');
  assert.equal(travel.resolve('Rock Hall 194').name, 'Peter A. Rock Hall');
  assert.equal(travel.resolve('Chemistry 194').name, 'Chemistry');
});

test('unmapped, online and ambiguous locations never receive fabricated estimates', () => {
  for (const location of ['TBA', 'Online', 'Remote', 'Unknown Hall 101', '']) {
    assert.equal(travel.estimate({ location }, { location: 'Wellman Hall 106' }), null);
  }
});

test('same-building transfers include room-change time, with room number ignored', () => {
  const result = travel.estimate({ location: 'Wellman Hall 106' }, { location: 'Wellman Hall 2' });
  assert.equal(result.sameBuilding, true);
  assert.equal(result.walking, 2);
  assert.equal(result.cycling, 2);
});

test('campus distance estimates include different mode speeds and buffers', () => {
  const from = { building: 'Wellman Hall', location: 'Wellman Hall 106' };
  const to = { building: 'Giedt Hall', location: 'Giedt Hall 1001' };
  const result = travel.estimate(from, to);
  assert.equal(result.walking, 11);
  assert.equal(result.cycling, 8);
  const reverse = travel.estimate(to, from);
  assert.equal(reverse.walking, result.walking);
  assert.equal(reverse.cycling, result.cycling);
});

test('bundled snapshot contains finite campus coordinates and recognizable teaching buildings', () => {
  for (const building of buildings) {
    assert.ok(building.lat > 38.50 && building.lat < 38.58);
    assert.ok(building.lon > -121.85 && building.lon < -121.70);
  }
  for (const name of ['California Hall', 'Olson Hall', 'Kleiber Hall', 'Hunt Hall', 'Young Hall', 'Bainer Hall']) {
    assert.ok(travel.resolve(name), name);
  }
});

test('matches building keywords despite middle initials, word order and padded room numbers', () => {
  for (const location of ['Max Kleiber Hall 00003', 'Max B. Kleiber Hall 00003',
    'Kleiber Max Hall room 00003', 'Kleiber lecture hall 00003']) {
    assert.equal(travel.resolve(location).name, 'Kleiber Hall', location);
  }
  const estimate = travel.estimate({ location: 'Max Kleiber Hall 00003' }, { location: 'Wellman Hall 00006' });
  assert.ok(estimate.walking > 0);
  assert.ok(estimate.cycling > 0);
});

test('accepts a minor typo in a distinctive keyword without guessing generic or ambiguous names', () => {
  assert.equal(travel.resolve('Kleber Hall 00003').name, 'Kleiber Hall');
  for (const location of ['Hall 3', 'Kleiber Annex 3', 'Chemistry Auditorium 3', 'Unknown Hall 101']) {
    assert.equal(travel.resolve(location), null, location);
  }
  assert.equal(travel.resolve('Chemistry 194').name, 'Chemistry');
  assert.equal(travel.resolve('Rock Hall 194').name, 'Peter A. Rock Hall');
});
