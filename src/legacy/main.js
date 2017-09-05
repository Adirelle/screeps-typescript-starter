const roles = require('roles');

module.exports.loop = function() {
    cleanCreepMemory();
    _.each(Game.rooms, spawnCreeps);
    _.each(Game.creeps, runCreep);
};

function cleanCreepMemory() {
    for(const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            Memory.creeps[name] = undefined;
        }
    }
}

/**
 * @param {Creep} creep
 */
function runCreep(creep) {
    if (!creep.spawning) {
        const role = roles[creep.memory.role];
        if (!role) {
            creep.suicide();
            return;
        }
        role.run(creep);
    }
}

/**
 * @param {Room} room
 */
function spawnCreeps(room) {
    const pop = countCreepsByRole(room);
    _.each(roles, r => spawnRoleCreeps(room, r, pop));
}

/**
 * @param {Room} room
 *
 * @return {object}
 */
function countCreepsByRole(room) {
    const count = {};
    _.each(roles, (_, r) => count[r] = 0);
    _.each(room.find(FIND_MY_CREEPS), c => count[c.memory.role]++);
    return count;
}

/**
 * @param {Room} room
 * @param {object} role
 * @param {object} pop
 */
function spawnRoleCreeps(room, role, pop) {
    let target = role.targetPopulation(room, pop),
        wish = target,
        current = pop[role.name],
        prev = current;

    if (role.dependsOn) {
        _.each(role.dependsOn, (f, d) => {
            const limit = Math.ceil(pop[d] * f);
            if (limit < target) {
                console.log(role.name, 'limited from', target, 'to', limit, 'by', d);
                target = limit;
            }
        });
    }

    while (current < target && spawnCreep(room, role, role.bodyTemplate)) {
        current++;
    }

    console.log('spawnRoleCreeps', role.name, prev, '/', wish, '=>', current, '/', target);
}

/**
 * @param {Room} room
 * @param {object} role
 * @param {string[]} bodyTpl
 *
 * @return {Creep|null}
 */
function spawnCreep(room, role, bodyTpl) {
    const biggest = biggestBody(room, bodyTpl);
    if (!biggest) {
        return;
    }

    const creepName = biggest.spawn.createCreep(biggest.body, null, role.initMemory),
        creep = Game.creeps[creepName];
    if (!creep) {
        console.log(`Could not spawn ${role.name} in room ${room.name}: ${creepName}`);
        return;
    }

    creep.memory.role = role.name;
    console.log(`Spawning ${role.name} in room ${room.name}, name: ${creepName}, body: ${biggest.body}`);
    return creep;
}

/**
 * @param {Room} room
 * @param {string[]} bodyTpl
 *
 * @return {object|null}
 */
function biggestBody(room, bodyTpl) {
    const allSpawns = room.find(FIND_MY_STRUCTURES, {filter: s => s.structureType == STRUCTURE_SPAWN && !s.spawning});
    let biggestN = 0,
        biggestBody = null,
        biggestSpawn = null;
    _.each(allSpawns, spawn => {
        let n = 1;
        do {
            const body = repeatBody(bodyTpl, n),
                result = spawn.canCreateCreep(body)
            console.log(spawn.name, body, '=>', result);
            if (result != OK) {
                break;
            }
            if (n > biggestN) {
                biggestSpawn = spawn;
                biggestN = n;
                biggestBody = body;
            }
            n++;
        } while(true);
    });
    console.log('biggestBody', bodyTpl, '=>', biggestN, biggestBody,biggestSpawn );
    return biggestSpawn ? { spawn: biggestSpawn, body: biggestBody } : null;
}

/**
 * @param {string[]} tpl
 * @param {int} n
 *
 * @return {string[]}
 */
function repeatBody(tpl, n) {
    const body = [];
    _.each(tpl, part => {
        for(let j = 0; j < n; j++) {
            body.push(part);
        }
    });
    return body;
}


console.log("Main (re)loaded");
