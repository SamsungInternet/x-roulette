var world = new OIMO.World({ 
    timestep: 1/60, 
    iterations: 8, 
    broadphase: 2, 
    worldscale: 10, 
    random: true, 
    info:false,
});

world.gravity = new OIMO.Vec3(0, 1, 0);

var vec
return {
    init: function (ev) {
        return {
            body: world.add({
                type: ev.shape || "sphere",
                move: !!ev.move,
                size:ev.size || [0.3], 
                rot:ev.rot || vec,
                pos:ev.pos || [0, 0, 0], 
                density: ev.density || 0.6,
                friction: ev.density || 0.4,
              restitution:2.4
            })
        }
    }
}