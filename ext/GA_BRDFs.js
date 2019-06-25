//
// Acoustic Bidirectional Reflectance Distribution Function (BRDF) handling
//
// (c) Lauri Savioja, 2016
//


"use strict";

function BRDF(nofSlots) {
    var j;

    this.nofSlots = nofSlots;
    this.coeffs = [];
    for (j=0;j<nofSlots;j++)
        this.coeffs[j] = [];
}

//
// Get angle index for a BRDF from surf (p0 (=center), linéDir) to p1
//
BRDF.prototype.getAngleIndex = function(p0, lineDir, p1) {
    var angle = getLineOrientation(p0, p1);
    angle = Math.atan2(lineDir.y, lineDir.x) - angle;
    if (angle<0)
        angle += M_2_PI;
    return Math.floor((angle / M_PI) * this.nofSlots);
};

BRDF.prototype.set = function(abs, diff) {
    var reflectedEnergy = (1-abs);
    var specularEnergy = reflectedEnergy * (1-diff);
    var diffusedEnergy = reflectedEnergy - specularEnergy;
    var diffusedEnergyPerSlot = diffusedEnergy / this.nofSlots;  // Other than the specular direction
    var incoming, outgoing, specular;
    for (incoming=0;incoming<this.nofSlots;incoming++)
        for (outgoing = 0;outgoing<this.nofSlots;outgoing++) {
            this.coeffs[incoming][outgoing] = diffusedEnergyPerSlot;
            specular = this.nofSlots-incoming-1;
            if (outgoing == specular)
                this.coeffs[incoming][outgoing] += specularEnergy;
        }
};

BRDF.prototype.randomize = function() {
    var incoming, outgoing, sum;
    for (incoming=0;incoming<this.nofSlots;incoming++) {
        sum = 0;
        for (outgoing = 0; outgoing < this.nofSlots; outgoing++) {
            this.coeffs[incoming][outgoing] = Math.random();
            sum += this.coeffs[incoming][outgoing];
        }
        for (outgoing = 0; outgoing < this.nofSlots; outgoing++)
            this.coeffs[incoming][outgoing] = this.coeffs[incoming][outgoing] / sum;
    }
};

GA.prototype.createBRDFs = function() {
    var i;
    this.BRDFs = [];
    for (i=0;i<this.normals.length;i++) {
        this.BRDFs[i] = new BRDF(this.nofBRDFsectors);
        this.BRDFs[i].set(this.absorptionCoeffs[i], this.diffusionCoeffs[i]);
    }
};

GA.prototype.randomBRDF = function() {
    this.BRDFs[activeSurface].randomize();
    this.drawAll();
};
