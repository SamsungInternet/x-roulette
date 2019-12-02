import * as THREE from "./lib/three.js";

var world = new OIMO.World({ 
  timestep: 1/60, 
  iterations: 8, 
  broadphase: 2, 
  worldscale: 10, 
  random: true, 
  info:false,
});

world.gravity = new OIMO.Vec3(0, 0.66, 0);


var RouletteGame = function() {
  this.onHit = function () { };
  this.onEnd = function () { };
  
  this.hits = 0;
  
  
  this.rot = 0;
  
  this.ball = world.add({
      type: "sphere",
      move:true,
      size:[0.3], 
      rot:[0,0,0],
      pos:[Math.sin(Math.PI) * 20,-2,Math.cos(Math.PI) * 20], 
      density:0.3,
      friction:0.3,
    restitution:3
  });
  
  this.slots = [];
  
  for(var i = 0; i < 37; i++){
    this.slots.push(world.add({
      size:[0.2, 0.3, 1], 
      pos:[Math.sin(Math.PI * i/18.5) * 3,2,Math.cos(Math.PI *i/18.5) * 3],
      rot: [0,(i / 37) * 360,0],
      density:10
    }));
  }
  
  this.bumps = [];
  
  for(var i = 0; i < 8; i++){
    this.bumps.push(world.add({
      size:[0.2, 0.1, 1.], 
      pos:[Math.sin(Math.PI * i/4 + 0.032) * 5.33,2,Math.cos(Math.PI *i/4 + 0.032) * 5.33],
      rot: [0,90 + (i / 8) * 360,0],
      density:10
    }));
  }
  
  this.ground = world.add({
      size:[100,2,100], 
      pos:[0,1.2,0],
    friction: 10
  });
  
  this.lobe = world.add({
      type:"sphere",
      size:[6], 
      pos:[0,5,0], 
      density:10
  });
  
  
  this.cylinder = world.add({
      type:"sphere",
      size:[3.1,2], 
      pos:[0,0,0], 
      density:10
  });
  
  /*
  this.lobe = {
      type:"sphere",
      size:[24, 24, 24], 
      pos:[0,11,0], 
      density:1.3 
  };
  */
  this.world = world;
  this.center = new THREE.Vector3();
  //this.spin();
}

RouletteGame.prototype.sequence = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

RouletteGame.prototype.spin = function() {
  this.rnd = Math.PI * 2 * Math.random();
  this.spinning = false;
  this.locked = false;
  this.spinPreStart = window.performance.now()/1000;
  this.spinStart = this.spinPreStart +  4 + Math.random(); 
  this.trigger = this.spinStart + 1 + Math.random() * 3;
  this.active = true;
}

RouletteGame.prototype.update = function () {
  var now = window.performance.now()/1000;
  if(!this.spinning && !this.locked) {
      var da = (this.spinStart - now) * 3.33;
      var x = Math.sin((this.rnd + da)) * 5.75, y = 0, z = Math.cos((this.rnd + da)) * 5.75;
      this.ball.resetPosition(x, y, z);
      this.ball.updatePosition(1);
    if(now > this.spinStart) {
      this.spinning = true;
      var l = Math.sqrt(x * x + z * z) * 0.33;
      x /= l;
      z /= l;
      this.ball.linearVelocity.x = -z * 0.8 ;
      this.ball.linearVelocity.z = x  * 0.8;
    }
  }
  var ct = Math.min(now - this.spinPreStart, 9) / 9;
  this.rot = -Math.PI * 2 * now * 0.2;
  var self = this;
  this.slots.forEach(function (s,i) {
    s.rot = (Math.PI * i/18.5 - self.rot);
    s.setPosition({x: Math.sin((Math.PI * i/18.5 - self.rot)) * 3.2,y:0.1,z:Math.cos((Math.PI *i/18.5 - self.rot)) * 3.2});
    s.setRotation({x:0,y:((i / 37) + now * 0.2) * 360,z: 0});
    s.updatePosition(1)
  });
  
  
  
  if(this.spinning) {
    var p = this.ball.pos;
  
    var dist = Math.sqrt(p.x * p.x + p.z * p.z);
    var force = p.clone().negate().normalize().multiplyScalar(0.000033);
      
    if(dist > 3) { 
      this.ball.applyImpulse( this.center, force );
    } 
    
     
    this.ball.linearVelocity.multiplyScalar(0.99);
    this.world.step();
    
    this.hits = 0;
    this.slots.forEach((s) =>{
      this.hits++;
      if(this.hits > 0) return;
      if(self.world.getContact( self.ball, s )) {
        //this.ball.applyImpulse( this.center, {x: 0, y: 1, z: 0} );
        self.onHit(s);
        this.hits++;
      }
    });
    if(now > this.trigger || this.world.getContact( this.ball, this.cylinder )){
      //this.spin();
      if(now > this.trigger) {
        this.spinning = false;
        this.locked = true;
        var pos = this.ball.getPosition();
        var v1 = new THREE.Vector2(pos.x,pos.z);
        var a = v1.angle();
        this.angle = -a + Math.PI / 2 + (this.rot % (Math.PI * 2));
        this.angle += (this.angle > 0 ? 1:-1) * ( this.angle % (Math.PI / 37));
        var ra = this.angle < 0 ? Math.PI * 2 - Math.abs(this.angle) % (Math.PI * 2) : Math.abs(this.angle) % (Math.PI * 2);
        var idx = Math.round(ra / (2 * Math.PI) * this.sequence.length);
        idx = (idx + 9) % this.sequence.length;
        console.log(this.sequence[idx])
        window.setTimeout(() => { this.onEnd(this.sequence[idx]) }, 1000);
        this.hits = 0;
      } 
    }
  } else if(this.locked){
    var x = Math.sin(this.angle - this.rot) * 3.1, z = Math.cos(this.angle - this.rot) * 3.1;
    // this.ball.pos.x = 0.33 * this.ball.pos.x + 0.66 * x;
    // this.ball.pos.z = 0.33 * this.ball.pos.z + 0.66 * z;
    // this.ball.pos.y = 1.1;
    this.ball.resetPosition(0.33 * this.ball.pos.x + 0.66 * x, 1.1, 0.33 * this.ball.pos.z + 0.66 * z);
    this.ball.updatePosition(1);
    
  }
  
  //console.log(this.ball.linearVelocity.length());
  
}

export {RouletteGame};