//
// Animations for GA simulations
//
// (c) Lauri Savioja, 2016
//


"use strict";

function GA_animation(room) {
    this.room = room;
    this.events = [];
    this.currentDraw = 0;
}

GA_animation.prototype.addEvent = function(e) {
    this.events.push(e);
};

GA_animation.prototype.reset = function() {
    this.currentDraw = 0;
    this.buttonElement.value = this.buttonTitle;
};

GA_animation.prototype.draw = function() {
    var ctx = document.getElementById(this.room.id).getContext('2d');

    this.events[this.currentDraw].draw(ctx, this.room);
    this.currentDraw += 1;
    if (this.currentDraw == this.events.length)
        this.reset();
};

//
// Animation events
//
function GA_animationEvent() {
    this.atomicEvents = [];
}

GA_animationEvent.prototype.addAtomicEvent = function(ae) {
    this.atomicEvents.push(ae);
};


GA_animationEvent.prototype.draw = function(ctx, room) {
    var i;
    for (i=0; i<this.atomicEvents.length; i++)
        this.atomicEvents[i].draw(ctx, room);
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(this.annotation, ctx.canvas.width/2, 55);
};


GA_animationEvent.prototype.annotate = function(txt) {
    this.annotation = txt;
};

//
// Atomic event in an animation
//
function GA_animationAtomicEvent() {
    this.path = [];
}

GA_animationAtomicEvent.prototype.draw = function(ctx, room) {
    var j;
    var col = "#00b000";
    var wid = 3;
    var dash = [];

    ctx.beginPath();
    room.moveTo(ctx, this.path[0]);
    for (j=1; j<this.path.length; j++) {
        room.lineTo(ctx, this.path[j])
    }
    if (this.color)
        col = this.color;
    if (this.width)
        wid = this.width;
    if (this.dashing)
        dash = this.dashing;
    drawPath(ctx, col, wid, dash);
};


GA_animationEvent.prototype.addBeam = function(b, room, col, wid, dash) {
    var ae = new GA_animationAtomicEvent();
    var extension = 50;

    var tmp = new Vec2(b.leftDirection);
    tmp.scale(extension);
    tmp.add(b.leftLimit);
    ae.path.push(tmp);
    ae.path.push(b.center);
    tmp = new Vec2(b.rightDirection);
    tmp.scale(extension);
    tmp.add(b.rightLimit);
    ae.path.push(tmp);
    this.addAtomicEvent(ae);
    if (col)
        ae.color = col;
    if (wid)
        ae.width = wid;
    if (dash)
        ae.dashing = dash;
};

GA_animationEvent.prototype.addReflector = function(reflector, room, col) {
    var ae = new GA_animationAtomicEvent();

    ae.path.push(room.startVertices[reflector]);
    ae.path.push(room.endVertices[reflector]);
    if (col)
        ae.color = col;
    else
        ae.color = "#0000e0";
    this.addAtomicEvent(ae);
};
