//
// Air absorption
//
// (c) Lauri Savioja, 2016
//


"use strict";

var HUMIDITY = 0;
var FREQUENCY = 1;
var PLOT3D = 2;
// var TEMPERATURE = 2;
// var PRESSURE = 3;

var FRQ_SEARCH_LIMIT = 10;

function AirAbs(id) {
    this.id = id;
    console.log("Air absorption plot initialized!")
}

function airabs(f,pa,T,hrel) {
    var pr, Tr, T01, V, psat, h, frO, frN, alpha;

    pr = 101.325;  // reference pressure of one standard atmosphere
    Tr = 293.15;   // reference ambient temperature

    T01 = 273.16;   // triple-point isotherm temperature

    V = 10.79586 * (1 - (T01 / T)) - 5.02808 * log10(T / T01) + 1.50474 * (1E-4) * (1 - Math.pow(10, (-8.29692 * ((T / T01) - 1)))) + 0.42873 * (1E-3) * (-1 + Math.pow(10, (4.76955 * (1 - (T01 / T))))) - 2.2195983;

    psat = (pr) * Math.pow(10,V);

    h = hrel * (psat / pa);  // The original formula had pr involved but it was canceled out
    frO = (pa / pr) * (24 + ((4.04 * h * 1E+4) * (0.02 + h) / (0.391 + h)));

    frN = (pa / pr) * Math.sqrt(Tr / T) * (9 + 280 * h * Math.exp(-4.170 * (Math.pow((T / Tr),(-1 / 3)) - 1)));

    alpha = 8.686 * f * f * ((1.84 * (1E-11) * (pr / pa) * Math.sqrt(T / Tr)) + (Math.pow((T / Tr), (-5 / 2))) * (0.01275 * (Math.exp(-2239.1 / T)) * (frO / (frO * frO + f * f)) + 0.1068 * Math.exp(-3352 / T) * (frN / (frN * frN + f * f))));

    return alpha;
}


function recurseSearchAttenuationPoint(att, f, stepSize, hum, T, pa) {
    if (stepSize < FRQ_SEARCH_LIMIT)
        return f;
    else {
        var nextStepSize = stepSize/2;
        if (airabs(f, pa, T, hum) > att)
            return recurseSearchAttenuationPoint(att, f - nextStepSize, nextStepSize, hum, T, pa);
        else
            return recurseSearchAttenuationPoint(att, f + nextStepSize, nextStepSize, hum, T, pa)
    }
}

function search3dBpointNTP(dist, hum, T) {
    var att = 3/dist;
    return recurseSearchAttenuationPoint(att, 10000, 10000, hum, T, 101.325);
}

function linspace(start,stop,step) {
    var i;
    if (! step)
        step = 1;
    var array = [];
    var idx = 0;
    for (i=start; i<=stop; i += step) {
        array[idx] = i;
        idx += 1;
    }
    return array;
}

//
// Computes and draws everything
//
AirAbs.prototype.drawAll = function() {
    var frq, hum;
    var k, i;
    var dbPerM = [];
    var name;
    this.distance = -1;

    var div = document.getElementById(this.id);

    var T = Number(this.temperature) + 273.15;
    var p0 = Number(this.pressure) / 10;

    var layout = {
        title:'Attenuation of sound in air ',
        xaxis: {
            title: 'Frequency (Hz)'
        },
        yaxis: {
            title: 'dB / m',
            range: [-0.3, 0]
        },
        scene: {
            xaxis: {title: 'Frequency (Hz)'},
            yaxis: {title: 'Humidity (%)'},
            zaxis: {title: 'db/m', range: [-0.3, 0]}
        }
    };

    if (this.aaPlotMode == HUMIDITY) {
        layout.title = layout.title + "for different frequencies";
        layout.xaxis.title = 'Relative humidity (%)';
        frq = linspace(1000, 10000, 1000);
        hum = linspace(1, 100, 1);
        for (k=0; k<frq.length; k++) {
            dbPerM[k] = [];
            for (i = 0; i < hum.length; i++) {
                dbPerM[k][i] = this.distance * airabs(frq[k], p0, T, hum[i]);
            }
            name = Math.round(frq[k]/1000).toString() + "kHz";
            if (k==0)
                Plotly.newPlot(this.id, [{x: hum, y:dbPerM[k], name: name}], layout, {showLink: false});
            else
                Plotly.addTraces(div, {x: hum, y: dbPerM[k], name: name});
        }
    } else if (this.aaPlotMode == FREQUENCY) {
        layout.xaxis.type = 'log';
        layout.title = layout.title + "for different relative humidities";
        frq = linspace(200, 25000, 100);
        hum = linspace(10, 100, 10);
        for (k=0; k<hum.length; k++) {
            dbPerM[k] = [];
            for (i = 0; i < frq.length; i++) {
                dbPerM[k][i] = this.distance * airabs(frq[i], p0, T, hum[k]);
            }
            name = hum[k].toString() + "%";
            if (k==0)
                Plotly.newPlot(this.id, [{x: frq, y:dbPerM[k], name: name}], layout, {showLink: false});
            else
                Plotly.addTraces(div, {x: frq, y: dbPerM[k], name: name});
        }
    } else { // And here we come 3D plot!
        frq = linspace(20, 10000, 100);
        hum = linspace(5, 100, 1);
        for (k=0; k<hum.length; k++) {
            dbPerM[k] = [];
            for (i = 0; i < frq.length; i++) {
                dbPerM[k][i] = this.distance * airabs(frq[i], p0, T, hum[k]);
            }
        }
        Plotly.newPlot(this.id, [{x: frq, y: hum, z:dbPerM, type: 'surface'}], layout, {showLink: false});
    }

    updateInformationFields(this.informationFields);

    console.log("Nyt lasketaan ja piirretään.");
};

//
// Air absorption filter
//

var hannWindow = [];

function makeAAFilter(dist, N) {
    var i;
    var frqStep = (44100/2)/N;
    var frq = 0;
    var mag;
    var pa = 101.325;
    var T = 273.15+20;
    var hrel = 50;
    var magLin_r = [];
    var magLin_i = [];
    for (i=0;i<=N;i++) {
        mag = dist*airabs(frq, pa, T, hrel);
        magLin_r[i] = Math.pow(10,-mag/20);
        magLin_i[i] = 0;
        if ((i>0) && (i<N)) {
            magLin_r[2*N-i] = magLin_r[i];
            magLin_i[2*N-i] = -magLin_i[i];
        }
        frq += frqStep;
    }
    inverseTransform(magLin_r, magLin_i);
    var coeff = magLin_r;
    for (i=0;i<2*N;i++)
        coeff[i] = coeff[i] / (2*N);
    shiftAndWindow(coeff);
    return coeff;
}


function makeHannWindow(N) {
    if ((typeof hannWindow != 'undefined') && (hannWindow.length == N))
        return;
    else  {
        var i;
        for (i=0;i<N;i++) {
            hannWindow[i] = 0.5*(1-Math.cos(2*Math.PI*i/(N-1)));
        }
    }
}

function shiftAndWindow(s) {
    var N = s.length;
    var i;
    var tmp;

    makeHannWindow(N);
    for (i=0; i<(N/2); i++) {
        tmp = s[i];
        s[i] = hannWindow[i] * s[(N/2)+i];
        s[(N/2)+i] = hannWindow[(N/2)+i] * tmp;
    }
}
//
// Base class for all Geometrical Acoustics (GA) simulations
//
// (c) Lauri Savioja, 2016
//

"use strict";

// The following constants should have the same values in the awk-scripts as well!

// Simulation modes
var MAKE_IS = 0;
var MAKE_IS_PATHS = 1;
var CREATE_RAYS = 2;
var CREATE_BRDFS = 3;
var ART = 4;
var BEM = 5;

// Visualization modes
var WAVE_FRONTS = 0;
var FULL_RAYS = 1;
var BEAMS = 2;
var RAY_EXTENSIONS = 3;
var RAY_SEGMENTS = 4;
var RAY_EMISSION = 5;
var BRDF_SLOTS = 6;
var RADIANCE = 7;
var SHOW_RECEIVER = 8;
var SHOW_PRIMARY_SOURCE = 9;

// Status for rays
var OK = 0;
var OUT_OF_SURFACE = 1;
var WRONG_SIDE = 2;
var OBSTRUCTED = 3;
var AUDIBLE = 4;
// ESCAPED = 5;

// Ray type
var IMAGE_SOURCE_RAY = 0;
var CAST_RAY = 1;
var DIFFUSE_SPLIT_RAY = 2;
var DIFFUSE_SHADOW_RAY = 3;

// Use of beams
var NO_BEAMS = 0;
var SIMPLE_BEAMS = 1;
var BEAM_CLIPPING = 2;
var FULL_CLIPPING = 3;

// Beam visualization
var SHOW_NO_BEAMS = 0;
var SINGLE_BEAM = 1;
var BEAM_BRANCH = 2;
var ALL_BEAMS = 3;

// Ray distribution
var UNIFORM = 0;
var JITTERED = 1;
var RANDOM = 2;

// Ray visualization
var ALL_RAYS = 0;
var AUDIBLE_RAYS = 1;

// Initial ray energy
var ENERGY_PER_RAY = 100;

// Diffusion model
var SHADOW_RAYS = 0;

// Number of rays in ART shoot
//ART_RAYS_PER_SHOOT = 500;
var ART_RAYS_PER_SHOOT = 200;
var ART_INITIAL_RESPONSE_LENGTH = 5;  // Internal samples, i.e. internal time units, i.e. internal distance units

// ART visualization
var TOTAL_ENERGY = 0;
var INSTANTANEOUS_ENERGY = 1;

var ALL_ENERGY = 0;
var UNSHOT_ENERGY = 1;

// Maximum number of image sources
var MAX_IMAGE_SOURCES = 65535;

// Time limit for full path visualization (used in testing if we are going to visualize the whole paths --- beware!!!)
var FULL_PATH_VISUALIZATION_TIME = 100000;

// Absorption of reflection paths
var DISTANCE = 0;
var MATERIAL_ABSORPTION = 1;
var AIR_ABSORPTION = 2;

// Response visualization
var IMPULSE_RESPONSE = 0;
var ETC_CURVE = 1;
var SCHROEDER_PLOT = 2;

// Material database
var HARD = 0;
var DIFFUSE = 1;
var SEMIDIFFUSE = 2;
var ABS05 = 3;
var AUDIENCE = 4;

var materials=[];
materials[HARD] = {abs: 0, diff: 0};
materials[DIFFUSE] = {abs: 0, diff: 1};
materials[SEMIDIFFUSE] = {abs: 0, diff: 0.5};
materials[ABS05] = {abs: 0.5, diff: 0};
materials[AUDIENCE] = {abs: 0.2, diff: 0.5};

// Math constants
var M_PI = Math.PI;
var M_PI_2 = Math.PI/2;
var M_2_PI = Math.PI * 2;
var EPS = 1e-10;
// EPS = 0;

// GLOBAL VARIABLES
var g_listOfRoomsForRedraw = [];

var activeSurface = 0;

GA.prototype.updateGeometry = function() {
    console.log("Now updating the geometry!");
    var surfID;
    for (surfID=0;surfID<this.startVertices.length;surfID++) {
        this.lineDirs[surfID] = new Vec2(this.endVertices[surfID]);
        this.lineDirs[surfID].sub(this.startVertices[surfID]);
        this.lineNormDirs[surfID] = new Vec2(this.lineDirs[surfID]);
        this.lineNormDirs[surfID].normalize();
        this.normals[surfID] = new Vec2(this.lineDirs[surfID].y, -this.lineDirs[surfID].x);
        this.normals[surfID].normalize();
        this.surfaceNormalAngles[surfID] = Math.atan2(this.normals[surfID].y, this.normals[surfID].x);
        this.centers[surfID] = new Vec2(this.startVertices[surfID]);
        this.centers[surfID].add(this.endVertices[surfID]);
        this.centers[surfID].scale(0.5);
    }
    this.closer = [];    // Vertices to surround the space at canvas boundaries if an open space
    if (this.buildAutoHideCloser == 1) {
        this.closer.push(new Vec2(5000, this.endVertices[this.endVertices.length-1].y));
        this.closer.push(new Vec2(5000, -5000));
        this.closer.push(new Vec2(-5000, -500));
        this.closer.push(new Vec2(-5000, this.startVertices[0].y));
    }
    this.clipChanged = 1;
};

GA.prototype.addPatches = function(surfID, startVert, endVert, absCoeff, diffCoeff, label) {
    var surfLen = startVert.distance(endVert);
    var nofSurfs = Math.ceil(surfLen / this.patchSize);
    var i;
    this.startVertices[surfID] = startVert;
    this.absorptionCoeffs[surfID] = absCoeff;
    this.diffusionCoeffs[surfID] = diffCoeff;
    if (label == "")
        label = (surfID+1).toString();
    this.labels[surfID] = label;

    for (i=1; i<nofSurfs; i++) {
        var newVert = new Vec2(endVert);
        newVert.sub(startVert);
        newVert.scale(i/nofSurfs);
        newVert.add(startVert);
        this.endVertices[surfID] = newVert;
        surfID++;
        this.startVertices[surfID] = newVert;
        this.absorptionCoeffs[surfID] = absCoeff;
        this.diffusionCoeffs[surfID] = diffCoeff;
        this.labels[surfID] = label + "_" + i.toString();
    }
    this.endVertices[surfID] = endVert;
    surfID++;

    return surfID;
};

GA.prototype.prepareGeometry = function(roomID) {
    this.roomID = roomID;

    // Separate source and receiver from the rest
    this.sources = [];
    this.sources[0] = new Source(new Vec2(this.vertices[this.objects[roomID][0].start-2]), 0, -1, -1);
    this.receivers = [];
    this.receivers[0] = new Receiver(this.vertices[this.objects[roomID][0].start-1]);

    // Local copy of the vertices, and normals
    this.startVertices = [];
    this.endVertices = [];
    this.lineDirs = [];
    this.lineNormDirs = [];
    this.normals = [];
    this.surfaceNormalAngles = [];
    this.centers = [];
    this.absorptionCoeffs = [];
    this.diffusionCoeffs = [];
    this.labels = [];
    this.showLabels = false;
    var surfID = 0, surfStartID = 0;
    var obj, i;
    var startVert, endVert;
    for (obj = 0; obj < this.objects[roomID].length; obj++) {
        for (i = this.objects[roomID][obj].start; i < this.objects[roomID][obj].end; i++) {
            if (i > this.objects[roomID][obj].start)
                startVert = this.endVertices[surfID - 1];
            else {
                surfStartID = surfID;
                startVert = new Vec2(this.vertices[i].x, this.vertices[i].y);
            }
            if ((i < (this.objects[roomID][obj].end - 1)) ||
                ((this.vertices[i + 1].x != this.vertices[this.objects[roomID][obj].start].x) ||
                 (this.vertices[i + 1].y != this.vertices[this.objects[roomID][obj].start].y)))
                endVert = new Vec2(this.vertices[i + 1].x, this.vertices[i + 1].y);
            else
                endVert = this.startVertices[surfStartID];  // Close the loop by pointing to the startingVertex - not a copy of it!
            surfID = this.addPatches(surfID, startVert, endVert, materials[this.materialIDs[i]].abs, materials[this.materialIDs[i]].diff, this.rawLabels[i]);
        }
    }
    this.updateGeometry();

    // Initialize the ray path array
    this.rayPaths = [];
    this.BRDFs_created = false;
    this.ART_responses_created = false;
};

GA.prototype.verticesToInternalCoordinates = function() {
    var i;
    if (!this.aspectRatio)
        this.aspectRatio = this.origWidth / this.origHeight;
    for (i=0;i<this.vertices.length;i++)  // Move the coordinates from (0,100) - (0,100) range to (-width/2,width/2) - (-height/2, height/2)
        this.vertices[i].set((this.vertices[i].x-50)*this.origWidth/100, (this.vertices[i].y-50)*(this.origWidth/this.aspectRatio)/100);
};

function GA(id, vertices, objects, materialIDs, labels, closedFlag) {
    console.log("Making a new GA figure: " + id);
    this.id = id;
    this.showOutside = 1;
    this.coverFig = 0;
    this.clipChanged = false;
    this.saved = 0;

    this.roomID = 0;
    this.patchSize = 5000; // Any big number to guarantee one patch per surface
    this.responseLength = ART_INITIAL_RESPONSE_LENGTH;
    this.updateCounter = 0;
    this.inAnimation = false;

    this.sourceCanMove = true;
    this.geometryCanChange = true;

    // Let us scale everything to the canvas coordinates
    var ctx = document.getElementById(this.id).getContext('2d');
    this.origWidth = ctx.canvas.width;
    this.origHeight = ctx.canvas.height;
    this.aspectRatio = this.origWidth / this.origHeight;

    this.vertices = vertices;
    this.objects = objects;
    this.materialIDs = materialIDs;
    this.rawLabels = labels;
//    this.verticesToInternalCoordinates();

//    this.vertices[i].set((vertices[i].x-50)*origWidth/100, (vertices[i].y-50)*this.origHeight/100);
    this.scaler = 1.0;

    this.resize(ctx.canvas);

    this.buildAutoHideCloser = 1 - closedFlag;

    // For indexing all the below, use the constants presented at the beginning of this file!
    // Array that tells what should be visualized. Geometry is visualized in any case
    this.visualize = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.visualize[SHOW_RECEIVER] = 1;
    this.visualize[SHOW_PRIMARY_SOURCE] = 1;
    // What cases of image sources will be visualized
    this.isVisualize = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    // What reflection orders will be visualized with image sources
    this.showOrders = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    // What will be simulated
    this.simulationModes = [0, 0, 0, 0, 0, 0, 0, 0];
    this.useOfBeams = NO_BEAMS;
    // Ray emission distribution
    this.rayDistribution = [0, 0, 0];
    // Ray visualization
    this.rayVisualization = ALL_RAYS;
    this.receiverRadius = 0;
    // Ray diffusion
    this.rayDiffusionModel = [0, 0, 0];
    // Beam visualization
    this.beamToBeVisualized = 1;

    this.maxOrder = 1;
    this.BRDFvisualizationScaler = 1.0;

    this.attenuation = [0, 0, 0, 0, 0, 0, 0, 0]; // Attenuation of reflection paths in impulse response generation

    g_listOfRoomsForRedraw.push(this);
    console.log("Initialized!")
}

GA.prototype.changeGeometry = function(ev) {
    console.log("New geometry: ", ev.value);
    this.prepareGeometry(ev.value);
    this.computeAll();
    this.drawAll();
};

GA.prototype.repatch = function() {
    console.log("New patch size: ", this.patchSize);
    this.prepareGeometry(this.roomID);
    this.computeAll();
    this.drawAll();
};

GA.prototype.computeAll = function() {
    console.log("Compute all upto order ", this.maxOrder);
    if (this.simulationModes[MAKE_IS] == 1) {
        if (this.sources.length > 1)
            this.sources.splice(1, this.sources.length-1);
        this.computeImageSources(this.sources[0], this.maxOrder);
    }
    this.rayPaths = [];
    if (this.simulationModes[MAKE_IS_PATHS] == 1)
        this.constructAllISRayPaths();
    if (this.simulationModes[CREATE_RAYS] == 1) {
        console.log("Starting ray creation.");
        this.createRays(this.nofRays, this.sources[0], this.sources[0].loc, 0, CAST_RAY, ENERGY_PER_RAY, 0, M_2_PI);
        console.log("Rays created.");
        this.reflectRays(0);
        console.log("Rays reflected.");
        this.checkAudibilities();
        console.log("Visibilities checked.");
        this.updateShadowRays();
    }
    if ((this.simulationModes[CREATE_BRDFS] == 1) && (this.BRDFs_created == false)) {
        this.createBRDFs();
        this.BRDFs_created = true;
        this.ART_responses_created = false;
    }
    if ((this.simulationModes[ART] == 1) && (this.ART_responses_created == false)) {
        this.createARTresponses();
        this.rayPaths = [];
    }
    if (this.simulationModes[BEM] == 1) {
        this.createSecondarySources();
    }
};

// Ray tracing and ART helpers
GA.prototype.resetAndReflectRays = function() {
//    this.receivers[0].reset();
    this.resetRays();
    this.reflectRays(0);
//    if (this.rayDiffusionModel[SHADOW_RAYS])
//        this.createShadowRays();
    this.checkAudibilities();
    this.updateShadowRays();
};

GA.prototype.setDiffusionAndRecompute = function() {
    var i;
    for (i=0; i<this.diffusionCoeffs.length; i++)
        this.diffusionCoeffs[i] = this.generalDiffusion;
    if (this.simulationModes[CREATE_RAYS] == 1)
        this.resetAndReflectRays();
    if (this.simulationModes[CREATE_BRDFS] == 1)
        this.createBRDFs();
};

GA.prototype.setAbsorptionAndRecompute = function() {
    var i;
    for (i=0; i<this.absorptionCoeffs.length; i++)
        this.absorptionCoeffs[i] = this.generalAbsorption;
    if (this.simulationModes[CREATE_RAYS] == 1)
        this.updateShadowRays();
    if (this.simulationModes[CREATE_BRDFS] == 1)
        this.createBRDFs();
};

GA.prototype.updateShadowRays = function() {
    this.checkAudibilities(); // Makes too much computation, but cleans the registeredPaths efficiently :-)
    this.clearShadowRays();
    if (this.rayDiffusionModel[SHADOW_RAYS] == 1) {
        this.createShadowRays();
        console.log("Shadow rays created.");
    }
};

// ART helper
GA.prototype.createBRDFsAndARTresponses = function() {
    this.createBRDFs();
    this.createARTresponses();
};
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
//
// Acoustic Radiance Transfer (ART)
//
// (c) Lauri Savioja, 2016
//

"use strict";

var ARTinitialShootEnergy = 500;

GA.prototype.createARTresponses = function() {
    var i;
    this.rayPaths = [];
    this.unshotARTenergy = [];
    this.totalUnshotARTenergy = [];
    this.ARTenergy = [];
    this.totalARTenergy = [];
    this.rayWeightsPerARTSegment = [];
    for (i=0;i<this.startVertices.length;i++) {
        this.unshotARTenergy[i] = new DirectionalResponse(this.nofBRDFsectors, this.responseLength);
        this.totalUnshotARTenergy[i] = new DirectionalResponse(this.nofBRDFsectors, 1);
        this.ARTenergy[i] = new DirectionalResponse(this.nofBRDFsectors, this.responseLength);
        this.totalARTenergy[i] = new DirectionalResponse(this.nofBRDFsectors, 1);
    }
    this.sources[0].ARTemission = new DirectionalResponse(1, 1);
    this.sources[0].ARTemission.responseToDirection[0].values[0] = ARTinitialShootEnergy;

    this.ART_responses_created = true;
};

GA.prototype.createNextARTraysAndReflect = function() {
    var i;
    var maxEnergy = -1, e, nextSurfToShoot;
    for (i=0;i<this.startVertices.length; i++) {
        e = this.totalUnshotARTenergy[i].sum();
        if (e>maxEnergy) {
            maxEnergy = e;
            nextSurfToShoot = i;
        }
    }
    this.rayPaths = [];

    // Compute weights for the rays

    console.log("Next shoot:" + nextSurfToShoot);

    var emission = this.unshotARTenergy[nextSurfToShoot];
    var totalEnergy = emission.sum();
    var nofSlots = this.BRDFs[nextSurfToShoot].nofSlots;
    var energyInSlot;
    var fractionOfTotalEnergy = [];
    var raysPerSlot = [];
    var maxRaysPerSlot = (2*ART_RAYS_PER_SHOOT) / nofSlots;
    var slotSize = M_PI / nofSlots;
    var maxAngle = this.surfaceNormalAngles[nextSurfToShoot] + M_PI_2;
    var minAngle = maxAngle - slotSize;
    for (i=0; i<nofSlots; i++) {
        energyInSlot = emission.responseToDirection[i].sum();
        if (energyInSlot > 0) {
            fractionOfTotalEnergy[i] = energyInSlot / totalEnergy;
            raysPerSlot[i] = Math.max(1, Math.floor(fractionOfTotalEnergy[i] * maxRaysPerSlot));
            this.createRays(raysPerSlot[i], nextSurfToShoot, this.centers[nextSurfToShoot], 0, CAST_RAY, 1/raysPerSlot[i], minAngle, maxAngle);
        } else
            raysPerSlot[i] = 0;
        maxAngle = minAngle;
        minAngle -= slotSize;
    }

    this.reflectRays(0);

    this.unshotARTenergy[nextSurfToShoot].clear();
};

GA.prototype.nextARTshoot = function() {
    // Emission
    if (this.rayPaths.length == 0) {// Initial shoot
        this.createRays(ART_RAYS_PER_SHOOT, this.sources[0], this.sources[0].loc, 0, CAST_RAY, 1 / ART_RAYS_PER_SHOOT, 0, M_2_PI);
        this.reflectRays(0);
    } else
        this.createNextARTraysAndReflect();

    var i;
    // Update cumulative energies
    for (i=0;i<this.startVertices.length; i++) {
        this.totalUnshotARTenergy[i].accumulateFrom(this.unshotARTenergy[i]);
        this.totalARTenergy[i].accumulateFrom(this.ARTenergy[i]);
    }
};

GA.prototype.startNextShootAnimation = function() {
    this.nextARTshoot();
    var i;
    var maxTime = -1;
    this.rayVisualization = ALL_RAYS;
    this.rayVisualizationOrder = 0;
    for (i=0;i<this.rayPaths.length;i++)
        maxTime = Math.max(maxTime, this.rayPaths[i].durations[0]);
    this.time = 0;
    this.maxTime = Math.round(maxTime);
};

var room;
var times;
var buttonElement = -1;
var originalButtonValue;
var originalEnergyValue;
var originalTemporalValue;
var originalValue;
var speed = 1;

function ARTshoot() {
    if (times>0) {
        if (room.time == 0) {
            if (buttonElement != -1)
                buttonElement.value = times.toString() + " left.";
            room.startNextShootAnimation();
        }
        room.inAnimation = true;
        room.time += speed;
        room.drawAll(false);
        if (room.time > room.maxTime) {
            room.time = 0;
            times--;
            if (times == 0) {
                buttonElement.value = originalValue;
                room.visualize[RAY_SEGMENTS] = 0;
                room.ARTenergyVisualization = originalEnergyValue;
                room.ARTtemporalVisualization = originalTemporalValue;
            }
        }
        setTimeout(ARTshoot, 0.01);
    }
    else {
//        console.log("FInal draw!")
        room.inAnimation = false;
        room.drawAll();
    }
}

//
// Starts animation of t shoots. Time is advanced by v at each frame
//
GA.prototype.ARTshootAnimation = function(bE, t, v) {
    room = this;
    times = t;
    buttonElement = bE;
    originalValue = bE.value;
    originalEnergyValue = this.ARTenergyVisualization;
    originalTemporalValue = this.ARTtemporalVisualization;
    this.ARTenergyVisualization = UNSHOT_ENERGY;
    this.ARTtemporalVisualization = TOTAL_ENERGY;
    room.visualize[RAY_SEGMENTS] = 1;
    room.rayVisualization = ALL_RAYS;
    room.rayVisualizationOrder = 0;
    speed = v;
    ARTshoot();
};



GA.prototype.ARTshoot1Toggle = function(bE, div, speed) {
    toggle_visibility(div);
    if (this.visualize[BRDF_SLOTS] == 1) {
        bE.value = "Back to setup";
        this.visualize[BRDF_SLOTS] = 0;
            this.ARTshootAnimation(bE, 1, speed);
        var i;
        for (i=0;i<this.disabledButtons.length; i++) {
            db = document.getElementById(this.disabledButtons[i]);
            db.disabled = false;
        }
        db = document.getElementById(this.geometrySelectionId);
        db.disabled = true;
        this.sourceCanMove = false;
        this.geometryCanChange = false;
    } else {
        this.visualize[BRDF_SLOTS] = 1;
        bE.value = "Initial shoot";
        var db;
        for (i=0;i<this.disabledButtons.length; i++) {
            db = document.getElementById(this.disabledButtons[i]);
            db.disabled = true;
        }
        db = document.getElementById(this.geometrySelectionId);
        db.disabled = false;
        this.timeSlider = 0;  // Hard reset the time (TODO: Reset the slider as well)
        this.createARTresponses();
        this.drawAll();
        this.sourceCanMove = true;
        this.geometryCanChange = true;
    }
};

GA.prototype.radiosityInitialShootAndToggle = function(bE, doAnimation) {
    bE.value = "1 x shoot";
    if (doAnimation)
        this.ARTshootAnimation(bE, 1, 3);
    else {
        this.nextARTshoot();
        this.drawAll();
    }

    if (!this.radiosityInitialShootDone) {
        for (i = 0; i < this.disabledButtons.length; i++) {
            db = document.getElementById(this.disabledButtons[i]);
            db.disabled = false;
        }
        this.timeSlider = 0;
    }
    this.radiosityInitialShootDone = true;
    this.sourceCanMove = false;
    this.geometryCanChange = false;
};

GA.prototype.registerARTenergies = function(srcID, rcvSurfID, flightTime, intersectionPoint, gain) {
    var srcLoc;
    var emission;
    if (srcID instanceof Source) {
        srcLoc = srcID.loc;
        emission = srcID.ARTemission.responseToDirection[0];
    } else {
        srcLoc = this.centers[srcID];
        var outAngleIdx = this.BRDFs[srcID].getAngleIndex(this.centers[srcID], this.lineDirs[srcID], intersectionPoint);
        emission = this.unshotARTenergy[srcID].responseToDirection[outAngleIdx];
    }
    var incidentAngleIdx = this.BRDFs[rcvSurfID].getAngleIndex(this.centers[rcvSurfID], this.lineDirs[rcvSurfID], srcLoc);

    var startEnergyAtReceiver = this.ARTenergy[rcvSurfID].sum();
    var emissionEnergy = emission.sum() * gain;

    this.unshotARTenergy[rcvSurfID].delayMultiplyAdd(emission, flightTime, this.BRDFs[rcvSurfID].coeffs[incidentAngleIdx], gain);
    this.ARTenergy[rcvSurfID].delayMultiplyAdd(emission, flightTime, this.BRDFs[rcvSurfID].coeffs[incidentAngleIdx], gain);

//    var endEnergyAtReceiver = this.ARTenergy[rcvSurfID].sum();
//    console.log(emissionEnergy + " E tranferred: balance change:" + (endEnergyAtReceiver - startEnergyAtReceiver));
//    this.ARTenergy[rcvSurfID].printNonZero(rcvSurfID+" reg: ");
};

GA.prototype.debugEPrint = function() {
    var i;
    for (i=0; i<this.lineDirs.length; i++) {
        console.log("surf: " + i + ". Total: " + this.totalARTenergy[i].sum() + ". Unshot: " + this.totalUnshotARTenergy[i].sum());
    }
};

GA.prototype.ARTprintNonZero = function() {
    var i;
    for (i=0; i<this.lineDirs.length; i++) {
        this.ARTenergy[i].printNonZero(i + ". total");
        this.unshotARTenergy[i].printNonZero(i + ". unshot");
    }
};

GA.prototype.printTotalEnergies = function() {
    var total = 0;
    var totalUnshot = 0;
    var startEnergy = this.sources[0].ARTemission.sum();
    var surfID;

    for (surfID = 0; surfID < this.lineDirs.length; surfID++) {
        total += this.totalARTenergy[surfID].sum();
        totalUnshot += this.totalUnshotARTenergy[surfID].sum();
    }
    console.log("Starting energy: ", startEnergy);
    console.log("  Unshot energy: ", totalUnshot);
    console.log("   Total energy: ", total);
};


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
//
// Beam-tracing
//
// (c) Lauri Savioja, 2016
//


"use strict";

GA.prototype.geometricBeamClippingAnimation = function(buttonElement) {
    if ((!(this.animation)) || (this.animation.currentDraw == 0))
        this.makeFullBeamClippingAnimation();
    if (!(this.animation.buttonElement)) {
        this.animation.buttonElement = buttonElement;
        this.animation.buttonTitle = buttonElement.value;
    }
    this.drawAll();
    this.animation.draw();
    if (this.animation.currentDraw>0)
        buttonElement.value = "Next step";
};

GA.prototype.makeFullBeamClippingAnimation = function() {
    var e;
    var OK = true;
    var origBeam, clipperBeam;
    this.animation = new GA_animation(this);


    e = new GA_animationEvent();
    if (!this.sourceInFrontOfReflector(this.sources[0], 0)) {
        e.addReflector(0, this);
        e.annotate("Move the source upwards, please!");
        OK = false;
    } else {
        origBeam = this.newBeam(this.sources[0].loc, 0);
        e.addBeam(origBeam, this);
        e.addReflector(0, this);
        e.annotate("The original beam");
    }
    this.animation.addEvent(e);

    if (OK) {
        var clipper;
        for (clipper = 1; clipper < this.startVertices.length; clipper++) {
            e = new GA_animationEvent();

            if (!this.sourceInFrontOfReflector(this.sources[0], clipper)) {
                e.addReflector(clipper, this);
                e.annotate("Surface not facing the source.")
            } else { // OK for clipping!
                clipperBeam = this.newBeam(this.sources[0].loc, clipper);
                e.addBeam(clipperBeam, this, "#e00000");
                e.addReflector(clipper, this);
                e.annotate("Beam of the occluder");
                this.animation.addEvent(e);

                e = new GA_animationEvent();
                e.addBeam(origBeam, this);
                e.addBeam(clipperBeam, this, "#e00000");

                clipperBeam.intersect(origBeam, true);
                clipperBeam.computeLimitsFromAngles(this.startVertices[0], this.lineDirs[0]);

                e.addBeam(clipperBeam, this, "#000000", 5, [10, 10]);
                e.annotate("Intersection of the two beams");
                this.animation.addEvent(e);

                e = new GA_animationEvent();
                origBeam.substractLineSegment(this.startVertices[clipper], this.endVertices[clipper]);
                if (origBeam.angle>0) {
                    origBeam.computeLimitsFromAngles(this.startVertices[0], this.lineDirs[0]);

                    e.addBeam(origBeam, this);
                    e.annotate("Original beam after clipping")
                } else {
                    e.annotate("Nothing left of the original beam!");
                    OK = false;
                }
            }
            this.animation.addEvent(e);
        }

        if (OK) {
            e = new GA_animationEvent();

            e.addBeam(origBeam, this, "#00b000", 1, [3, 10]);
            origBeam.reflectSector(this.lineNormDirs[0], this.centers[0]);
            e.addBeam(origBeam, this);
            e.annotate("Final clipped beam after reflection!");
            this.animation.addEvent(e);
        }
    }

};

//
// Image source method
//
// (c) Lauri Savioja, 2016
//


"use strict";

GA.prototype.sourceInFrontOfReflector = function(src, refl) {
    return src.loc.inFrontOfPlane(this.centers[refl], this.normals[refl]);
};

GA.prototype.reflectorInFrontOfOtherReflector = function(prevRefl, newRefl) {
    if (prevRefl == -1)
        return true;
    if (this.startVertices[newRefl].inFrontOfPlane(this.centers[prevRefl], this.normals[prevRefl]))
        return true;
    return (this.endVertices[newRefl].inFrontOfPlane(this.centers[prevRefl], this.normals[prevRefl]));
};

GA.prototype.computeImageSources = function(src, maxOrder) {
    var i;
    var reflectSource;
    var newBeam;
    for (i = 0; i < this.centers.length; i++)
        if ((this.sourceInFrontOfReflector(src, i)) &&
            (this.reflectorInFrontOfOtherReflector(src.reflector, i))) {
            reflectSource = 1;
            if (this.useOfBeams >= SIMPLE_BEAMS) {
                newBeam = this.newBeam(src.loc, i);

                newBeam.intersect(src.beam, (this.useOfBeams >= BEAM_CLIPPING));
                if (newBeam.angle > 0)
                    newBeam.computeLimitsFromAngles(this.startVertices[i], this.lineDirs[i]);
                if (this.useOfBeams == FULL_CLIPPING) {
                    var j;
                    for (j = 0; ((j < this.centers.length) && (newBeam.angle > 0)); j++)  // Go through all surfaces to find occluders.
                        if ((j != i) && (j != src.reflector) &&
                            (this.reflectorInFrontOfOtherReflector(src.reflector, j))) {  // Let us try to find out if the possible occluder is in between the old and the new.
                            if (src.reflector != -1)
                                newBeam.computeStartingPoints(this.startVertices[src.reflector], this.endVertices[src.reflector]);
                            newBeam.substractLineSegment(this.startVertices[j], this.endVertices[j]);
                            newBeam.computeLimitsFromAngles(this.startVertices[i], this.lineDirs[i]);
                        }
                }

                // newBeam.debug("New limits: ");
                if (newBeam.angle == 0)
                    reflectSource = 0;
            }

            if (reflectSource == 1) {
                var newLoc = src.loc.reflect(this.lineNormDirs[i], this.centers[i]);
                var newSource = new Source(newLoc, src.order + 1, src, i);
                if (this.useOfBeams >= SIMPLE_BEAMS) {
                    newBeam.reflectSector(this.lineNormDirs[i], this.centers[i]);
                    newSource.beam = newBeam;
                }
                if (this.sources.length < MAX_IMAGE_SOURCES) {
                    this.sources.push(newSource);
                    src.children.push(newSource);
                    if (maxOrder > 1)
                        this.computeImageSources(newSource, maxOrder - 1)
                }
            }
        }
};

Ray.prototype.markObstructions = function(room, rcv, srcloc, reflector) {
    var i;
    var rayDir = getDir(rcv, srcloc);
    for (i = 0; i < room.startVertices.length; i++)
        if (i != reflector) {  // Let us test intersection against all the other surfaces//
            if (segmentsIntersect(room.startVertices[i], room.lineDirs[i], rcv, rayDir, 1))
                this.status = OBSTRUCTED;
        }
};

Ray.prototype.addISSections = function(room, rcv, src) {
    this.points[src.order+1] = rcv;
    var rayDir = getDir(src.loc, rcv);
    this.directions[src.order] = rayDir;
    if (src.order > 0) {
        var intersection = intersectionPoint(src.loc, rayDir, room.startVertices[src.reflector], room.lineDirs[src.reflector]);
        var t_xpoint = intersect(src.loc, rayDir, room.startVertices[src.reflector], room.lineDirs[src.reflector]);
        var xpointToRcv = getDir(intersection, rcv);
        this.durations[src.order] = xpointToRcv.timeOfFlight();
        this.reflectors[src.order] = src.reflector;

        if (rayDir.dot(xpointToRcv) < 0)
            this.status = WRONG_SIDE;
        if ((this.status == OK) && ((t_xpoint < 0) || (t_xpoint > 1)))  // Initial path validation
            this.status = OUT_OF_SURFACE;
        if (this.status == OK)  //Further path validation
            this.markObstructions(room, rcv, intersection, src.reflector);

        var xpointToSrc = getDir(intersection, src.loc);
        this.startTimes[src.order] = xpointToSrc.timeOfFlight();

        this.addISSections(room, intersection, src.parent);
    } else {
        this.points[0] = src.loc;
        this.startTimes[0] = 0;
        this.durations[0] = rayDir.timeOfFlight();
        this.energies[0] = 1;     // Actually this is not energy, but pressure
        if (this.status == OK)
            this.markObstructions(room, rcv, src.loc, -1)
    }
};

GA.prototype.constructAllISRayPaths = function() {
    var i;

    this.receivers[0].reset();
    for (i=0;i<this.sources.length;i++) {
        var r = new Ray(this.sources[i]);
        r.type = IMAGE_SOURCE_RAY;
        r.addISSections(this, this.receivers[0].loc, this.sources[i]);
        r.order = this.sources[i].order;
        this.rayPaths[i] = r;
        if (r.status == OK) {  // A specular path found
            var hitTime = this.sources[i].loc.timeOfFlight(this.receivers[0].loc);
            this.receivers[0].registerPath(hitTime, i, r.order);
        }
    }
    this.rayVisualizationOrder = this.maxOrder;
};

GA.prototype.nextBeamModulo = function(directionIncrement) {
    this.beamToBeVisualized += directionIncrement;
    if (this.beamToBeVisualized == 0)
        this.beamToBeVisualized = this.sources.length-1;
    else if (this.beamToBeVisualized > (this.sources.length-1))
        this.beamToBeVisualized = 1;
};

GA.prototype.searchForBeam = function(directionIncrement) {
    var oldBeam = this.beamToBeVisualized;
    var found = 0;
    this.nextBeamModulo(directionIncrement);
    while ((found == 0) && (this.beamToBeVisualized != oldBeam))
        if (this.showOrders[this.sources[this.beamToBeVisualized].order] == 1)
            found = 1;
        else
            this.nextBeamModulo(directionIncrement);
    console.log("Beam: " + this.beamToBeVisualized);
    this.drawAll();
};
function GA_RARE_initAll() {
}
//
// Real life parameter mapping and receiver handling
//
// (c) Lauri Savioja, 2016
//


"use strict";

//
// Global parameters to map from internal to real world values
//

function RealLifeParams() {
    this.spatialScaler = 0.1;    // 1 internal distance unit corresponds to 0.1m = 10cm in real world
    this.speedOfSound = 0.343;  // m / ms
}

RealLifeParams.prototype.tuneSpatialScaler = function(g) {
//    console.log("g = ",g );
    this.spatialScaler = g / 400;
};

RealLifeParams.prototype.internalDistToRealDist = function(t) {
    return t*this.spatialScaler;  // Converts the distance to meters
};

RealLifeParams.prototype.distToTime = function(d) {
    return d / this.speedOfSound;  // Converts the distance in meters to propagation delay in ms
};

RealLifeParams.prototype.internalDistToRealTime = function(d) {
    return this.distToTime(this.internalDistToRealDist(d));
};

RealLifeParams.prototype.realTimeToRealDist = function(t) {
    return t * this.speedOfSound;
};

RealLifeParams.prototype.realDistToInternalDist = function(d) {
    return d / this.spatialScaler;
};

RealLifeParams.prototype.realTimeToInternalTime = function(t) {
    return  this.realDistToInternalDist(this.realTimeToRealDist(t));
};

//
//  Receiver that contains a list of registered path events, and can convert that to an IR.
//
Receiver.prototype.registerPath = function(t, id, reflOrder, type) {
    this.registeredPaths.push({time: t, rayID: id, order: reflOrder, type: type});
};

Receiver.prototype.reset = function() {
    this.registeredPaths = [];
    this.IR = null;
};

//
// Makes accumulation and returns the internal time of the latest event
//

Receiver.prototype.accumulateIRfromPaths = function(fs, rl, showOrders, attenuation, rayPaths) {
    this.IR = new SampledResponse(fs, 10);  // Initial length of 10ms
    var i;
    var p, val, r;
    for (i=0;i<this.registeredPaths.length;i++) {
        p = this.registeredPaths[i];
        if (p.type == DIFFUSE_SHADOW_RAY)
            r = rayPaths[p.rayID].shadowRays[p.order];
        else
            r = rayPaths[p.rayID];
        if (showOrders[p.order] == 1) {
            var dist = rl.internalDistToRealDist(p.time);
            if (attenuation[MATERIAL_ABSORPTION] == 1) {
                if (p.type == DIFFUSE_SHADOW_RAY)
                    val = r.energies[0];
                else
                    val = r.energies[p.order];
            } else
                val = 1;
            if (attenuation[DISTANCE] == 1)
                val = (100*val/(dist+100));
            if (attenuation[AIR_ABSORPTION] == 1) {
                var lowpassCutoff = search3dBpointNTP(dist, this.humidity, this.temperature);
                var aafilt = makeAAFilter(dist, 32);
                this.IR.addArray(this.IR.timeToSample(rl.distToTime(dist)), aafilt, val);
            } else
                this.IR.add(rl.distToTime(dist), val);
        }
    }
};

GA.prototype.constructIRResponse = function() {
    var i, j, r;
    for (i=0;i<this.rayPaths.length;i++) {
        r = this.rayPaths[i];
        for (j = 1; j < r.reflectors.length; j++)
            r.energies[j] = r.energies[j - 1] * Math.sqrt(1 - this.absorptionCoeffs[r.reflectors[j]]);
    }
    this.receivers[0].accumulateIRfromPaths(this.fs, this.rlParams, this.showOrders, this.attenuation, this.rayPaths);
};

GA.prototype.constructETCResponseFromRays = function() {
    var i, j, r;
    for (i=0;i<this.rayPaths.length;i++) {
        r = this.rayPaths[i];
        for (j = 1; j < r.reflectors.length; j++)
            r.energies[j] = r.energies[j - 1] * (1 - this.absorptionCoeffs[r.reflectors[j]]);
    }
    var showOrders = [];
    for(i=0; i<this.maxOrder; i++)
        showOrders[i] = 1;
    this.receivers[0].accumulateIRfromPaths(this.fs, this.rlParams, showOrders, this.attenuation, this.rayPaths)
    this.receivers[0].ETC = this.receivers[0].IR;
};

GA.prototype.constructETCResponseFromART = function() {
    var ETC = new SampledResponse(this.fs, 100);  // Initial length of 100ms

    var emittingSurfID;
    var recLoc = this.receivers[0].loc;
    var unitDelay = this.rlParams.internalDistToRealTime(1);

    var angleIdx, idx;
    var emission, propagationDelay, currentDelay, directDelay;

    for (emittingSurfID=0; emittingSurfID<this.centers.length; emittingSurfID++) {
        angleIdx = this.BRDFs[emittingSurfID].getAngleIndex(this.centers[emittingSurfID], this.lineDirs[emittingSurfID], recLoc);
        if (angleIdx<this.ARTenergy[emittingSurfID].responseToDirection.length) {  // Needs to be facing the receiver
            emission = this.ARTenergy[emittingSurfID].responseToDirection[angleIdx];
            propagationDelay = this.centers[emittingSurfID].timeOfFlight(recLoc);
            propagationDelay = this.rlParams.internalDistToRealTime(propagationDelay);
            currentDelay = propagationDelay;
            for (idx = 0; idx < emission.values.length; idx++) {
                ETC.add(currentDelay, 10*emission.values[idx] / (propagationDelay+1));  // Arbitrary scaling - sorry!
                currentDelay += unitDelay;
            }
        }
    }
    var dir = getDir(recLoc, this.sources[0].loc);
    var ip = getClosestReflector(this, recLoc, dir, 1);
    if (typeof ip.reflector == 'undefined') {  // Source and receiver have a line-of-sight
        directDelay = this.rlParams.internalDistToRealTime(recLoc.timeOfFlight(this.sources[0].loc));
        ETC.add(directDelay, this.sources[0].ARTemission.responseToDirection[0].values[0] / (directDelay + 1))
    }

    this.receivers[0].ETC = ETC;
};

function Receiver(rec) {
    this.loc = new Vec2(rec);
    this.humidity = 40;
    this.temperature = 273.15 + 20;
    this.updateCounter = 0;
    this.reset();
}

//
// A helper class to enable accumulation of raylets on the listener in illustration
//
PolarDensity.prototype.getIndex = function(angle) {
    var nofSlots = this.size;
    var slotSize = (this.right - this.left)/ nofSlots;
    var diff = angle - this.left;

    return Math.floor(diff/slotSize);
};

PolarDensity.prototype.addNew = function(angle) {
    var idx = this.getIndex(angle);
    if (this.slots[idx] != null)
        return (1 + this.slots[idx].addNew(angle));
    else {
        var nofSlots = this.size;
        var slotSize = (this.right - this.left)/ nofSlots;
        var left = idx * slotSize;
        this.slots[idx] = new PolarDensity(2, left, left+slotSize);
        return 0;
    }
};

function PolarDensity(nofSectors, startAngle, endAngle) {
    this.slots = [];
    var i;
    for (i=0;i<nofSectors;i++)
        this.slots[i] = null;
    this.size = nofSectors;
    this.left = startAngle;
    this.right = endAngle;
}
//
// Responses, directional responses
//
// (c) Lauri Savioja, 2016
//

//
// Basic response that can be used for impulse response, time-energy-response, basic unit of a directional response, and so on ...
//

"use strict";

Response.prototype.clear = function(N0, N1, val) {
    var i;
    if (!N0)
        N0 = 0;
    if (!N1)
        N1 = this.values.length;
    if (!val)
        val = 0;
    for (i=N0;i<N1;i++)
        this.values[i] = val;
};

Response.prototype.extendToNsamples = function(N) {
    this.clear(this.len, N);
    this.len = N;
};

function Response(len) {
//    this.len = len;
    this.values = [];
    this.clear(0, len);
}

Response.prototype.add = function(idx, value) {
    this.values[idx] += value;
};

//
// Cumulative sum of a signal
//
Response.prototype.sum = function() {
    var i;
    var s=0;
    for (i=0;i<this.values.length;i++)
        s += this.values[i];
    return s;
};

Response.prototype.validate = function() {
    var j;
    for (j=0;j<this.values.length;j++)
        if (isNaN(this.values[j])) {
            console.log("Kiville meni.")
        }
};

//
// Delay src response, multiply it, and add to 'this'
//
Response.prototype.delayMultiplyAdd = function(src, delay, mult) {
    var i;
    var del = Math.round(delay);
    var newLen = src.values.length+del;
    if (newLen > this.values.length) {
//        console.log("Old len: " + this.values.length, ". New len: " + newLen + ". Delay: " + delay + "(" + del + ")");
        this.extendToNsamples(newLen);
//    var len = Math.min(Math.floor(this.len-delay), src.len);
    }
    for (i=0; i<src.values.length; i++) {
        this.values[i+del] += (src.values[i] * mult);
    }
//    this.validate();
};

Response.prototype.printNonZero = function(str) {
    var i;
    for (i=0;i<this.values.length; i++) {
        if (this.values[i] != 0)
            console.log(str+", "+i+". = " + this.values[i]);
    }
};

// ------------------------------------------------

//
// Response with sampling rate, extends the response length if required
// initialMaxDuration is in ms
//

SampledResponse.prototype.sampleToTime = function(N) {
    return (N*1000/this.fs);
};
SampledResponse.prototype.timeToSample = function(t) {
    return Math.floor((t*this.fs)/1000);
};

function SampledResponse(fs, initialMaxDuration) {
    this.fs = fs;
    this.maxDuration = initialMaxDuration;
    this.response = new Response(this.timeToSample(initialMaxDuration));
}

SampledResponse.prototype.add = function(time, value) {
    var idx = this.timeToSample(time);
    if (time>this.maxDuration) {
        this.response.extendToNsamples(idx+1);
        this.maxDuration = time;
    }
    this.response.add(idx, value);
};

SampledResponse.prototype.addArray = function(startIdx, valArray, scaler) {
    var lastSampleIdx = startIdx + valArray.length;
    if (lastSampleIdx>this.response.values.length) {
        this.response.extendToNsamples(lastSampleIdx);
    }
    var i;
    for (i=0; i<valArray.length; i++)
        this.response.add(startIdx+i, valArray[i] * scaler);
    this.maxDuration = this.sampleToTime(this.response.values.length);
};



SampledResponse.prototype.timeOfLastEvent = function() {
    var i;
    var r = this.response;
    for (i=r.len;i>=0;i--)
        if (r.values[i] != 0)
            return (this.sampleToTime(i));
    return 0.0;
};

SampledResponse.prototype.rangeOfValues = function() {
    var i;
    var minVal = 10E+20;
    var maxVal = -10E+20;
    var r=this.response;
    var v;
    for (i=0;i<r.values.length;i++) {
        v = r.values[i];
        if (v>maxVal)
            maxVal = v;
        if (v<minVal)
            minVal = v;
    }
    return {min: minVal, max: maxVal};
};

//
// Schroeder backward integration
//

SampledResponse.prototype.SchroederBackwardIntegration = function() {
    var cumulation = [];
    var i;

    cumulation[0] = this.response.values[0];
    for (i=1; i<this.response.values.length; i++) {
        cumulation[i] = cumulation[i-1] + this.response.values[i];
    }
    var total = cumulation[cumulation.length-1];
    var sch = new SampledResponse(this.fs, this.maxDuration);
    for (i=0; i<cumulation.length; i++) {
        sch.response.values[i] = 10*log10((total - cumulation[i]) / total);
    }
    return sch;
};

//
// Draw response
//

var plotDivID;
var plotRealTime;
var plotRayType;
var plotIR;
var plotResponseType;

function realDrawResponse() {
    var maxTime = plotIR.maxDuration;
    var timeStep = maxTime/plotIR.response.values.length;
    var time = linspace(0,maxTime,timeStep);
    var layout;
    var yRange;
    if (plotResponseType == IMPULSE_RESPONSE) {
        layout = {
            title: 'Impulse response',
            xaxis: {
                title: 'Time (ms)',
                range: [0, maxTime * 1.1]
            },
            yaxis: {
                title: 'Amplitude',
                range: [-1, 1]
            },
            showlegend: false
        }
    } else if (plotResponseType == ETC_CURVE) {
        yRange = plotIR.rangeOfValues();
        layout = {
            title: 'Energy-time curve',
            xaxis: {
                title: 'Time (ms)',
                range: [0, maxTime * 1.1]
            },
            yaxis: {
                title: 'Energy (linear)',
                range: yRange
            },
            showlegend: false
        }
    } else if (plotResponseType == SCHROEDER_PLOT) {
//        yRange = plotIR.rangeOfValues();
        layout = {
            title: 'Schroeder plot',
            xaxis: {
                title: 'Time (ms)',
                range: [0, maxTime * 1.1]
            },
            yaxis: {
                title: 'Energy decay (dB)',
                range: [-60,0]
            },
            showlegend: false
        }
    } else
        console.log("Sorry, you have been fooled, no such plot exists!");

    layout.height = 300;
    layout.margin = {
        l: 60,
        r: 20,
        b: 40,
        t: 30,
        pad: 1
    };

    Plotly.newPlot(plotDivID, [{x: time, y:plotIR.response.values}], layout);

    var ones=new Response(2);
    ones.clear(0, 1, 1);
    var x = [plotRealTime, plotRealTime];
    Plotly.addTraces(plotDivID, {x: x, y: ones, line: { color: 'red'}});
}

// Makes all the drawing and returns the internal time of the last time for tuning of the time slider
SampledResponse.prototype.drawResponse = function(divID, currentTime, responseType) {
    plotDivID = divID;
    plotRealTime = currentTime;
    plotResponseType = responseType;
    plotIR = this;

    realDrawResponse();
};


// ------------------------------------------------

//
// And now the directional response
//
function DirectionalResponse(nofDirections, len) {
    this.nofDirections = nofDirections;
    var i;
    this.responseToDirection = [];
    for (i=0;i<nofDirections;i++) {
        this.responseToDirection[i] = new Response(len);
    }
}

DirectionalResponse.prototype.clear = function() {
    var i;
    for (i=0; i<this.nofDirections; i++)
        this.responseToDirection[i].clear();
};

DirectionalResponse.prototype.sum = function() {
    var i;
    var s=0;
    for (i=0; i<this.nofDirections; i++)
        s += this.responseToDirection[i].sum();
    return s;
};

DirectionalResponse.prototype.delayMultiplyAdd = function(src, delay, multPerDirection, constScaler) {
    var i;
    for (i=0; i<this.nofDirections; i++) {
        this.responseToDirection[i].delayMultiplyAdd(src, delay, multPerDirection[i]*constScaler);
    }
};

DirectionalResponse.prototype.accumulateFrom = function(src) {
    var i;
    for (i=0; i<this.nofDirections; i++) {
        this.responseToDirection[i].values[0] = src.responseToDirection[i].sum();
    }
};

DirectionalResponse.prototype.printNonZero = function(str) {
    var i;
    for (i=0; i<this.nofDirections; i++) {
        this.responseToDirection[i].printNonZero(str+", dir: "+i)
    }
};





//
// Sectors, source handling
//
// (c) Lauri Savioja, 2016
//


"use strict";

function Sector(c) {
    this.center = new Vec2(c);
    this.leftStartingPoint = this.center;
    this.rightStartingPoint = this.center;

    this.leftDirection = new Vec2(-1, 0);
    this.leftLimit = new Vec2(this.center);
    this.leftLimit.add(this.leftDirection);

    this.rightDirection = new Vec2(-1, 0);
    this.rightLimit = new Vec2(this.center);
    this.rightLimit.add(this.rightDirection);

    this.leftAngle = -M_PI;
    this.rightAngle = M_PI;
    this.angle = M_2_PI;
}

Sector.prototype.computeAngles = function() {
    this.leftAngle = getLineOrientation(this.center, this.leftLimit);
    this.rightAngle = getLineOrientation(this.center, this.rightLimit);
    if (this.rightAngle < this.leftAngle) // Crossing from pi to -pi
        this.rightAngle += M_2_PI;
    this.angle = this.rightAngle - this.leftAngle;
};

Sector.prototype.computeDirectionsFromAngles = function() {
    this.leftDirection.setUnitVector(this.leftAngle);
    this.rightDirection.setUnitVector(this.rightAngle);
};

Sector.prototype.setLimits = function(l, r) {
    this.leftLimit.set(l);
    this.leftDirection.set(l);
    this.leftDirection.sub(this.center);

    this.rightLimit.set(r);
    this.rightDirection.set(r);
    this.rightDirection.sub(this.center);

    this.computeAngles();
};


Sector.prototype.computeLimitsFromAngles = function(p0, s1) {
    this.computeDirectionsFromAngles();

    var t;
    t = intersect(p0, s1, this.center, this.leftDirection);
    this.leftDirection.scale(t);
    this.leftLimit.set(this.leftDirection);
    this.leftLimit.add(this.center);

    t = intersect(p0, s1, this.center, this.rightDirection);
    this.rightDirection.scale(t);
    this.rightLimit.set(this.rightDirection);
    this.rightLimit.add(this.center);
};

var BEAM_EPS = 0.000001;

Sector.prototype.insideBeam = function(ang) {
    var i;
    ang -= M_2_PI;
    for (i=-1;i<2;i++) {
        if ((this.leftAngle <= (ang+BEAM_EPS)) && ((ang-BEAM_EPS) <= this.rightAngle)) {
//            console.log(toDeg(this.leftAngle) + " < " + toDeg(ang) + " < " + toDeg(this.rightAngle));
            return true;
        }
        ang += M_2_PI;
    }
    return false;
};

Sector.prototype.intersect = function(b, clip) {
    if (b.angle == M_2_PI) // Full circle - no need to do anything here!
        return;

    var crosses = false;
    if (this.insideBeam(b.leftAngle)) {
        if (clip)
            this.leftAngle = b.leftAngle;
        crosses = true;
    }
    if (this.insideBeam(b.rightAngle)) {
        if (clip)
            this.rightAngle = b.rightAngle;
        crosses = true;
    }

    if (!(crosses))
        if (!(b.insideBeam(this.leftAngle))) {  // No overlap, so no intersection
            this.rightAngle = 0;
            this.leftAngle = 0;
        }

    if (this.rightAngle < this.leftAngle)
        this.rightAngle += M_2_PI;
    this.angle = this.rightAngle - this.leftAngle;
};

Sector.prototype.match2PI = function(s) {
    if ((s.rightAngle - this.leftAngle > M_2_PI)) {
        this.leftAngle += M_2_PI;
        this.rightAngle += M_2_PI;
    }
    if ((this.rightAngle - s.leftAngle > M_2_PI)) {
        this.leftAngle -= M_2_PI;
        this.rightAngle -= M_2_PI;
    }
};


Sector.prototype.computeStartingPoints = function(p0, p1) {
    var dir = getDir(p0, p1);
    this.leftStartingPoint = intersectionPoint(this.center, this.leftDirection, p0, dir);
    this.rightStartingPoint = intersectionPoint(this.center, this.rightDirection, p0, dir);

};

Sector.prototype.substractLineSegment = function(p0, p1) {
    var occluder = new Sector(this.center);
    occluder.setLimits(p1, p0);
    // Make sure that left is on left and right is on right
    var n = getNormal(p0, p1);
    var d = getDir(this.center, p0);
    if (n.dot(d) > 0) {
//        occluder.debug("Swapping")
        occluder.setLimits(p0, p1);
    }

    occluder.match2PI(this);
    var lineDir = new Vec2(p1);
    lineDir.sub(p0);

    var segLine = getDir(this.leftStartingPoint, this.leftLimit);
    if (segmentsIntersect(this.leftStartingPoint, segLine, p0, lineDir, 1)) {
        this.leftAngle = occluder.rightAngle;
    }
    segLine = getDir(this.rightStartingPoint, this.rightLimit);
    if (segmentsIntersect(this.rightStartingPoint, segLine, p0, lineDir, 1)) {
        this.rightAngle = occluder.leftAngle;
    }
    if (this.rightAngle < this.leftAngle)
        this.angle = 0;
};

Sector.prototype.swapLimits = function() {
    var tmp = this.leftLimit;
    this.leftLimit = this.rightLimit;
    this.rightLimit = tmp;
};


Sector.prototype.debug = function(s) {
    console.log(s + " " + toDeg(this.leftAngle) + " - " + toDeg(this.rightAngle) + ". Angle: " + toDeg(this.angle));
    this.center.print("Center: ");
    this.leftStartingPoint.print("Left start: ");
    this.rightStartingPoint.print("Right start: ");
    this.leftLimit.print("Left limit: ");
    this.rightLimit.print("Right limit: ");
    this.leftDirection.print("Left direction: ");
    this.rightDirection.print("Right direction: ");
};


// Reflects a beam against line
Sector.prototype.reflectSector = function(dir, center) {
    var t;
    t = intersect(center,dir, this.center, this.rightDirection);
    this.leftLimit.set(this.rightDirection);
    this.leftLimit.scale(t);
    this.leftLimit.add(this.center);

    t = intersect(center,dir, this.center, this.leftDirection);
    this.rightLimit.set(this.leftDirection);
    this.rightLimit.scale(t);
    this.rightLimit.add(this.center);

    this.center = this.center.reflect(dir, center);

    this.computeAngles();
    this.computeDirectionsFromAngles();
};


GA.prototype.setBeam = function(src) {
    src.beam.setLimits(this.startVertices[src.reflector], this.endVertices[src.reflector]);
};


GA.prototype.newBeam = function(c, reflector) {
    var reflBeam = new Sector(c);
    reflBeam.setLimits(this.endVertices[reflector], this.startVertices[reflector]);
    return reflBeam;
};


//
// Source
//
function Source(src, order, parent, reflector, time) {
    this.loc = src;
    this.order = order;
    this.parent = parent;
    this.reflector = reflector;
    this.beam = new Sector(src);
    if (typeof time != 'undefined')
        this.startTime = time;
    else
        this.startTime = 0;
    this.children = [];
}

Source.prototype.debug = function(s) {
    console.log(s + ", source order: " + this.order);
    this.loc.print("Source at: ");
    var i;
    var tmp = this;
    for (i=this.order;i>0;i--) {
        console.log(" -> " + tmp.reflector);
        tmp = tmp.parent;
    }
};
//
// User interface
//
// (c) Lauri Savioja, 2016
//

"use strict";


GA.prototype.resetClipping = function() {
    var ctx = document.getElementById(this.id).getContext('2d');
    ctx.restore();
    this.saved = 0;
};


GA.prototype.zoomOutButtonPressedEvent = function() {
    this.scaler *=  0.9;
    if (this.showOutside == 0)
        this.resetClipping();
    this.drawAll();
};

GA.prototype.zoomInButtonPressedEvent = function() {
    this.scaler *=  1.1;
    if (this.showOutside == 0)
        this.resetClipping();
    this.drawAll();
};

function mouseWheel(ev, room) {
    if (ev.shiftKey) { // let us zoom
        if (ev.wheelDelta < 0)
            room.scaler *= 0.9;
        else
            room.scaler *= 1.1;
        room.drawAll();
    }
}

var mouseDownFlag = false;
var mouseCoords = new Vec2(0,0);
var pointToTrack;
var sourceMoves = false;
var geometryChanges = false;

function updateMouseCoords(ev, room)  {
    var rect = document.getElementById(room.id).getBoundingClientRect();
    var x = ev.clientX - rect.left;
    var y = ev.clientY - rect.top;
    mouseCoords.set(room.scaleXinv(x), room.scaleYinv(y));
//        coor = "Coordinates: (" + x + "," + y + ")";
//        console.log(coor);

}

function mouseMoved(ev, room) {
    if (mouseDownFlag) {
        if (typeof room == 'undefined')
            return;
        if (ev.currentTarget.id != room.id)
            return;
        updateMouseCoords(ev, room);
        pointToTrack.set(mouseCoords.x, mouseCoords.y);
        if (geometryChanges) {
            room.updateGeometry();
            room.computeAll();
        }
        if (room.simulationModes[MAKE_IS_PATHS] == 1) {
            if (sourceMoves)
                room.computeAll();
            room.constructAllISRayPaths();
        }
        if (room.simulationModes[CREATE_RAYS] == 1) {
            if (sourceMoves)
                room.computeAll();
            room.checkAudibilities();
            room.updateShadowRays();
        }
        if (room.animation)
            room.animation.reset();
        room.drawAll();
    }
}

function mouseDown(ev, room) {
    if (ev.button == 2) { // The right button
        room.currentOrderColormap = (room.currentOrderColormap+1) % (room.orderColors.length);
        room.drawAll();
        return;
    }
    mouseDownFlag = true;
    if (room.coverFig == 1) {
        room.showOutside = 1 - room.showOutside;
        room.drawAll();
        return;
    }
    updateMouseCoords(ev, room);
    var srcDist = mouseCoords.distance(room.sources[0].loc);
    var rcvDist = mouseCoords.distance(room.receivers[0].loc);
    if ((srcDist<rcvDist) && (room.sourceCanMove)) {
        sourceMoves = true;
        pointToTrack = room.sources[0].loc;
    } else {
        sourceMoves = false;
        pointToTrack = room.receivers[0].loc;
    }
    var minDist = Math.min(srcDist, rcvDist);
    var dist;
    var i;
    if (room.geometryCanChange)
        for (i=0;i<room.startVertices.length;i++) {
            dist = mouseCoords.distance(room.startVertices[i]);
            if (dist < minDist) {
                minDist = dist;
                pointToTrack = room.startVertices[i];
                geometryChanges = true;
                sourceMoves = true;
                activeSurface = i;
            }
            dist = mouseCoords.distance(room.endVertices[i]);
            if (dist < minDist) {
                minDist = dist;
                pointToTrack = room.endVertices[i];
                geometryChanges = true;
                sourceMoves = true;
                activeSurface = Math.max(0, i + 1);
            }
    }
}

function coverMouseMoved(ev, room) {
        var rect = document.getElementById(room.id).getBoundingClientRect();
        var x = ev.clientX - rect.left;
        room.timeSlider = x / rect.width;
        room.drawAll();
}

// function mouseUp(ev, room)
function mouseUp() { mouseDownFlag = false; geometryChanges = false; sourceMoves = false; }

//
// The code below copied from http://blog.movalog.com/a/javascript-toggle-visibility/
//
function toggle_visibility(divId, button, v1, v2) {
    var e = document.getElementById(divId);
    if(e.style.display == 'block') {
        e.style.display = 'none';
        if (typeof v1 != 'undefined')
            button.value = v1;
    } else {
        e.style.display = 'block';
        if (typeof v2 != 'undefined')
            button.value = v2;
    }
}

GA.prototype.prevPatch = function() {
    activeSurface = (activeSurface + this.absorptionCoeffs.length - 1) % this.absorptionCoeffs.length;
    this.drawAll();
};

GA.prototype.nextPatch = function() {
    activeSurface = (activeSurface + 1) % this.absorptionCoeffs.length;
    this.drawAll();
};//
// All GA drawing
//
// (c) Lauri Savioja, 2016
//

"use strict";

var timer;
var SOURCE = 100;
var RECEIVER = 101;
var SHADOW_RAY_STYLE = 102;

// var BEM_BLACK_BACKGROUND = 200;
// var BEM_TRANSPARENT_BACKGROUND = 201;
var PRIMARY = 202;
var REFLECTION = 203;
var PHASE_REVERSED = 204;
//
// Color initialization
//

// Colormap values from https://github.com/politiken-journalism/scale-color-perceptual/blob/master/hex/
// with MIT License
var viridisMap = ["#440154","#440256","#450457","#450559","#46075a","#46085c","#460a5d","#460b5e","#470d60","#470e61","#471063","#471164","#471365","#481467","#481668","#481769","#48186a","#481a6c","#481b6d","#481c6e","#481d6f","#481f70","#482071","#482173","#482374","#482475","#482576","#482677","#482878","#482979","#472a7a","#472c7a","#472d7b","#472e7c","#472f7d","#46307e","#46327e","#46337f","#463480","#453581","#453781","#453882","#443983","#443a83","#443b84","#433d84","#433e85","#423f85","#424086","#424186","#414287","#414487","#404588","#404688","#3f4788","#3f4889","#3e4989","#3e4a89","#3e4c8a","#3d4d8a","#3d4e8a","#3c4f8a","#3c508b","#3b518b","#3b528b","#3a538b","#3a548c","#39558c","#39568c","#38588c","#38598c","#375a8c","#375b8d","#365c8d","#365d8d","#355e8d","#355f8d","#34608d","#34618d","#33628d","#33638d","#32648e","#32658e","#31668e","#31678e","#31688e","#30698e","#306a8e","#2f6b8e","#2f6c8e","#2e6d8e","#2e6e8e","#2e6f8e","#2d708e","#2d718e","#2c718e","#2c728e","#2c738e","#2b748e","#2b758e","#2a768e","#2a778e","#2a788e","#29798e","#297a8e","#297b8e","#287c8e","#287d8e","#277e8e","#277f8e","#27808e","#26818e","#26828e","#26828e","#25838e","#25848e","#25858e","#24868e","#24878e","#23888e","#23898e","#238a8d","#228b8d","#228c8d","#228d8d","#218e8d","#218f8d","#21908d","#21918c","#20928c","#20928c","#20938c","#1f948c","#1f958b","#1f968b","#1f978b","#1f988b","#1f998a","#1f9a8a","#1e9b8a","#1e9c89","#1e9d89","#1f9e89","#1f9f88","#1fa088","#1fa188","#1fa187","#1fa287","#20a386","#20a486","#21a585","#21a685","#22a785","#22a884","#23a983","#24aa83","#25ab82","#25ac82","#26ad81","#27ad81","#28ae80","#29af7f","#2ab07f","#2cb17e","#2db27d","#2eb37c","#2fb47c","#31b57b","#32b67a","#34b679","#35b779","#37b878","#38b977","#3aba76","#3bbb75","#3dbc74","#3fbc73","#40bd72","#42be71","#44bf70","#46c06f","#48c16e","#4ac16d","#4cc26c","#4ec36b","#50c46a","#52c569","#54c568","#56c667","#58c765","#5ac864","#5cc863","#5ec962","#60ca60","#63cb5f","#65cb5e","#67cc5c","#69cd5b","#6ccd5a","#6ece58","#70cf57","#73d056","#75d054","#77d153","#7ad151","#7cd250","#7fd34e","#81d34d","#84d44b","#86d549","#89d548","#8bd646","#8ed645","#90d743","#93d741","#95d840","#98d83e","#9bd93c","#9dd93b","#a0da39","#a2da37","#a5db36","#a8db34","#aadc32","#addc30","#b0dd2f","#b2dd2d","#b5de2b","#b8de29","#bade28","#bddf26","#c0df25","#c2df23","#c5e021","#c8e020","#cae11f","#cde11d","#d0e11c","#d2e21b","#d5e21a","#d8e219","#dae319","#dde318","#dfe318","#e2e418","#e5e419","#e7e419","#eae51a","#ece51b","#efe51c","#f1e51d","#f4e61e","#f6e620","#f8e621","#fbe723","#fde725"];
var magmaMap = ["#000004","#010005","#010106","#010108","#020109","#02020b","#02020d","#03030f","#030312","#040414","#050416","#060518","#06051a","#07061c","#08071e","#090720","#0a0822","#0b0924","#0c0926","#0d0a29","#0e0b2b","#100b2d","#110c2f","#120d31","#130d34","#140e36","#150e38","#160f3b","#180f3d","#19103f","#1a1042","#1c1044","#1d1147","#1e1149","#20114b","#21114e","#221150","#241253","#251255","#271258","#29115a","#2a115c","#2c115f","#2d1161","#2f1163","#311165","#331067","#341069","#36106b","#38106c","#390f6e","#3b0f70","#3d0f71","#3f0f72","#400f74","#420f75","#440f76","#451077","#471078","#491078","#4a1079","#4c117a","#4e117b","#4f127b","#51127c","#52137c","#54137d","#56147d","#57157e","#59157e","#5a167e","#5c167f","#5d177f","#5f187f","#601880","#621980","#641a80","#651a80","#671b80","#681c81","#6a1c81","#6b1d81","#6d1d81","#6e1e81","#701f81","#721f81","#732081","#752181","#762181","#782281","#792282","#7b2382","#7c2382","#7e2482","#802582","#812581","#832681","#842681","#862781","#882781","#892881","#8b2981","#8c2981","#8e2a81","#902a81","#912b81","#932b80","#942c80","#962c80","#982d80","#992d80","#9b2e7f","#9c2e7f","#9e2f7f","#a02f7f","#a1307e","#a3307e","#a5317e","#a6317d","#a8327d","#aa337d","#ab337c","#ad347c","#ae347b","#b0357b","#b2357b","#b3367a","#b5367a","#b73779","#b83779","#ba3878","#bc3978","#bd3977","#bf3a77","#c03a76","#c23b75","#c43c75","#c53c74","#c73d73","#c83e73","#ca3e72","#cc3f71","#cd4071","#cf4070","#d0416f","#d2426f","#d3436e","#d5446d","#d6456c","#d8456c","#d9466b","#db476a","#dc4869","#de4968","#df4a68","#e04c67","#e24d66","#e34e65","#e44f64","#e55064","#e75263","#e85362","#e95462","#ea5661","#eb5760","#ec5860","#ed5a5f","#ee5b5e","#ef5d5e","#f05f5e","#f1605d","#f2625d","#f2645c","#f3655c","#f4675c","#f4695c","#f56b5c","#f66c5c","#f66e5c","#f7705c","#f7725c","#f8745c","#f8765c","#f9785d","#f9795d","#f97b5d","#fa7d5e","#fa7f5e","#fa815f","#fb835f","#fb8560","#fb8761","#fc8961","#fc8a62","#fc8c63","#fc8e64","#fc9065","#fd9266","#fd9467","#fd9668","#fd9869","#fd9a6a","#fd9b6b","#fe9d6c","#fe9f6d","#fea16e","#fea36f","#fea571","#fea772","#fea973","#feaa74","#feac76","#feae77","#feb078","#feb27a","#feb47b","#feb67c","#feb77e","#feb97f","#febb81","#febd82","#febf84","#fec185","#fec287","#fec488","#fec68a","#fec88c","#feca8d","#fecc8f","#fecd90","#fecf92","#fed194","#fed395","#fed597","#fed799","#fed89a","#fdda9c","#fddc9e","#fddea0","#fde0a1","#fde2a3","#fde3a5","#fde5a7","#fde7a9","#fde9aa","#fdebac","#fcecae","#fceeb0","#fcf0b2","#fcf2b4","#fcf4b6","#fcf6b8","#fcf7b9","#fcf9bb","#fcfbbd","#fcfdbf"];
var infernoMap = ["#000004","#010005","#010106","#010108","#02010a","#02020c","#02020e","#030210","#040312","#040314","#050417","#060419","#07051b","#08051d","#09061f","#0a0722","#0b0724","#0c0826","#0d0829","#0e092b","#10092d","#110a30","#120a32","#140b34","#150b37","#160b39","#180c3c","#190c3e","#1b0c41","#1c0c43","#1e0c45","#1f0c48","#210c4a","#230c4c","#240c4f","#260c51","#280b53","#290b55","#2b0b57","#2d0b59","#2f0a5b","#310a5c","#320a5e","#340a5f","#360961","#380962","#390963","#3b0964","#3d0965","#3e0966","#400a67","#420a68","#440a68","#450a69","#470b6a","#490b6a","#4a0c6b","#4c0c6b","#4d0d6c","#4f0d6c","#510e6c","#520e6d","#540f6d","#550f6d","#57106e","#59106e","#5a116e","#5c126e","#5d126e","#5f136e","#61136e","#62146e","#64156e","#65156e","#67166e","#69166e","#6a176e","#6c186e","#6d186e","#6f196e","#71196e","#721a6e","#741a6e","#751b6e","#771c6d","#781c6d","#7a1d6d","#7c1d6d","#7d1e6d","#7f1e6c","#801f6c","#82206c","#84206b","#85216b","#87216b","#88226a","#8a226a","#8c2369","#8d2369","#8f2469","#902568","#922568","#932667","#952667","#972766","#982766","#9a2865","#9b2964","#9d2964","#9f2a63","#a02a63","#a22b62","#a32c61","#a52c60","#a62d60","#a82e5f","#a92e5e","#ab2f5e","#ad305d","#ae305c","#b0315b","#b1325a","#b3325a","#b43359","#b63458","#b73557","#b93556","#ba3655","#bc3754","#bd3853","#bf3952","#c03a51","#c13a50","#c33b4f","#c43c4e","#c63d4d","#c73e4c","#c83f4b","#ca404a","#cb4149","#cc4248","#ce4347","#cf4446","#d04545","#d24644","#d34743","#d44842","#d54a41","#d74b3f","#d84c3e","#d94d3d","#da4e3c","#db503b","#dd513a","#de5238","#df5337","#e05536","#e15635","#e25734","#e35933","#e45a31","#e55c30","#e65d2f","#e75e2e","#e8602d","#e9612b","#ea632a","#eb6429","#eb6628","#ec6726","#ed6925","#ee6a24","#ef6c23","#ef6e21","#f06f20","#f1711f","#f1731d","#f2741c","#f3761b","#f37819","#f47918","#f57b17","#f57d15","#f67e14","#f68013","#f78212","#f78410","#f8850f","#f8870e","#f8890c","#f98b0b","#f98c0a","#f98e09","#fa9008","#fa9207","#fa9407","#fb9606","#fb9706","#fb9906","#fb9b06","#fb9d07","#fc9f07","#fca108","#fca309","#fca50a","#fca60c","#fca80d","#fcaa0f","#fcac11","#fcae12","#fcb014","#fcb216","#fcb418","#fbb61a","#fbb81d","#fbba1f","#fbbc21","#fbbe23","#fac026","#fac228","#fac42a","#fac62d","#f9c72f","#f9c932","#f9cb35","#f8cd37","#f8cf3a","#f7d13d","#f7d340","#f6d543","#f6d746","#f5d949","#f5db4c","#f4dd4f","#f4df53","#f4e156","#f3e35a","#f3e55d","#f2e661","#f2e865","#f2ea69","#f1ec6d","#f1ed71","#f1ef75","#f1f179","#f2f27d","#f2f482","#f3f586","#f3f68a","#f4f88e","#f5f992","#f6fa96","#f8fb9a","#f9fc9d","#fafda1","#fcffa4"];
var plasmaMap = ["#0d0887","#100788","#130789","#16078a","#19068c","#1b068d","#1d068e","#20068f","#220690","#240691","#260591","#280592","#2a0593","#2c0594","#2e0595","#2f0596","#310597","#330597","#350498","#370499","#38049a","#3a049a","#3c049b","#3e049c","#3f049c","#41049d","#43039e","#44039e","#46039f","#48039f","#4903a0","#4b03a1","#4c02a1","#4e02a2","#5002a2","#5102a3","#5302a3","#5502a4","#5601a4","#5801a4","#5901a5","#5b01a5","#5c01a6","#5e01a6","#6001a6","#6100a7","#6300a7","#6400a7","#6600a7","#6700a8","#6900a8","#6a00a8","#6c00a8","#6e00a8","#6f00a8","#7100a8","#7201a8","#7401a8","#7501a8","#7701a8","#7801a8","#7a02a8","#7b02a8","#7d03a8","#7e03a8","#8004a8","#8104a7","#8305a7","#8405a7","#8606a6","#8707a6","#8808a6","#8a09a5","#8b0aa5","#8d0ba5","#8e0ca4","#8f0da4","#910ea3","#920fa3","#9410a2","#9511a1","#9613a1","#9814a0","#99159f","#9a169f","#9c179e","#9d189d","#9e199d","#a01a9c","#a11b9b","#a21d9a","#a31e9a","#a51f99","#a62098","#a72197","#a82296","#aa2395","#ab2494","#ac2694","#ad2793","#ae2892","#b02991","#b12a90","#b22b8f","#b32c8e","#b42e8d","#b52f8c","#b6308b","#b7318a","#b83289","#ba3388","#bb3488","#bc3587","#bd3786","#be3885","#bf3984","#c03a83","#c13b82","#c23c81","#c33d80","#c43e7f","#c5407e","#c6417d","#c7427c","#c8437b","#c9447a","#ca457a","#cb4679","#cc4778","#cc4977","#cd4a76","#ce4b75","#cf4c74","#d04d73","#d14e72","#d24f71","#d35171","#d45270","#d5536f","#d5546e","#d6556d","#d7566c","#d8576b","#d9586a","#da5a6a","#da5b69","#db5c68","#dc5d67","#dd5e66","#de5f65","#de6164","#df6263","#e06363","#e16462","#e26561","#e26660","#e3685f","#e4695e","#e56a5d","#e56b5d","#e66c5c","#e76e5b","#e76f5a","#e87059","#e97158","#e97257","#ea7457","#eb7556","#eb7655","#ec7754","#ed7953","#ed7a52","#ee7b51","#ef7c51","#ef7e50","#f07f4f","#f0804e","#f1814d","#f1834c","#f2844b","#f3854b","#f3874a","#f48849","#f48948","#f58b47","#f58c46","#f68d45","#f68f44","#f79044","#f79143","#f79342","#f89441","#f89540","#f9973f","#f9983e","#f99a3e","#fa9b3d","#fa9c3c","#fa9e3b","#fb9f3a","#fba139","#fba238","#fca338","#fca537","#fca636","#fca835","#fca934","#fdab33","#fdac33","#fdae32","#fdaf31","#fdb130","#fdb22f","#fdb42f","#fdb52e","#feb72d","#feb82c","#feba2c","#febb2b","#febd2a","#febe2a","#fec029","#fdc229","#fdc328","#fdc527","#fdc627","#fdc827","#fdca26","#fdcb26","#fccd25","#fcce25","#fcd025","#fcd225","#fbd324","#fbd524","#fbd724","#fad824","#fada24","#f9dc24","#f9dd25","#f8df25","#f8e125","#f7e225","#f7e425","#f6e626","#f6e826","#f5e926","#f5eb27","#f4ed27","#f3ee27","#f3f027","#f2f227","#f1f426","#f1f525","#f0f724","#f0f921"];


var surfaceColor = "#000000";
var highlightSurfaceColor = "#00ff00";
var normalColor = "#ff0000";

var rayStrokeStyles = [];

var raySectionLengthInTime = 15;

rayStrokeStyles[OK] = { color: "#000000", style: [] };
rayStrokeStyles[OUT_OF_SURFACE] = { color: "hsl(0, 0%, 65%)", style: [1, 1] };
rayStrokeStyles[OBSTRUCTED] = { color: "hsl(0, 0%, 0%)", style: [5, 5] };
rayStrokeStyles[WRONG_SIDE] = { color: "hsl(330, 80%, 40%)", style: [10, 7] };
rayStrokeStyles[AUDIBLE] = { color: "#ff0000", style: [] };
rayStrokeStyles[SHADOW_RAY_STYLE] = { color: "#505050", style: [2,1] };

GA.prototype.initiateColors = function(maxOrder) {
    var i, h, s, l, col;
//    this.colors = [];
//    this.colors[0] = "#000000";
//    this.colors[BEM_TRANSPARENT_BACKGROUND] = "#ffff00";
//    this.colors[BEM_BLACK_BACKGROUND] = "#000000";
//    this.colors[BEM_TRANSPARENT_BACKGROUND] = "#ffffff";
//    this.colors[BEM_TRANSPARENT_BACKGROUND] = "rgba(255,255,255,0)";

    this.orderColors = [];
    for (i=0;i<5;i++) {
        this.orderColors[i] = [];
        this.orderColors[i][0] = "#000000";
        this.orderColors[i][SOURCE] = "#ff0000";
        this.orderColors[i][RECEIVER] = "#0000ff";
        this.orderColors[i][PRIMARY] = "#ff0000";
        this.orderColors[i][REFLECTION] = "0xff0000";
        this.orderColors[i][PHASE_REVERSED] = "0x00ffff";
    }
    for (i=1; i<=maxOrder; i++) {
        h = 10 + (300 * (i-1) / maxOrder);  // Maps the hue from red to blue to green
        s = (maxOrder-((i-1)/(1.3))) / (maxOrder) * 100;
        if (i == 1)
            h = 0;   // bright red
        if ((h>40) && (h<80)) {
            s = 100; // boost yellow!
        }
        if (h>200)  // lighter blue!
            l = 80;
        else
            l = 50;
        col = "hsl(" + h.toString() + ", " + s.toString() + "%, " + l.toString() + "%)";
        this.orderColors[0][i] = col;  // Rainbow colormap, not to be used ... :-)
        this.orderColors[1][i] = viridisMap[Math.max(0,200-i*20)];
        this.orderColors[2][i] = magmaMap[Math.max(0,200-i*20)];
        this.orderColors[3][i] = infernoMap[Math.max(0,200-i*20)];
        this.orderColors[4][i] = plasmaMap[Math.max(0,200-i*20)];
    }
    this.currentOrderColormap = 3;
};

//
// Basic drawing primitives
//

GA.prototype.scaleX = function(x) { return (x)*this.scaler+this.center.x; };
GA.prototype.scaleY = function(y) { return (y)*this.scaler+this.center.y; };
GA.prototype.scaleXinv = function(x) { return (x-this.center.x)/this.scaler; };
GA.prototype.scaleYinv = function(y) { return (y-this.center.y)/this.scaler; };

GA.prototype.moveTo = function(ctx, v) {
    ctx.moveTo(this.scaleX(v.x), this.scaleY(v.y));
};
GA.prototype.lineTo = function(ctx, v) {
    ctx.lineTo(this.scaleX(v.x), this.scaleY(v.y));
};
GA.prototype.arc = function(ctx, v, rad, startAngle, endAngle) {
    ctx.arc(this.scaleX(v.x), this.scaleY(v.y), rad * this.scaler, startAngle, endAngle, true);
};
GA.prototype.sector = function(ctx, v, rad, startAngle, endAngle) {
    this.moveTo(ctx, v);
//    console.log("Start:" + 180 * startAngle/M_PI, ". End: " + endAngle * 180 / M_PI)
    ctx.arc(this.scaleX(v.x), this.scaleY(v.y), rad * this.scaler, startAngle, endAngle, false);
    this.moveTo(ctx, v);
};
GA.prototype.circle = function(ctx, v, rad, startAngle, endAngle) {
    this.arc(ctx, v, rad, endAngle, startAngle);
};

function drawPath(ctx, color, width, lineStyle) {
    if (typeof lineStyle != 'undefined')
        ctx.setLineDash(lineStyle);

    ctx.strokeStyle = color;
    ctx.lineWidth = ctx.lineWidth * width;
    ctx.stroke();
    ctx.lineWidth = ctx.lineWidth / width;
    ctx.setLineDash([]);
}

//
// Resizing
//

window.addEventListener('resize', resizeAll, true);

function resizeAll() {
    var room, ctx, i;
    for (i in g_listOfRoomsForRedraw) {
        room = g_listOfRoomsForRedraw[i];
        ctx = document.getElementById(room.id).getContext('2d');
        room.resize(ctx.canvas);
        room.drawAll();
    }
}

GA.prototype.resize = function(canvas) {
    var origWidth = canvas.width;
    var origHeight = canvas.height;

    canvas.width = window.innerWidth * 0.84 - 36;
    canvas.height = Math.min(canvas.height, canvas.width / this.aspectRatio);

    var newHeight = origHeight;
    if ((canvas.width < origWidth) || (canvas.height < origHeight)) {  // Canvas size has reduced
        newHeight = origWidth / this.aspectRatio;
        if (newHeight < canvas.height) { // width is the limiting factor
            this.scaler = this.scaler * canvas.width / origWidth;
        }
        else { // Height is the dimension that got changed more
            this.scaler = canvas.height / this.origHeight;
        }
    }
    this.center = new Vec2(canvas.width / 2, canvas.height / 2);
};

//
// Draw geometry and handle clipping
//

GA.prototype.drawSurface = function(ctx, idx, color, width) {
    ctx.beginPath();
    this.moveTo(ctx, this.startVertices[idx]);
    this.lineTo(ctx, this.endVertices[idx]);
    if ((this.showOutside == 0) && (this.closer.length>0))
        drawPath(ctx, color, 2.95);
    else
        drawPath(ctx, color, width);

    if (this.showLabels) {
        var labelLoc = new Vec2(this.normals[idx]);
        labelLoc.scale(-10);
        labelLoc.add(this.centers[idx]);
        ctx.fillText(this.labels[idx], this.scaleX(labelLoc.x)-5, this.scaleY(labelLoc.y)+5);
    }
};

GA.prototype.clipOutside = function() {
    var ctx = this.ctx;
    ctx.beginPath();
    this.moveTo(ctx, this.startVertices[0]);
    var i;
    for (i=0;i<this.endVertices.length;i++)
        this.lineTo(ctx, this.endVertices[i]);
    for (i=0;i<this.closer.length;i++)
        this.lineTo(ctx, this.closer[i]);
    if (this.closer.length>0)
        ctx.strokeStyle = "rgba(0,0,0,0.0)";
    else
        ctx.strokeStyle = surfaceColor;
    ctx.stroke();
    ctx.clip();
};

function clearCanvas(ctx, color) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (typeof color != 'undefined') {
        ctx.beginPath();
        ctx.rect(0,0,ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = color;
        ctx.fill();
    }
}

GA.prototype.drawGeometry = function(drawNormals) {
    var ctx = this.ctx;
    if ((this.showOutside == 0) && (this.clipChanged == true)) {
        ctx.restore();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.saved = 0;
        this.clipChanged = false;
    }
    if ((this.showOutside == 0) && (this.saved == 0)) {
        ctx.save();
        this.saved = 1;
        this.clipOutside();
    } else if ((this.showOutside == 1) && (this.saved == 1)) {
        ctx.restore();
        this.saved = 0;
    }
    var i;
    for (i = 0; i < this.startVertices.length; i++)
        if ((this.visualize[BRDF_SLOTS] == 1) && (activeSurface == i))
            this.drawSurface(ctx, i, highlightSurfaceColor, 2);
        else
            this.drawSurface(ctx, i, surfaceColor, 1);
    if (drawNormals) {
        ctx.beginPath();
        for (i = 0; i < this.normals.length; i++) {
            this.moveTo(ctx, this.centers[i]);
            var tmp = new Vec2(this.normals[i]);
            tmp.scale(5);
            tmp.add(this.centers[i]);
            this.lineTo(ctx, tmp);
            drawPath(ctx, normalColor, 1);
        }
    }
};

//
// Draw rays (both full rays and sections
//

GA.prototype.drawRayPath = function(r, startTime, endTime, style, width, scaleToEnergy) {
    var ctx = this.ctx;

    var i;
    var numberOfRaySegments = Math.min(r.points.length, eval(this.rayVisualizationOrder)+1);
    for (i=0;i<numberOfRaySegments;i++) {
        var st = Math.max(startTime, r.startTimes[i]);
        var et = Math.min(r.startTimes[i]+ r.durations[i], endTime);
        if (et > st) {
            ctx.beginPath();

            var p = new Vec2(r.directions[i]);
            p.scaleToTime(st - r.startTimes[i]);
            p.add(r.points[i]);
            this.moveTo(ctx, p);

            p.set(r.directions[i].x, r.directions[i].y);
            if ((i == (r.points.length-1)) && (this.visualize[RAY_EMISSION] == 1) && (endTime == FULL_PATH_VISUALIZATION_TIME))
                p.scaleToTime(emittedRayDuration * r.energies[i] / ENERGY_PER_RAY); // Show energy as length in the last reflection
            else
                p.scaleToTime(et - r.startTimes[i]); // Normal duration scaling
            p.add(r.points[i]);
            this.lineTo(ctx, p);

            if (scaleToEnergy == true) {
                var gb = Math.round(256 * (1 - (r.energies[i] / ENERGY_PER_RAY)));
                var gbStr = gb.toString(16);
                if (gbStr.length == 1)
                    gbStr = "0"+gbStr;
                var newColor = "#ff" + gbStr + gbStr;
                drawPath(ctx, newColor, width, style.style)
            } else
                drawPath(ctx, style.color, width, style.style)
        }
    }
};

GA.prototype.drawRayExtension = function(intersection, srcloc) {
    var ctx = this.ctx;
    ctx.beginPath();
    this.moveTo(ctx, intersection);
    this.lineTo(ctx, srcloc);
    drawPath(ctx, "#000000", 1, [1, 3]);
};

//
// Wave fronts
//

// Adapted from stackoverflow
function hex2rgbAddAlpha(hex, alpha) {
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return "rgba(" + r.toString() + "," + g.toString() + "," + b.toString() + "," + alpha.toString() + ")";
}

GA.prototype.drawWaveFront = function(src, beam, rad) {
    var ctx = this.ctx;
    ctx.beginPath();
    this.circle(ctx, src.loc, rad, beam.leftAngle, beam.rightAngle, true);

    var color, width;
    color = this.orderColors[this.currentOrderColormap][src.order];
    if (rad<2)
        width = 2;
    else
        width = 1;
    if (this.simulationModes[BEM] == 1) {
        width = 5;
        var x0, y0, y1;
        x0 = src.loc.x - rad;
        y0 = src.loc.y;
        if (src.order == REFLECTION)
            y1 = src.loc.y-rad;
        else
            y1 = src.loc.y+rad;
        console.log("order = " + src.order);
        if (src.order == PHASE_REVERSED)
            this.ctx.globalCompositeOperation = 'screen';
        if ((src.order == PHASE_REVERSED) || (src.order == REFLECTION)) {
            this.ctx.globalCompositeOperation = 'screen';
            var grd = ctx.createLinearGradient(this.scaleX(x0), this.scaleY(y0), this.scaleX(x0), this.scaleY(y1));
            var aCol = hex2rgbAddAlpha(color, 0);
            grd.addColorStop(0.1, aCol);
            var bCol = hex2rgbAddAlpha(color, 1);
            grd.addColorStop(1, bCol);
            color = grd;
        }
    }
    drawPath(ctx, color, width);
    this.ctx.globalCompositeOperation = 'source-over';
};

//
// Cross
//

var cross_size = 4;

GA.prototype.drawCross = function(loc, order) {
    var ctx = this.ctx;
    ctx.beginPath();
    var tmp = new Vec2(loc);
    tmp.add({x: cross_size, y:0});
    this.moveTo(ctx, tmp);
    tmp.add({x: -2 * cross_size, y:0});
    this.lineTo(ctx, tmp);
    tmp.add({x: cross_size, y:-cross_size});
    this.moveTo(ctx, tmp);
    tmp.add({x: 0, y:2*cross_size});
    this.lineTo(ctx, tmp);
    drawPath(ctx, this.orderColors[this.currentOrderColormap][order], 2);
};

GA.prototype.markSourceLocation = function(loc, order) {
    this.drawCross(loc, order);
};

//
// Beam visualization
//

GA.prototype.drawBeam = function(beam, order, width) {
    if (beam.angle>=M_PI)  // Let us not draw the big angles
        return;

    var ctx = this.ctx;
    var tmp;
    ctx.beginPath();
    this.moveTo(ctx, beam.center);
    tmp = new Vec2(beam.leftDirection);
    var directionScaler = 50;
    tmp.scale(directionScaler);
    tmp.add(beam.leftLimit);
    this.lineTo(ctx, tmp);
    this.moveTo(ctx, beam.center);
    tmp = new Vec2(beam.rightDirection);
    tmp.scale(directionScaler);
    tmp.add(beam.rightLimit);
    this.lineTo(ctx, tmp);
    drawPath(ctx, this.orderColors[this.currentOrderColormap][order], width);

};

GA.prototype.highlightChildren = function(src) {
    var ctx = this.ctx;
    var i;
    for (i=0;i<src.children.length;i++) {
        this.drawSurface(ctx,src.children[i].reflector, highlightSurfaceColor, 2);
    }
};

//
// BRDFs and directional responses
//

GA.prototype.drawDirectionalResponse = function(ctx, response, scaler, center, lineDir) {
    var i;
    var nofSlots = response.length;
    var angleIncrement = M_PI / nofSlots;
    var angle = Math.atan2(lineDir.y, lineDir.x);
    for (i=0; i<nofSlots; i++) {
        ctx.beginPath();
        this.moveTo(ctx, center);
        this.sector(ctx, center, scaler*Math.sqrt(nofSlots*response[i]), angle - angleIncrement, angle);
        ctx.fill();
        ctx.beginPath();
        this.moveTo(ctx, center);
        this.sector(ctx, center, scaler*Math.sqrt(nofSlots*response[i]), angle - angleIncrement, angle);
        drawPath(ctx, "#ffffff", 1);
        angle -= angleIncrement;
    }
};

GA.prototype.drawBRDF = function(ctx, brdf, center, lineDir, src) {
    var BRDFsize = emittedRayDuration*60;
    var incidentAngleIndex = brdf.getAngleIndex(center, lineDir, src);
    if ((incidentAngleIndex >= 0) && (incidentAngleIndex<brdf.nofSlots))
        this.drawDirectionalResponse(ctx, brdf.coeffs[incidentAngleIndex], this.BRDFvisualizationScaler*Math.sqrt(BRDFsize), center, lineDir);
};

GA.prototype.drawBRDFs = function(src) {
    var ctx = this.ctx;
    var i;
    for (i=0; i<this.BRDFs.length; i++)
        this.drawBRDF(ctx, this.BRDFs[i], this.centers[i], this.lineDirs[i], src);
};

GA.prototype.drawARTresponses = function() {
    var ctx = this.ctx;
    var i, j, k;
    var scaler = 3;
    var gatherFromResponse;
    var startTime, endTime;
    var responseToBeDrawn = [];

    if (this.time == 0)
        this.ARTtemporalVisualization = TOTAL_ENERGY;
    else
        this.ARTtemporalVisualization = INSTANTANEOUS_ENERGY;

    for (i=0; i<this.lineDirs.length; i++) {
        if (this.ARTtemporalVisualization == TOTAL_ENERGY) {
            startTime = 0;
            endTime = 0;
            if (this.ARTenergyVisualization == ALL_ENERGY)
                gatherFromResponse = this.totalARTenergy[i];
            else
                gatherFromResponse = this.totalUnshotARTenergy[i];
        } else {  // INSTANTANEOUS_ENERGY
            startTime = Math.round(this.time);
            endTime = startTime+10;
            scaler = 10;
            if (this.ARTenergyVisualization == ALL_ENERGY)
                gatherFromResponse = this.ARTenergy[i];
            else
                gatherFromResponse = this.unshotARTenergy[i];
        }
        for (j=0;j<gatherFromResponse.responseToDirection.length; j++) {
            responseToBeDrawn[j] = 0;
            for (k = startTime; k <= endTime; k++)
                responseToBeDrawn[j] += gatherFromResponse.responseToDirection[j].values[k];
        }
        this.drawDirectionalResponse(ctx, responseToBeDrawn, scaler, this.centers[i], this.lineDirs[i]);
    }
};

var CIRCLE = new Sector({x: 0, y: 0});

//
// Update informational fields
//

function updateInformationFields(fields) {
    var i;
    var val, txt;
    for (i=0;i<fields.length;i++) {
//        val = eval(eval("fields[i]"));
        val = Math.round(eval(fields[i]));
        if ((val+1) >= MAX_IMAGE_SOURCES)
            txt = "TOO MANY";
        else
            txt = val.toString();
        document.getElementById(fields[i]).innerHTML = txt;
    }
}

//
// Find the maximum order to be visualized
//

GA.prototype.maxShowOrder = function() {
    var i;
    for (i=this.showOrders.length;i>0;i--) {
        if (this.showOrders[i] == 1)
            return i;
    }
    return this.maxOrder;
};

//
// Warn the user of the heavy load!
//
GA.prototype.drawWarning = function() {
    var ctx = this.ctx;
    var font = ctx.font;
    ctx.font = "50px Arial";
    ctx.fillStyle = "#e00000";
    ctx.textAlign = "center";
    ctx.fillText("Warning: Too many image sources", this.scaleX(0), this.scaleY(-300));
    ctx.fillText("Please, reduce the reflection order!", this.scaleX(0), this.scaleY(300));
    ctx.font = font;
};

//
//
//

 function drawLine(ctx, p0, p1, color, width, lineStyle) {
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    drawPath(ctx, color, width, lineStyle);
}

GA.prototype.getMinMaxX = function() {
    var i;
    var xmin=1E+9;
    var xmax = -xmin;
    for (i=0;i<this.startVertices.length; i++) {
        if (this.startVertices[i].x > xmax)
            xmax = this.startVertices[i].x;
        if (this.endVertices[i].x > xmax)
            xmax = this.endVertices[i].x;
        if (this.startVertices[i].x < xmin)
            xmin = this.startVertices[i].x;
        if (this.endVertices[i].x < xmin)
            xmin = this.endVertices[i].x;
    }
    return {max: xmax, min: xmin};
};

GA.prototype.showGeometryScaler = function() {
    var ctx = this.ctx;
    var h = 3;
    var y = ctx.canvas.height-h-1;
    var xRange = this.getMinMaxX();
    var internalDistance = xRange.max - xRange.min;
    var realDistance = this.rlParams.internalDistToRealDist(internalDistance);
    realDistance = roundToNdigits(realDistance, 2);

    var txt;
    txt = realDistance.toString()+"m";

    var x0 = this.scaleX(xRange.min);
    var x1 = this.scaleX(xRange.max);
    var col="#401010";
    var w = 1;
    drawLine(ctx, new Vec2(x0, y), new Vec2(x1,y), col, w);
    drawLine(ctx, new Vec2(x0, y-h), new Vec2(x0, y+h), col, w);
    drawLine(ctx, new Vec2(x1, y-h), new Vec2(x1, y+h), col, w);

    ctx.fillStyle = col;
    ctx.textAlign = "center";
    ctx.fillText(txt, ((x0+x1)/2), y-(2*h));
};

//
// Draw extra canvases (IR, ETC)
//
GA.prototype.drawExtras = function() {
    var canvas;
    if (this.simulationModes[MAKE_IS] == 1)
        this.constructIRResponse();
    if (this.simulationModes[CREATE_RAYS] == 1)
        this.constructETCResponseFromRays();
    if (this.simulationModes[ART] == 1)
        this.constructETCResponseFromART();
    if ((this.responseVisualization == IMPULSE_RESPONSE) && (this.updateCounter == 0)) {
        if (this.simulationModes[MAKE_IS] == 1) {
            canvas = this.IR_canvas;
        } else {
            canvas = this.ETC_canvas;
            this.constructIRfromETC();
        }
        this.receivers[0].IR.drawResponse(canvas, this.rlParams.internalDistToRealTime(this.time), this.responseVisualization);
        this.maxDuration = this.rlParams.realTimeToInternalTime(this.receivers[0].IR.maxDuration);
    } else
    if (this.ETC_canvas) {  // Energy-time curve
        if (this.responseVisualization == ETC_CURVE)
            this.receivers[0].ETC.drawResponse(this.ETC_canvas, this.rlParams.internalDistToRealTime(this.time), this.responseVisualization);
        else {
            var sch = this.receivers[0].ETC.SchroederBackwardIntegration();
            sch.drawResponse(this.ETC_canvas, this.rlParams.internalDistToRealTime(this.time), this.responseVisualization);
        }
        this.maxDuration = this.rlParams.realTimeToInternalTime(this.receivers[0].ETC.maxDuration);
    }
};

//
// The one call to rule them all!
//
GA.prototype.drawAll = function(drawExtraCanvases) {
    var style, level;

    if (typeof drawExtraCanvases == 'undefined')
        drawExtraCanvases = true;

    if (!this.inAnimation)
        this.time = this.timeSlider * this.maxDuration;

    this.ctx = document.getElementById(this.id).getContext('2d');

    var maxO = this.maxShowOrder();
    if (this.maxOrder != maxO) {
        this.maxOrder = maxO;
        this.computeAll();
    }
    if (this.sources.length >= MAX_IMAGE_SOURCES) {
        this.drawWarning();
        return;
    }

    clearTimeout(timer);
    var i, j;
    var drawRay = false;
    var tmpSrc;
    if (this.simulationModes[BEM] == 1)
        clearCanvas(this.ctx, this.orderColors[this.backgroundColor]);
    else
        clearCanvas(this.ctx);
    this.drawGeometry(1);

    if (typeof this.showOrders == 'undefined') {
        this.showOrders = [];
        for (i=0;i<10;i++)
            this.showOrders[i] = 1;
    }
    this.nofDrawnSources = 0;
    for (i=0;i<this.sources.length;i++)
        if (this.showOrders[this.sources[i].order] == 1) {
            this.nofDrawnSources++;
            this.markSourceLocation(this.sources[i].loc, this.sources[i].order);
            if ((this.visualize[BEAMS] == 1) && (this.beamVisualization != SHOW_NO_BEAMS))
                if ((this.beamVisualization == ALL_BEAMS) || (i == this.beamToBeVisualized)) {
                    var beamToBeDrawn = this.sources[i];
                    var lineWidth = 1;
                    if (this.beamVisualization == BEAM_BRANCH)
                        lineWidth = 3;
                    while ((beamToBeDrawn!=-1) && (beamToBeDrawn.parent != -1)) {
                        this.drawBeam(beamToBeDrawn.beam, beamToBeDrawn.order, lineWidth);
                        if (this.beamVisualization == BEAM_BRANCH) {
                            beamToBeDrawn = beamToBeDrawn.parent;
                            lineWidth = 1;
                        } else
                            beamToBeDrawn = -1;
                    }
                    if (this.beamVisualization == SINGLE_BEAM)
                        this.highlightChildren(this.sources[i]);
                }
            if (this.visualize[WAVE_FRONTS] == 1) {
                var sourceRadius = this.time - this.sources[i].startTime;
                if (sourceRadius>0)
                    this.drawWaveFront(this.sources[i], this.sources[i].beam, sourceRadius);
            }
        }
    this.nofDrawnRays = 0;
    for (i=0;i<this.rayPaths.length;i++) {
        drawRay = false;
        if (this.rayPaths[i].type == IMAGE_SOURCE_RAY) {
            if (this.beamVisualization == BEAM_BRANCH) {
                drawRay = (i == this.beamToBeVisualized);
            } else if ((this.showOrders[this.rayPaths[i].order] == 1) && (this.isVisualize[this.rayPaths[i].status] == 1))
                drawRay = true;
        } else
            if (this.rayVisualizationOrder > -1) {
                if ((this.rayVisualization == ALL_RAYS) || (this.rayDiffusionModel[SHADOW_RAYS] == 1))
                    drawRay = true;
                else if ((this.rayVisualization == AUDIBLE_RAYS) && (this.rayPaths[i].status == AUDIBLE))
                    drawRay = true;
            }
        if (drawRay == true) {
            this.nofDrawnRays++;
            var r = this.rayPaths[i];
            if (this.visualize[FULL_RAYS] == 1) {
                this.drawRayPath(r, -1, FULL_PATH_VISUALIZATION_TIME, rayStrokeStyles[r.status], 1, false);
                for(j=0; j< r.shadowRays.length; j++)
                    if (r.shadowRays[j])
                        this.drawRayPath(r.shadowRays[j], -1, FULL_PATH_VISUALIZATION_TIME, rayStrokeStyles[SHADOW_RAY_STYLE], 1, false);
            }
            if (this.visualize[RAY_SEGMENTS] == 1) {
                var startTime = Math.max(0, this.time - raySectionLengthInTime);
                style = { color: this.orderColors[this.currentOrderColormap][r.startTimes.length - 1], style: [] };
                this.drawRayPath(r, startTime, this.time, style, 2.5, false);
                for(j=0; j< r.shadowRays.length; j++)
                    if (r.shadowRays[j])
                        this.drawRayPath(r.shadowRays[j], startTime, this.time, rayStrokeStyles[SHADOW_RAY_STYLE], 2, false);
            }
            if (this.visualize[RAY_EXTENSIONS] == 1) {
                tmpSrc = r.source;
                for (j = r.directions.length - 1; j > 0; j--) {
                    this.drawRayExtension(r.points[j], tmpSrc.loc);
                    tmpSrc = tmpSrc.parent;
                }
            }
        }
        if (this.visualize[RAY_EMISSION] == 1) {
            var tmp = this.rayVisualizationOrder;
            this.rayVisualizationOrder = 0;
            this.drawRayPath(this.rayPaths[i], -1, emittedRayDuration, "#000000", 1, true);
            this.rayVisualizationOrder = tmp;
        }
    }

    if (this.visualize[SHOW_RECEIVER] == 1) {
        var rec = this.receivers[0];
        if (this.receiverRadius > 0)
            this.drawWaveFront({loc: rec.loc, order: RECEIVER}, CIRCLE, this.receiverRadius); // A dirty hack to get a circle
        else
            this.drawCross(rec.loc, RECEIVER);

        if (this.visualize[RAY_SEGMENTS] == 1) {
            var nofSlots = 36;
            if (this.scaler > 1.0)
                nofSlots += Math.floor((this.scaler - 1) * 20);
            var rayletDistribution = new PolarDensity(nofSlots, -M_PI, M_PI);
            var order;
            for (order = 0; order <= this.maxOrder; order++) {
                for (i = 0; i < rec.registeredPaths.length; i++) {
                    var rayEvent = rec.registeredPaths[i];
                    var eTime = rayEvent.time;
                    if ((eTime < this.time) && (rayEvent.order == order) && (rayEvent.type == AUDIBLE)) {
                    // if ((eTime < this.time) && (rayEvent.order == order)) {
                        var rayID = rayEvent.rayID;
                        var incidentAngle = getLineOrientation(this.rayPaths[rayID].points[rayEvent.order], rec.loc);
                        level = rayletDistribution.addNew(incidentAngle);
                        eTime = eTime - (level * raySectionLengthInTime * 0.8);
                        style = {color: this.orderColors[this.currentOrderColormap][rayEvent.order], style: []};
                        this.drawRayPath(this.rayPaths[rayID], eTime - raySectionLengthInTime, eTime, style, 2.5, false);
                    }
                }
            }
        }
    }

    if (this.visualize[SHOW_PRIMARY_SOURCE] == 1) {
        this.drawWaveFront({loc: this.sources[0].loc, order: 0}, CIRCLE, cross_size);
        this.drawCross(this.sources[0].loc, SOURCE);
    }

    if (this.visualize[BRDF_SLOTS] == 1)
        this.drawBRDFs(this.sources[0].loc);

    if (this.visualize[RADIANCE] == 1)
        this.drawARTresponses();

    updateInformationFields(this.informationFields);

    if (this.isTreeWin)
        this.resizeAndDrawTree(this.isTreeWin);

    if (this.showScale == 1) {
        this.rlParams.tuneSpatialScaler(this.geometryScaler);
        this.showGeometryScaler();
    }
    if (drawExtraCanvases)
        this.drawExtras();
};


//
// Playing with timers to make the animations work
//

var rayNumber = 0;
var room;

function drawGeometryAndRay() {
    clearCanvas(room.ctx);
    room.drawGeometry(1);
    room.drawRayPath(room.rayPaths[rayNumber], -1, FULL_PATH_VISUALIZATION_TIME, rayStrokeStyles[room.rayPaths[rayNumber].status], 1, false);
    room.drawWaveFront({loc: room.receivers[0].loc, order: RECEIVER}, CIRCLE, room.receiverRadius); // A dirty hack to get a circle
    rayNumber++;
    if (rayNumber<room.rayPaths.length)
        setTimeout(drawGeometryAndRay, 5000/room.rayPaths.length);
    else
        room.drawAll();
}

GA.prototype.rayByRayAnimation = function() {
    rayNumber = 0;
    room = this;
    timer = setTimeout(drawGeometryAndRay, 0);
};

//
// Temporal animation
//

var NOF_ANIMATION_STEPS = 200;
var RELATIVE_TEMPORAL_ANIMATION_INCREMENT = 1/NOF_ANIMATION_STEPS;

function drawAllForTemporalAnimation() {
    room.drawAll();
    room.timeSlider += RELATIVE_TEMPORAL_ANIMATION_INCREMENT;
    if (room.timeSlider < 1)
        setTimeout(drawAllForTemporalAnimation, room.animationTime/NOF_ANIMATION_STEPS);
}

GA.prototype.temporalAnimation = function() {
    room = this;
    this.timeSlider = 0;
    timer = setTimeout(drawAllForTemporalAnimation, 0);
};

//
// Ray-tracing
//
// (c) Lauri Savioja, 2016
//

"use strict";

var emittedRayDuration = 60;
var reflectedRayDuration = 1250;

function Ray(src) {
    this.points = [];
    this.reflectors = [];
    this.directions = [];
    this.startTimes = [];
    this.durations = [];
    this.energies = [];
    this.shadowRays = [];
    this.order = 0;
    this.status = OK;
    this.escaped = false;
    this.source = src;
}

Ray.prototype.markAudibility = function(p0, p1, rec, radius) {
    if (typeof p1 == 'undefined')
        console.log("No p1");
    var audible = false;
    var dir = new Vec2(p1);
    dir.sub(p0);
    var norm = new Vec2(dir.y, -dir.x);
    norm.normalize();
    norm.scale(radius);
    if (segmentsIntersect(p0, dir, rec, norm, -1)) {
        this.status = AUDIBLE;
        audible = true;
    }
    norm.scale(-1);
    if (segmentsIntersect(p0, dir, rec, norm, -1)) {
        this.status = AUDIBLE;
        audible = true;
    }
    return audible;
};

function getClosestReflector(room, p0, s0, limit) {
    var i;
    var t;
    var t_min = 1E+20;
    if (typeof limit != 'undefined')
        t_min = limit;
    var reflector;

    for (i = 0; i < room.startVertices.length; i++) {
        t = intersect(room.startVertices[i], room.lineDirs[i], p0, s0);
        if ((t > EPS) && (t < t_min)) {
            var dir = new Vec2(s0);
            dir.scale(t*1.1);
            if (segmentsIntersect(room.startVertices[i], room.lineDirs[i], p0, dir, 1)) {
                t_min = t;
                reflector = i;
            }
        }
    }
    return {t_min: t_min, reflector: reflector};
}

Ray.prototype.reflectAgainstClosestIntersectionPoint = function(room) {
    var p0 = this.points[this.points.length - 1];
    var s0 = new Vec2(this.directions[this.points.length - 1]);
    var ip = getClosestReflector(room, p0, s0);
    var angle;
    if (typeof ip.reflector != 'undefined') {
        this.reflectors[this.order] = ip.reflector;
        s0.set(this.directions[this.points.length - 1]);
        s0.scale(ip.t_min);
        this.durations[this.order] = s0.timeOfFlight();
        this.startTimes.push(this.startTimes[this.order] + this.durations[this.order]);
        this.durations[this.order+1] = reflectedRayDuration;
        s0.add(p0);
        if (typeof s0 == 'undefined')
            console.log("Pieleen!");
        this.points.push(s0);
        if (room.simulationModes[ART] == 1) {
            room.registerARTenergies(this.source, this.reflectors[this.order], this.durations[this.order], s0, this.energies[0]);
        }
        var reflectedDir;
        if ((room.raySplitFactor > 0) || (Math.random() >= room.diffusionCoeffs[ip.reflector])) { // Specular reflection
            reflectedDir = p0.reflect(room.normals[ip.reflector], s0);
            reflectedDir.sub(s0);
            if (reflectedDir.len() == 0) {
                angle = ((Math.random() - 0.5) * M_PI) + room.surfaceNormalAngles[ip.reflector];
                reflectedDir = new Vec2(Math.cos(angle), Math.sin(angle));
            }
        } else {  // Diffuse reflection
            angle = ((Math.random()-0.5) * M_PI) + room.surfaceNormalAngles[ip.reflector];
            reflectedDir = new Vec2(Math.cos(angle), Math.sin(angle));
        }
        this.directions.push(reflectedDir);
        if ((room.simulationModes[CREATE_RAYS] == 1) && (room.simulationModes[MAKE_IS] == 1))
            this.source = room.sources[1];    // Hack!To show ray extension to an image source in reflectionModels!
        this.order++;
        if (room.raySplitFactor > 0) {
            var availableEnergy = this.energies[this.order-1] * (1-room.absorptionCoeffs[ip.reflector]);
            var diffusedEnergy = availableEnergy * room.diffusionCoeffs[ip.reflector];
            var reflectedEnergy = availableEnergy - diffusedEnergy;
            this.energies[this.order] = reflectedEnergy;
            room.createRays(room.raySplitFactor, ip.reflector, s0, this.startTimes[this.startTimes.length - 1], DIFFUSE_SPLIT_RAY, diffusedEnergy / (room.raySplitFactor),
                room.surfaceNormalAngles[ip.reflector] - M_PI_2, room.surfaceNormalAngles[ip.reflector] + M_PI_2);
        } else
            this.energies[this.order] = this.energies[this.order-1] * (1-room.absorptionCoeffs[ip.reflector]);
    } else {
        console.log("Ray escaped: " + this.id + " at order " + this.reflectors.length);
        this.escaped = true;
    }
};

Ray.prototype.getPressure = function(order, absCoeffs) {
    var i;
    var val = this.energies[0];
    for (i=1;i<=order;i++)
        val = val * Math.sqrt(1-absCoeffs[this.reflectors[i]])
    return val;
};

Ray.prototype.getEnergy = function(order, absCoeffs) {
    var i;
    var val = this.energies[0];
    for (i=1;i<=order;i++)
        val = val * (1-absCoeffs[this.reflectors[i]])
    return val;
};

Ray.prototype.debug = function() {
    var i;
    console.log("ID: " + this.id + ". Order: " + this.order + ". Status: " + this.status);
    for (i=0;i<=this.order;i++) {
        this.points[i].print("Point: ");
        this.directions[i].print("Direction: ");
        console.log("Reflector: " + this.reflectors[i]);
    }
};

GA.prototype.checkAudibilities = function() {
    var i, j, maxOrder;
    var r;
    var rec = this.receivers[0];

    rec.reset();

    for (i=0;i<this.rayPaths.length;i++) {
        r = this.rayPaths[i];
        r.status = OK;

        maxOrder = Math.min(this.rayVisualizationOrder, r.points.length-1);
        if (r.escaped)
            maxOrder--;
        for (j=0;j<=maxOrder;j++) {
            if ((this.receiverRadius > 0) && (r.directions[j].len() > 1e-5)) {
                if (r.markAudibility(r.points[j], r.points[j + 1], rec.loc, this.receiverRadius)) {
                    var t = r.points[j].timeOfFlight(rec.loc);
                    t += r.startTimes[j];
                    rec.registerPath(t, i, j, AUDIBLE);
                }
            }
        }
    }
};

GA.prototype.reflectRays = function(initOrder) {
    var i, j;
    var r;
    for (j=0; j<this.rayPaths.length;j++) {
        r = this.rayPaths[j];
        for(i=initOrder;i<this.maxOrder;i++) if (!r.escaped) {
            r.reflectAgainstClosestIntersectionPoint(this);
        }
    }
};

GA.prototype.resetRays = function() {
    var i;
    this.rayPaths.splice(this.nofRays,this.rayPaths.length-this.nofRays);
    for (i=0; i<this.rayPaths.length;i++) {
        this.rayPaths[i].points.splice(1,this.rayPaths[i].points.length-1);
        this.rayPaths[i].startTimes.splice(1,this.rayPaths[i].startTimes.length-1);
        this.rayPaths[i].directions.splice(1,this.rayPaths[i].directions.length-1);
        this.rayPaths[i].durations.splice(1,this.rayPaths[i].durations.length-1);
        this.rayPaths[i].energies.splice(1,this.rayPaths[i].energies.length-1);
        this.rayPaths[i].order = 0;
    }
};

GA.prototype.createShadowRays = function() {
    var i, j, r;
    var rec=this.receivers[0];
    var recDiameter = this.receiverRadius*2;
    var maxOrder;

    for (i=0;i<this.rayPaths.length; i++) {
        r = this.rayPaths[i];
        maxOrder = Math.min(r.points.length, this.rayVisualizationOrder);
        if (r.escaped)
            maxOrder--;
        for (j=1; j<=maxOrder; j++) {
            var p0 = r.points[j];
            if (typeof p0 == 'undefined')
                console.log("Error!");
            var dir = getDir(p0, this.receivers[0].loc);
            var t = dir.timeOfFlight();
            dir.normalize();
            var ip=getClosestReflector(this, p0, dir, t);
            if (typeof ip.reflector == 'undefined') { // No occlusion, i.e. makes a valid path
                var shadowRay = new Ray(this.sources[0].loc);
                var energy = r.energies[j - 1] * (1 - this.absorptionCoeffs[r.reflectors[j-1]]) * (this.diffusionCoeffs[r.reflectors[j-1]]);
                energy = energy * (recDiameter / (M_PI * t));// Divide the energy evenly over a hemi-circle and take the fraction covered by the receiver (approx.)
                if (energy > 0) {
                    shadowRay.type = DIFFUSE_SHADOW_RAY;
                    shadowRay.status = AUDIBLE;
                    shadowRay.startTimes[0] = r.startTimes[j];
                    shadowRay.energies[0] = energy;
                    shadowRay.points[0] = p0;
                    shadowRay.points[1] = this.receivers[0].loc;
                    shadowRay.directions[0] = dir;
                    shadowRay.durations[0] = t;
                    r.shadowRays[j] = shadowRay;
                    rec.registerPath(shadowRay.startTimes[0]+t, i, j, DIFFUSE_SHADOW_RAY);
                }
            }
        }
    }
};

GA.prototype.clearShadowRays = function() {
    var i, j, r;
    for (i=0;i<this.rayPaths.length; i++) {
        r = this.rayPaths[i];
        for (j=1; j< r.points.length; j++) {
            r.shadowRays[j] = null;
        }
    }
};

GA.prototype.createRays = function(nofRays, src, srcLoc, emissionTime, rayType, energyPerRay, minAngle, maxAngle) {
    var i;
    var angle;
    var totalAngle = maxAngle - minAngle;
    var r;
    if (totalAngle<M_2_PI) {
        var offset = totalAngle / (nofRays + 1);
        minAngle += offset;
        totalAngle -= offset;
    }
    for (i=0; i<nofRays;i++) {
        r = new Ray(src);
        this.rayPaths.push(r);
        r.points[0] = srcLoc;
        r.startTimes[0] = emissionTime;
        r.type = rayType;
        if (rayType == CAST_RAY) {
            r.durations[0] = emittedRayDuration;
            r.id = "Cast:" + i.toString();
            r.order = 0;
        } else {
            r.durations[0] = reflectedRayDuration;
            r.id = "Split:" + i.toString();
            r.order = 1;  // HACK, wrong if higher order reflections, but those are not good in any case :-)
        }
        r.energies[0] = energyPerRay;
        if ((this.rayDistribution == RANDOM) || (rayType == DIFFUSE_SPLIT_RAY))
            angle = (Math.random() * totalAngle) + minAngle;
        else {
            angle = ((i / nofRays) * totalAngle) + minAngle;
            if (this.rayDistribution == JITTERED)
                angle = angle + (Math.random()-0.5) * (totalAngle / nofRays  ) / 2;
        }
        r.directions[0] = new Vec2(Math.cos(angle), Math.sin(angle));
        r.status = OK;
    }
};

GA.prototype.validateRays = function() {
    var i, j, r;
    for (i=0; i<this.rayPaths.length; i++) {
        r=this.rayPaths[i];
        if ((r.points.length-1) != r.reflectors.length)
            console.log("Too few/many points, ray=",i);
        for (j=0;j<(r.startTimes.length-1);j++)
            if (typeof r.reflectors[j] == 'undefined')
                console.log("No reflector!");
        if (r.reflectors.length == 0)
            console.log("No reflector at all: ", i);
    }
};

GA.prototype.toggleShowRayReflection = function() {
    if (this.rayVisualizationOrder == -1)
       this.rayVisualizationOrder = 1;
    else
        this.rayVisualizationOrder = -1;
    //   this.showOrders[1] = 1;
    this.drawAll();
};/*
 *  /MathJax.js
 *
 *  Copyright (c) 2009-2017 The MathJax Consortium
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

if(document.getElementById&&document.childNodes&&document.createElement){if(!(window.MathJax&&MathJax.Hub)){if(window.MathJax){window.MathJax={AuthorConfig:window.MathJax}}else{window.MathJax={}}MathJax.isPacked=true;MathJax.version="2.7.1";MathJax.fileversion="2.7.1";MathJax.cdnVersion="2.7.1";MathJax.cdnFileVersions={};(function(d){var b=window[d];if(!b){b=window[d]={}}var e=[];var c=function(f){var g=f.constructor;if(!g){g=function(){}}for(var h in f){if(h!=="constructor"&&f.hasOwnProperty(h)){g[h]=f[h]}}return g};var a=function(){return function(){return arguments.callee.Init.call(this,arguments)}};b.Object=c({constructor:a(),Subclass:function(f,h){var g=a();g.SUPER=this;g.Init=this.Init;g.Subclass=this.Subclass;g.Augment=this.Augment;g.protoFunction=this.protoFunction;g.can=this.can;g.has=this.has;g.isa=this.isa;g.prototype=new this(e);g.prototype.constructor=g;g.Augment(f,h);return g},Init:function(f){var g=this;if(f.length===1&&f[0]===e){return g}if(!(g instanceof f.callee)){g=new f.callee(e)}return g.Init.apply(g,f)||g},Augment:function(f,g){var h;if(f!=null){for(h in f){if(f.hasOwnProperty(h)){this.protoFunction(h,f[h])}}if(f.toString!==this.prototype.toString&&f.toString!=={}.toString){this.protoFunction("toString",f.toString)}}if(g!=null){for(h in g){if(g.hasOwnProperty(h)){this[h]=g[h]}}}return this},protoFunction:function(g,f){this.prototype[g]=f;if(typeof f==="function"){f.SUPER=this.SUPER.prototype}},prototype:{Init:function(){},SUPER:function(f){return f.callee.SUPER},can:function(f){return typeof(this[f])==="function"},has:function(f){return typeof(this[f])!=="undefined"},isa:function(f){return(f instanceof Object)&&(this instanceof f)}},can:function(f){return this.prototype.can.call(this,f)},has:function(f){return this.prototype.has.call(this,f)},isa:function(g){var f=this;while(f){if(f===g){return true}else{f=f.SUPER}}return false},SimpleSUPER:c({constructor:function(f){return this.SimpleSUPER.define(f)},define:function(f){var h={};if(f!=null){for(var g in f){if(f.hasOwnProperty(g)){h[g]=this.wrap(g,f[g])}}if(f.toString!==this.prototype.toString&&f.toString!=={}.toString){h.toString=this.wrap("toString",f.toString)}}return h},wrap:function(i,h){if(typeof(h)!=="function"||!h.toString().match(/\.\s*SUPER\s*\(/)){return h}var g=function(){this.SUPER=g.SUPER[i];try{var f=h.apply(this,arguments)}catch(j){delete this.SUPER;throw j}delete this.SUPER;return f};g.toString=function(){return h.toString.apply(h,arguments)};return g}})});b.Object.isArray=Array.isArray||function(f){return Object.prototype.toString.call(f)==="[object Array]"};b.Object.Array=Array})("MathJax");(function(BASENAME){var BASE=window[BASENAME];if(!BASE){BASE=window[BASENAME]={}}var isArray=BASE.Object.isArray;var CALLBACK=function(data){var cb=function(){return arguments.callee.execute.apply(arguments.callee,arguments)};for(var id in CALLBACK.prototype){if(CALLBACK.prototype.hasOwnProperty(id)){if(typeof(data[id])!=="undefined"){cb[id]=data[id]}else{cb[id]=CALLBACK.prototype[id]}}}cb.toString=CALLBACK.prototype.toString;return cb};CALLBACK.prototype={isCallback:true,hook:function(){},data:[],object:window,execute:function(){if(!this.called||this.autoReset){this.called=!this.autoReset;return this.hook.apply(this.object,this.data.concat([].slice.call(arguments,0)))}},reset:function(){delete this.called},toString:function(){return this.hook.toString.apply(this.hook,arguments)}};var ISCALLBACK=function(f){return(typeof(f)==="function"&&f.isCallback)};var EVAL=function(code){return eval.call(window,code)};var TESTEVAL=function(){EVAL("var __TeSt_VaR__ = 1");if(window.__TeSt_VaR__){try{delete window.__TeSt_VaR__}catch(error){window.__TeSt_VaR__=null}}else{if(window.execScript){EVAL=function(code){BASE.__code=code;code="try {"+BASENAME+".__result = eval("+BASENAME+".__code)} catch(err) {"+BASENAME+".__result = err}";window.execScript(code);var result=BASE.__result;delete BASE.__result;delete BASE.__code;if(result instanceof Error){throw result}return result}}else{EVAL=function(code){BASE.__code=code;code="try {"+BASENAME+".__result = eval("+BASENAME+".__code)} catch(err) {"+BASENAME+".__result = err}";var head=(document.getElementsByTagName("head"))[0];if(!head){head=document.body}var script=document.createElement("script");script.appendChild(document.createTextNode(code));head.appendChild(script);head.removeChild(script);var result=BASE.__result;delete BASE.__result;delete BASE.__code;if(result instanceof Error){throw result}return result}}}TESTEVAL=null};var USING=function(args,i){if(arguments.length>1){if(arguments.length===2&&!(typeof arguments[0]==="function")&&arguments[0] instanceof Object&&typeof arguments[1]==="number"){args=[].slice.call(args,i)}else{args=[].slice.call(arguments,0)}}if(isArray(args)&&args.length===1){args=args[0]}if(typeof args==="function"){if(args.execute===CALLBACK.prototype.execute){return args}return CALLBACK({hook:args})}else{if(isArray(args)){if(typeof(args[0])==="string"&&args[1] instanceof Object&&typeof args[1][args[0]]==="function"){return CALLBACK({hook:args[1][args[0]],object:args[1],data:args.slice(2)})}else{if(typeof args[0]==="function"){return CALLBACK({hook:args[0],data:args.slice(1)})}else{if(typeof args[1]==="function"){return CALLBACK({hook:args[1],object:args[0],data:args.slice(2)})}}}}else{if(typeof(args)==="string"){if(TESTEVAL){TESTEVAL()}return CALLBACK({hook:EVAL,data:[args]})}else{if(args instanceof Object){return CALLBACK(args)}else{if(typeof(args)==="undefined"){return CALLBACK({})}}}}}throw Error("Can't make callback from given data")};var DELAY=function(time,callback){callback=USING(callback);callback.timeout=setTimeout(callback,time);return callback};var WAITFOR=function(callback,signal){callback=USING(callback);if(!callback.called){WAITSIGNAL(callback,signal);signal.pending++}};var WAITEXECUTE=function(){var signals=this.signal;delete this.signal;this.execute=this.oldExecute;delete this.oldExecute;var result=this.execute.apply(this,arguments);if(ISCALLBACK(result)&&!result.called){WAITSIGNAL(result,signals)}else{for(var i=0,m=signals.length;i<m;i++){signals[i].pending--;if(signals[i].pending<=0){signals[i].call()}}}};var WAITSIGNAL=function(callback,signals){if(!isArray(signals)){signals=[signals]}if(!callback.signal){callback.oldExecute=callback.execute;callback.execute=WAITEXECUTE;callback.signal=signals}else{if(signals.length===1){callback.signal.push(signals[0])}else{callback.signal=callback.signal.concat(signals)}}};var AFTER=function(callback){callback=USING(callback);callback.pending=0;for(var i=1,m=arguments.length;i<m;i++){if(arguments[i]){WAITFOR(arguments[i],callback)}}if(callback.pending===0){var result=callback();if(ISCALLBACK(result)){callback=result}}return callback};var HOOKS=MathJax.Object.Subclass({Init:function(reset){this.hooks=[];this.remove=[];this.reset=reset;this.running=false},Add:function(hook,priority){if(priority==null){priority=10}if(!ISCALLBACK(hook)){hook=USING(hook)}hook.priority=priority;var i=this.hooks.length;while(i>0&&priority<this.hooks[i-1].priority){i--}this.hooks.splice(i,0,hook);return hook},Remove:function(hook){for(var i=0,m=this.hooks.length;i<m;i++){if(this.hooks[i]===hook){if(this.running){this.remove.push(i)}else{this.hooks.splice(i,1)}return}}},Execute:function(){var callbacks=[{}];this.running=true;for(var i=0,m=this.hooks.length;i<m;i++){if(this.reset){this.hooks[i].reset()}var result=this.hooks[i].apply(window,arguments);if(ISCALLBACK(result)&&!result.called){callbacks.push(result)}}this.running=false;if(this.remove.length){this.RemovePending()}if(callbacks.length===1){return null}if(callbacks.length===2){return callbacks[1]}return AFTER.apply({},callbacks)},RemovePending:function(){this.remove=this.remove.sort();for(var i=this.remove.length-1;i>=0;i--){this.hooks.splice(i,1)}this.remove=[]}});var EXECUTEHOOKS=function(hooks,data,reset){if(!hooks){return null}if(!isArray(hooks)){hooks=[hooks]}if(!isArray(data)){data=(data==null?[]:[data])}var handler=HOOKS(reset);for(var i=0,m=hooks.length;i<m;i++){handler.Add(hooks[i])}return handler.Execute.apply(handler,data)};var QUEUE=BASE.Object.Subclass({Init:function(){this.pending=this.running=0;this.queue=[];this.Push.apply(this,arguments)},Push:function(){var callback;for(var i=0,m=arguments.length;i<m;i++){callback=USING(arguments[i]);if(callback===arguments[i]&&!callback.called){callback=USING(["wait",this,callback])}this.queue.push(callback)}if(!this.running&&!this.pending){this.Process()}return callback},Process:function(queue){while(!this.running&&!this.pending&&this.queue.length){var callback=this.queue[0];queue=this.queue.slice(1);this.queue=[];this.Suspend();var result=callback();this.Resume();if(queue.length){this.queue=queue.concat(this.queue)}if(ISCALLBACK(result)&&!result.called){WAITFOR(result,this)}}},Suspend:function(){this.running++},Resume:function(){if(this.running){this.running--}},call:function(){this.Process.apply(this,arguments)},wait:function(callback){return callback}});var SIGNAL=QUEUE.Subclass({Init:function(name){QUEUE.prototype.Init.call(this);this.name=name;this.posted=[];this.listeners=HOOKS(true);this.posting=false;this.callback=null},Post:function(message,callback,forget){callback=USING(callback);if(this.posting||this.pending){this.Push(["Post",this,message,callback,forget])}else{this.callback=callback;callback.reset();if(!forget){this.posted.push(message)}this.Suspend();this.posting=true;var result=this.listeners.Execute(message);if(ISCALLBACK(result)&&!result.called){WAITFOR(result,this)}this.Resume();this.posting=false;if(!this.pending){this.call()}}return callback},Clear:function(callback){callback=USING(callback);if(this.posting||this.pending){callback=this.Push(["Clear",this,callback])}else{this.posted=[];callback()}return callback},call:function(){this.callback(this);this.Process()},Interest:function(callback,ignorePast,priority){callback=USING(callback);this.listeners.Add(callback,priority);if(!ignorePast){for(var i=0,m=this.posted.length;i<m;i++){callback.reset();var result=callback(this.posted[i]);if(ISCALLBACK(result)&&i===this.posted.length-1){WAITFOR(result,this)}}}return callback},NoInterest:function(callback){this.listeners.Remove(callback)},MessageHook:function(msg,callback,priority){callback=USING(callback);if(!this.hooks){this.hooks={};this.Interest(["ExecuteHooks",this])}if(!this.hooks[msg]){this.hooks[msg]=HOOKS(true)}this.hooks[msg].Add(callback,priority);for(var i=0,m=this.posted.length;i<m;i++){if(this.posted[i]==msg){callback.reset();callback(this.posted[i])}}callback.msg=msg;return callback},ExecuteHooks:function(msg){var type=(isArray(msg)?msg[0]:msg);if(!this.hooks[type]){return null}return this.hooks[type].Execute(msg)},RemoveHook:function(hook){this.hooks[hook.msg].Remove(hook)}},{signals:{},find:function(name){if(!SIGNAL.signals[name]){SIGNAL.signals[name]=new SIGNAL(name)}return SIGNAL.signals[name]}});BASE.Callback=BASE.CallBack=USING;BASE.Callback.Delay=DELAY;BASE.Callback.After=AFTER;BASE.Callback.Queue=QUEUE;BASE.Callback.Signal=SIGNAL.find;BASE.Callback.Hooks=HOOKS;BASE.Callback.ExecuteHooks=EXECUTEHOOKS})("MathJax");(function(e){var a=window[e];if(!a){a=window[e]={}}var d=(navigator.vendor==="Apple Computer, Inc."&&typeof navigator.vendorSub==="undefined");var g=0;var h=function(i){if(document.styleSheets&&document.styleSheets.length>g){g=document.styleSheets.length}if(!i){i=document.head||((document.getElementsByTagName("head"))[0]);if(!i){i=document.body}}return i};var f=[];var c=function(){for(var k=0,j=f.length;k<j;k++){a.Ajax.head.removeChild(f[k])}f=[]};var b={};b[e]="";b.a11y="[MathJax]/extensions/a11y";b.Contrib="https://cdn.mathjax.org/mathjax/contrib";a.Ajax={loaded:{},loading:{},loadHooks:{},timeout:15*1000,styleDelay:1,config:{root:"",path:b},params:{},STATUS:{OK:1,ERROR:-1},fileURL:function(j){var i;while((i=j.match(/^\[([-._a-z0-9]+)\]/i))&&b.hasOwnProperty(i[1])){j=(b[i[1]]||this.config.root)+j.substr(i[1].length+2)}return j},fileName:function(j){var i=this.config.root;if(j.substr(0,i.length)===i){j="["+e+"]"+j.substr(i.length)}do{var k=false;for(var l in b){if(b.hasOwnProperty(l)&&b[l]){if(j.substr(0,b[l].length)===b[l]){j="["+l+"]"+j.substr(b[l].length);k=true;break}}}}while(k);return j},fileRev:function(j){var i=a.cdnFileVersions[j]||a.cdnVersion||"";if(i){i="?V="+i}return i},urlRev:function(i){return this.fileURL(i)+this.fileRev(i)},Require:function(k,n){n=a.Callback(n);var l;if(k instanceof Object){for(var j in k){if(k.hasOwnProperty(j)){l=j.toUpperCase();k=k[j]}}}else{l=k.split(/\./).pop().toUpperCase()}if(this.params.noContrib&&k.substr(0,9)==="[Contrib]"){n(this.STATUS.ERROR)}else{k=this.fileURL(k);if(this.loaded[k]){n(this.loaded[k])}else{var m={};m[l]=k;this.Load(m,n)}}return n},Load:function(k,m){m=a.Callback(m);var l;if(k instanceof Object){for(var j in k){if(k.hasOwnProperty(j)){l=j.toUpperCase();k=k[j]}}}else{l=k.split(/\./).pop().toUpperCase()}k=this.fileURL(k);if(this.loading[k]){this.addHook(k,m)}else{this.head=h(this.head);if(this.loader[l]){this.loader[l].call(this,k,m)}else{throw Error("Can't load files of type "+l)}}return m},LoadHook:function(l,m,k){m=a.Callback(m);if(l instanceof Object){for(var j in l){if(l.hasOwnProperty(j)){l=l[j]}}}l=this.fileURL(l);if(this.loaded[l]){m(this.loaded[l])}else{this.addHook(l,m,k)}return m},addHook:function(j,k,i){if(!this.loadHooks[j]){this.loadHooks[j]=MathJax.Callback.Hooks()}this.loadHooks[j].Add(k,i);k.file=j},removeHook:function(i){if(this.loadHooks[i.file]){this.loadHooks[i.file].Remove(i);if(!this.loadHooks[i.file].hooks.length){delete this.loadHooks[i.file]}}},Preloading:function(){for(var l=0,j=arguments.length;l<j;l++){var k=this.fileURL(arguments[l]);if(!this.loading[k]){this.loading[k]={preloaded:true}}}},loader:{JS:function(k,m){var j=this.fileName(k);var i=document.createElement("script");var l=a.Callback(["loadTimeout",this,k]);this.loading[k]={callback:m,timeout:setTimeout(l,this.timeout),status:this.STATUS.OK,script:i};this.loading[k].message=a.Message.File(j);i.onerror=l;i.type="text/javascript";i.src=k+this.fileRev(j);this.head.appendChild(i)},CSS:function(j,l){var i=this.fileName(j);var k=document.createElement("link");k.rel="stylesheet";k.type="text/css";k.href=j+this.fileRev(i);this.loading[j]={callback:l,message:a.Message.File(i),status:this.STATUS.OK};this.head.appendChild(k);this.timer.create.call(this,[this.timer.file,j],k)}},timer:{create:function(j,i){j=a.Callback(j);if(i.nodeName==="STYLE"&&i.styleSheet&&typeof(i.styleSheet.cssText)!=="undefined"){j(this.STATUS.OK)}else{if(window.chrome&&i.nodeName==="LINK"){j(this.STATUS.OK)}else{if(d){this.timer.start(this,[this.timer.checkSafari2,g++,j],this.styleDelay)}else{this.timer.start(this,[this.timer.checkLength,i,j],this.styleDelay)}}}return j},start:function(j,i,k,l){i=a.Callback(i);i.execute=this.execute;i.time=this.time;i.STATUS=j.STATUS;i.timeout=l||j.timeout;i.delay=i.total=k||0;if(k){setTimeout(i,k)}else{i()}},time:function(i){this.total+=this.delay;this.delay=Math.floor(this.delay*1.05+5);if(this.total>=this.timeout){i(this.STATUS.ERROR);return 1}return 0},file:function(j,i){if(i<0){a.Ajax.loadTimeout(j)}else{a.Ajax.loadComplete(j)}},execute:function(){this.hook.call(this.object,this,this.data[0],this.data[1])},checkSafari2:function(i,j,k){if(i.time(k)){return}if(document.styleSheets.length>j&&document.styleSheets[j].cssRules&&document.styleSheets[j].cssRules.length){k(i.STATUS.OK)}else{setTimeout(i,i.delay)}},checkLength:function(i,l,n){if(i.time(n)){return}var m=0;var j=(l.sheet||l.styleSheet);try{if((j.cssRules||j.rules||[]).length>0){m=1}}catch(k){if(k.message.match(/protected variable|restricted URI/)){m=1}else{if(k.message.match(/Security error/)){m=1}}}if(m){setTimeout(a.Callback([n,i.STATUS.OK]),0)}else{setTimeout(i,i.delay)}}},loadComplete:function(i){i=this.fileURL(i);var j=this.loading[i];if(j&&!j.preloaded){a.Message.Clear(j.message);clearTimeout(j.timeout);if(j.script){if(f.length===0){setTimeout(c,0)}f.push(j.script)}this.loaded[i]=j.status;delete this.loading[i];this.addHook(i,j.callback)}else{if(j){delete this.loading[i]}this.loaded[i]=this.STATUS.OK;j={status:this.STATUS.OK}}if(!this.loadHooks[i]){return null}return this.loadHooks[i].Execute(j.status)},loadTimeout:function(i){if(this.loading[i].timeout){clearTimeout(this.loading[i].timeout)}this.loading[i].status=this.STATUS.ERROR;this.loadError(i);this.loadComplete(i)},loadError:function(i){a.Message.Set(["LoadFailed","File failed to load: %1",i],null,2000);a.Hub.signal.Post(["file load error",i])},Styles:function(k,l){var i=this.StyleString(k);if(i===""){l=a.Callback(l);l()}else{var j=document.createElement("style");j.type="text/css";this.head=h(this.head);this.head.appendChild(j);if(j.styleSheet&&typeof(j.styleSheet.cssText)!=="undefined"){j.styleSheet.cssText=i}else{j.appendChild(document.createTextNode(i))}l=this.timer.create.call(this,l,j)}return l},StyleString:function(n){if(typeof(n)==="string"){return n}var k="",o,m;for(o in n){if(n.hasOwnProperty(o)){if(typeof n[o]==="string"){k+=o+" {"+n[o]+"}\n"}else{if(a.Object.isArray(n[o])){for(var l=0;l<n[o].length;l++){m={};m[o]=n[o][l];k+=this.StyleString(m)}}else{if(o.substr(0,6)==="@media"){k+=o+" {"+this.StyleString(n[o])+"}\n"}else{if(n[o]!=null){m=[];for(var j in n[o]){if(n[o].hasOwnProperty(j)){if(n[o][j]!=null){m[m.length]=j+": "+n[o][j]}}}k+=o+" {"+m.join("; ")+"}\n"}}}}}}return k}}})("MathJax");MathJax.HTML={Element:function(d,f,e){var g=document.createElement(d),h;if(f){if(f.hasOwnProperty("style")){var c=f.style;f.style={};for(h in c){if(c.hasOwnProperty(h)){f.style[h.replace(/-([a-z])/g,this.ucMatch)]=c[h]}}}MathJax.Hub.Insert(g,f);for(h in f){if(h==="role"||h.substr(0,5)==="aria-"){g.setAttribute(h,f[h])}}}if(e){if(!MathJax.Object.isArray(e)){e=[e]}for(var b=0,a=e.length;b<a;b++){if(MathJax.Object.isArray(e[b])){g.appendChild(this.Element(e[b][0],e[b][1],e[b][2]))}else{if(d==="script"){this.setScript(g,e[b])}else{g.appendChild(document.createTextNode(e[b]))}}}}return g},ucMatch:function(a,b){return b.toUpperCase()},addElement:function(b,a,d,c){return b.appendChild(this.Element(a,d,c))},TextNode:function(a){return document.createTextNode(a)},addText:function(a,b){return a.appendChild(this.TextNode(b))},setScript:function(a,b){if(this.setScriptBug){a.text=b}else{while(a.firstChild){a.removeChild(a.firstChild)}this.addText(a,b)}},getScript:function(a){var b=(a.text===""?a.innerHTML:a.text);return b.replace(/^\s+/,"").replace(/\s+$/,"")},Cookie:{prefix:"mjx",expires:365,Set:function(a,e){var d=[];if(e){for(var g in e){if(e.hasOwnProperty(g)){d.push(g+":"+e[g].toString().replace(/&/g,"&&"))}}}var b=this.prefix+"."+a+"="+escape(d.join("&;"));if(this.expires){var f=new Date();f.setDate(f.getDate()+this.expires);b+="; expires="+f.toGMTString()}try{document.cookie=b+"; path=/"}catch(c){}},Get:function(a,d){if(!d){d={}}var g=new RegExp("(?:^|;\\s*)"+this.prefix+"\\."+a+"=([^;]*)(?:;|$)");var f;try{f=g.exec(document.cookie)}catch(c){}if(f&&f[1]!==""){var j=unescape(f[1]).split("&;");for(var e=0,b=j.length;e<b;e++){f=j[e].match(/([^:]+):(.*)/);var h=f[2].replace(/&&/g,"&");if(h==="true"){h=true}else{if(h==="false"){h=false}else{if(h.match(/^-?(\d+(\.\d+)?|\.\d+)$/)){h=parseFloat(h)}}}d[f[1]]=h}}return d}}};MathJax.Localization={locale:"en",directory:"[MathJax]/localization",strings:{ast:{menuTitle:"asturianu"},bg:{menuTitle:"\u0431\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0438"},bcc:{menuTitle:"\u0628\u0644\u0648\u0686\u06CC"},br:{menuTitle:"brezhoneg"},ca:{menuTitle:"catal\u00E0"},cdo:{menuTitle:"M\u00ECng-d\u0115\u0324ng-ng\u1E73\u0304"},cs:{menuTitle:"\u010De\u0161tina"},da:{menuTitle:"dansk"},de:{menuTitle:"Deutsch"},diq:{menuTitle:"Zazaki"},en:{menuTitle:"English",isLoaded:true},eo:{menuTitle:"Esperanto"},es:{menuTitle:"espa\u00F1ol"},fa:{menuTitle:"\u0641\u0627\u0631\u0633\u06CC"},fi:{menuTitle:"suomi"},fr:{menuTitle:"fran\u00E7ais"},gl:{menuTitle:"galego"},he:{menuTitle:"\u05E2\u05D1\u05E8\u05D9\u05EA"},ia:{menuTitle:"interlingua"},it:{menuTitle:"italiano"},ja:{menuTitle:"\u65E5\u672C\u8A9E"},kn:{menuTitle:"\u0C95\u0CA8\u0CCD\u0CA8\u0CA1"},ko:{menuTitle:"\uD55C\uAD6D\uC5B4"},lb:{menuTitle:"L\u00EBtzebuergesch"},lki:{menuTitle:"\u0644\u06D5\u06A9\u06CC"},lt:{menuTitle:"lietuvi\u0173"},mk:{menuTitle:"\u043C\u0430\u043A\u0435\u0434\u043E\u043D\u0441\u043A\u0438"},nl:{menuTitle:"Nederlands"},oc:{menuTitle:"occitan"},pl:{menuTitle:"polski"},pt:{menuTitle:"portugus\u00EA"},"pt-br":{menuTitle:"portugu\u00EAs do Brasil"},ru:{menuTitle:"\u0440\u0443\u0441\u0441\u043A\u0438\u0439"},sco:{menuTitle:"Scots"},scn:{menuTitle:"sicilianu"},sl:{menuTitle:"sloven\u0161\u010Dina"},sv:{menuTitle:"svenska"},tr:{menuTitle:"T\u00FCrk\u00E7e"},uk:{menuTitle:"\u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430"},vi:{menuTitle:"Ti\u1EBFng Vi\u1EC7t"},"zh-hans":{menuTitle:"\u4E2D\u6587\uFF08\u7B80\u4F53\uFF09"}},pattern:/%(\d+|\{\d+\}|\{[a-z]+:\%\d+(?:\|(?:%\{\d+\}|%.|[^\}])*)+\}|.)/g,SPLIT:("axb".split(/(x)/).length===3?function(a,b){return a.split(b)}:function(c,e){var a=[],b,d=0;e.lastIndex=0;while((b=e.exec(c))){a.push(c.substr(d,b.index-d));a.push.apply(a,b.slice(1));d=b.index+b[0].length}a.push(c.substr(d));return a}),_:function(b,a){if(MathJax.Object.isArray(a)){return this.processSnippet(b,a)}return this.processString(this.lookupPhrase(b,a),[].slice.call(arguments,2))},processString:function(l,p,g){var j,e,o=MathJax.Object.isArray;for(j=0,e=p.length;j<e;j++){if(g&&o(p[j])){p[j]=this.processSnippet(g,p[j])}}var f=this.SPLIT(l,this.pattern);for(j=1,e=f.length;j<e;j+=2){var q=f[j].charAt(0);if(q>="0"&&q<="9"){f[j]=p[f[j]-1];if(typeof f[j]==="number"){f[j]=this.number(f[j])}}else{if(q==="{"){q=f[j].substr(1);if(q>="0"&&q<="9"){f[j]=p[f[j].substr(1,f[j].length-2)-1];if(typeof f[j]==="number"){f[j]=this.number(f[j])}}else{var k=f[j].match(/^\{([a-z]+):%(\d+)\|(.*)\}$/);if(k){if(k[1]==="plural"){var d=p[k[2]-1];if(typeof d==="undefined"){f[j]="???"}else{d=this.plural(d)-1;var h=k[3].replace(/(^|[^%])(%%)*%\|/g,"$1$2%\uEFEF").split(/\|/);if(d>=0&&d<h.length){f[j]=this.processString(h[d].replace(/\uEFEF/g,"|"),p,g)}else{f[j]="???"}}}else{f[j]="%"+f[j]}}}}}if(f[j]==null){f[j]="???"}}if(!g){return f.join("")}var a=[],b="";for(j=0;j<e;j++){b+=f[j];j++;if(j<e){if(o(f[j])){a.push(b);a=a.concat(f[j]);b=""}else{b+=f[j]}}}if(b!==""){a.push(b)}return a},processSnippet:function(g,e){var c=[];for(var d=0,b=e.length;d<b;d++){if(MathJax.Object.isArray(e[d])){var f=e[d];if(typeof f[1]==="string"){var h=f[0];if(!MathJax.Object.isArray(h)){h=[g,h]}var a=this.lookupPhrase(h,f[1]);c=c.concat(this.processMarkdown(a,f.slice(2),g))}else{if(MathJax.Object.isArray(f[1])){c=c.concat(this.processSnippet.apply(this,f))}else{if(f.length>=3){c.push([f[0],f[1],this.processSnippet(g,f[2])])}else{c.push(e[d])}}}}else{c.push(e[d])}}return c},markdownPattern:/(%.)|(\*{1,3})((?:%.|.)+?)\2|(`+)((?:%.|.)+?)\4|\[((?:%.|.)+?)\]\(([^\s\)]+)\)/,processMarkdown:function(b,h,d){var j=[],e;var c=b.split(this.markdownPattern);var g=c[0];for(var f=1,a=c.length;f<a;f+=8){if(c[f+1]){e=this.processString(c[f+2],h,d);if(!MathJax.Object.isArray(e)){e=[e]}e=[["b","i","i"][c[f+1].length-1],{},e];if(c[f+1].length===3){e=["b",{},e]}}else{if(c[f+3]){e=this.processString(c[f+4].replace(/^\s/,"").replace(/\s$/,""),h,d);if(!MathJax.Object.isArray(e)){e=[e]}e=["code",{},e]}else{if(c[f+5]){e=this.processString(c[f+5],h,d);if(!MathJax.Object.isArray(e)){e=[e]}e=["a",{href:this.processString(c[f+6],h),target:"_blank"},e]}else{g+=c[f];e=null}}}if(e){j=this.concatString(j,g,h,d);j.push(e);g=""}if(c[f+7]!==""){g+=c[f+7]}}j=this.concatString(j,g,h,d);return j},concatString:function(a,c,b,d){if(c!=""){c=this.processString(c,b,d);if(!MathJax.Object.isArray(c)){c=[c]}a=a.concat(c)}return a},lookupPhrase:function(f,a,d){if(!d){d="_"}if(MathJax.Object.isArray(f)){d=(f[0]||"_");f=(f[1]||"")}var c=this.loadDomain(d);if(c){MathJax.Hub.RestartAfter(c)}var b=this.strings[this.locale];if(b){if(b.domains&&d in b.domains){var e=b.domains[d];if(e.strings&&f in e.strings){a=e.strings[f]}}}return a},loadFile:function(b,d,e){e=MathJax.Callback(e);b=(d.file||b);if(!b.match(/\.js$/)){b+=".js"}if(!b.match(/^([a-z]+:|\[MathJax\])/)){var a=(this.strings[this.locale].directory||this.directory+"/"+this.locale||"[MathJax]/localization/"+this.locale);b=a+"/"+b}var c=MathJax.Ajax.Require(b,function(){d.isLoaded=true;return e()});return(c.called?null:c)},loadDomain:function(c,e){var b,a=this.strings[this.locale];if(a){if(!a.isLoaded){b=this.loadFile(this.locale,a);if(b){return MathJax.Callback.Queue(b,["loadDomain",this,c]).Push(e||{})}}if(a.domains&&c in a.domains){var d=a.domains[c];if(!d.isLoaded){b=this.loadFile(c,d);if(b){return MathJax.Callback.Queue(b).Push(e)}}}}return MathJax.Callback(e)()},Try:function(a){a=MathJax.Callback(a);a.autoReset=true;try{a()}catch(b){if(!b.restart){throw b}MathJax.Callback.After(["Try",this,a],b.restart)}},resetLocale:function(a){if(!a){return}a=a.toLowerCase();while(!this.strings[a]){var c=a.lastIndexOf("-");if(c===-1){return}a=a.substring(0,c)}var b=this.strings[a].remap;this.locale=b?b:a},setLocale:function(a){this.resetLocale(a);if(MathJax.Menu){this.loadDomain("MathMenu")}},addTranslation:function(b,e,c){var d=this.strings[b],a=false;if(!d){d=this.strings[b]={};a=true}if(!d.domains){d.domains={}}if(e){if(!d.domains[e]){d.domains[e]={}}d=d.domains[e]}MathJax.Hub.Insert(d,c);if(a&&MathJax.Menu.menu){MathJax.Menu.CreateLocaleMenu()}},setCSS:function(b){var a=this.strings[this.locale];if(a){if(a.fontFamily){b.style.fontFamily=a.fontFamily}if(a.fontDirection){b.style.direction=a.fontDirection;if(a.fontDirection==="rtl"){b.style.textAlign="right"}}}return b},fontFamily:function(){var a=this.strings[this.locale];return(a?a.fontFamily:null)},fontDirection:function(){var a=this.strings[this.locale];return(a?a.fontDirection:null)},plural:function(b){var a=this.strings[this.locale];if(a&&a.plural){return a.plural(b)}if(b==1){return 1}return 2},number:function(b){var a=this.strings[this.locale];if(a&&a.number){return a.number(b)}return b}};MathJax.Message={ready:false,log:[{}],current:null,textNodeBug:(navigator.vendor==="Apple Computer, Inc."&&typeof navigator.vendorSub==="undefined")||(window.hasOwnProperty&&window.hasOwnProperty("konqueror")),styles:{"#MathJax_Message":{position:"fixed",left:"1px",bottom:"2px","background-color":"#E6E6E6",border:"1px solid #959595",margin:"0px",padding:"2px 8px","z-index":"102",color:"black","font-size":"80%",width:"auto","white-space":"nowrap"},"#MathJax_MSIE_Frame":{position:"absolute",top:0,left:0,width:"0px","z-index":101,border:"0px",margin:"0px",padding:"0px"}},browsers:{MSIE:function(a){MathJax.Message.msieFixedPositionBug=((document.documentMode||0)<7);if(MathJax.Message.msieFixedPositionBug){MathJax.Hub.config.styles["#MathJax_Message"].position="absolute"}MathJax.Message.quirks=(document.compatMode==="BackCompat")},Chrome:function(a){MathJax.Hub.config.styles["#MathJax_Message"].bottom="1.5em";MathJax.Hub.config.styles["#MathJax_Message"].left="1em"}},Init:function(a){if(a){this.ready=true}if(!document.body||!this.ready){return false}if(this.div&&this.div.parentNode==null){this.div=document.getElementById("MathJax_Message");if(this.div){this.text=this.div.firstChild}}if(!this.div){var b=document.body;if(this.msieFixedPositionBug&&window.attachEvent){b=this.frame=this.addDiv(document.body);b.removeAttribute("id");b.style.position="absolute";b.style.border=b.style.margin=b.style.padding="0px";b.style.zIndex="101";b.style.height="0px";b=this.addDiv(b);b.id="MathJax_MSIE_Frame";window.attachEvent("onscroll",this.MoveFrame);window.attachEvent("onresize",this.MoveFrame);this.MoveFrame()}this.div=this.addDiv(b);this.div.style.display="none";this.text=this.div.appendChild(document.createTextNode(""))}return true},addDiv:function(a){var b=document.createElement("div");b.id="MathJax_Message";if(a.firstChild){a.insertBefore(b,a.firstChild)}else{a.appendChild(b)}return b},MoveFrame:function(){var a=(MathJax.Message.quirks?document.body:document.documentElement);var b=MathJax.Message.frame;b.style.left=a.scrollLeft+"px";b.style.top=a.scrollTop+"px";b.style.width=a.clientWidth+"px";b=b.firstChild;b.style.height=a.clientHeight+"px"},localize:function(a){return MathJax.Localization._(a,a)},filterText:function(a,c,b){if(MathJax.Hub.config.messageStyle==="simple"){if(b==="LoadFile"){if(!this.loading){this.loading=this.localize("Loading")+" "}a=this.loading;this.loading+="."}else{if(b==="ProcessMath"){if(!this.processing){this.processing=this.localize("Processing")+" "}a=this.processing;this.processing+="."}else{if(b==="TypesetMath"){if(!this.typesetting){this.typesetting=this.localize("Typesetting")+" "}a=this.typesetting;this.typesetting+="."}}}}return a},clearCounts:function(){delete this.loading;delete this.processing;delete this.typesetting},Set:function(c,e,b){if(e==null){e=this.log.length;this.log[e]={}}var d="";if(MathJax.Object.isArray(c)){d=c[0];if(MathJax.Object.isArray(d)){d=d[1]}try{c=MathJax.Localization._.apply(MathJax.Localization,c)}catch(a){if(!a.restart){throw a}if(!a.restart.called){if(this.log[e].restarted==null){this.log[e].restarted=0}this.log[e].restarted++;delete this.log[e].cleared;MathJax.Callback.After(["Set",this,c,e,b],a.restart);return e}}}if(this.timer){clearTimeout(this.timer);delete this.timer}this.log[e].text=c;this.log[e].filteredText=c=this.filterText(c,e,d);if(typeof(this.log[e].next)==="undefined"){this.log[e].next=this.current;if(this.current!=null){this.log[this.current].prev=e}this.current=e}if(this.current===e&&MathJax.Hub.config.messageStyle!=="none"){if(this.Init()){if(this.textNodeBug){this.div.innerHTML=c}else{this.text.nodeValue=c}this.div.style.display="";if(this.status){window.status="";delete this.status}}else{window.status=c;this.status=true}}if(this.log[e].restarted){if(this.log[e].cleared){b=0}if(--this.log[e].restarted===0){delete this.log[e].cleared}}if(b){setTimeout(MathJax.Callback(["Clear",this,e]),b)}else{if(b==0){this.Clear(e,0)}}return e},Clear:function(b,a){if(this.log[b].prev!=null){this.log[this.log[b].prev].next=this.log[b].next}if(this.log[b].next!=null){this.log[this.log[b].next].prev=this.log[b].prev}if(this.current===b){this.current=this.log[b].next;if(this.text){if(this.div.parentNode==null){this.Init()}if(this.current==null){if(this.timer){clearTimeout(this.timer);delete this.timer}if(a==null){a=600}if(a===0){this.Remove()}else{this.timer=setTimeout(MathJax.Callback(["Remove",this]),a)}}else{if(MathJax.Hub.config.messageStyle!=="none"){if(this.textNodeBug){this.div.innerHTML=this.log[this.current].filteredText}else{this.text.nodeValue=this.log[this.current].filteredText}}}if(this.status){window.status="";delete this.status}}else{if(this.status){window.status=(this.current==null?"":this.log[this.current].text)}}}delete this.log[b].next;delete this.log[b].prev;delete this.log[b].filteredText;if(this.log[b].restarted){this.log[b].cleared=true}},Remove:function(){this.text.nodeValue="";this.div.style.display="none"},File:function(a){return this.Set(["LoadFile","Loading %1",a],null,null)},Log:function(){var b=[];for(var c=1,a=this.log.length;c<a;c++){b[c]=this.log[c].text}return b.join("\n")}};MathJax.Hub={config:{root:"",config:[],styleSheets:[],styles:{".MathJax_Preview":{color:"#888"}},jax:[],extensions:[],preJax:null,postJax:null,displayAlign:"center",displayIndent:"0",preRemoveClass:"MathJax_Preview",showProcessingMessages:true,messageStyle:"normal",delayStartupUntil:"none",skipStartupTypeset:false,elements:[],positionToHash:true,showMathMenu:true,showMathMenuMSIE:true,menuSettings:{zoom:"None",CTRL:false,ALT:false,CMD:false,Shift:false,discoverable:false,zscale:"200%",renderer:null,font:"Auto",context:"MathJax",locale:null,mpContext:false,mpMouse:false,texHints:true,FastPreview:null,assistiveMML:null,inTabOrder:true,semantics:false},errorSettings:{message:["[",["MathProcessingError","Math Processing Error"],"]"],style:{color:"#CC0000","font-style":"italic"}},ignoreMMLattributes:{}},preProcessors:MathJax.Callback.Hooks(true),inputJax:{},outputJax:{order:{}},processSectionDelay:50,processUpdateTime:250,processUpdateDelay:10,signal:MathJax.Callback.Signal("Hub"),Config:function(a){this.Insert(this.config,a);if(this.config.Augment){this.Augment(this.config.Augment)}},CombineConfig:function(c,f){var b=this.config,g,e;c=c.split(/\./);for(var d=0,a=c.length;d<a;d++){g=c[d];if(!b[g]){b[g]={}}e=b;b=b[g]}e[g]=b=this.Insert(f,b);return b},Register:{PreProcessor:function(){return MathJax.Hub.preProcessors.Add.apply(MathJax.Hub.preProcessors,arguments)},MessageHook:function(){return MathJax.Hub.signal.MessageHook.apply(MathJax.Hub.signal,arguments)},StartupHook:function(){return MathJax.Hub.Startup.signal.MessageHook.apply(MathJax.Hub.Startup.signal,arguments)},LoadHook:function(){return MathJax.Ajax.LoadHook.apply(MathJax.Ajax,arguments)}},UnRegister:{PreProcessor:function(a){MathJax.Hub.preProcessors.Remove(a)},MessageHook:function(a){MathJax.Hub.signal.RemoveHook(a)},StartupHook:function(a){MathJax.Hub.Startup.signal.RemoveHook(a)},LoadHook:function(a){MathJax.Ajax.removeHook(a)}},getAllJax:function(e){var c=[],b=this.elementScripts(e);for(var d=0,a=b.length;d<a;d++){if(b[d].MathJax&&b[d].MathJax.elementJax){c.push(b[d].MathJax.elementJax)}}return c},getJaxByType:function(f,e){var c=[],b=this.elementScripts(e);for(var d=0,a=b.length;d<a;d++){if(b[d].MathJax&&b[d].MathJax.elementJax&&b[d].MathJax.elementJax.mimeType===f){c.push(b[d].MathJax.elementJax)}}return c},getJaxByInputType:function(f,e){var c=[],b=this.elementScripts(e);for(var d=0,a=b.length;d<a;d++){if(b[d].MathJax&&b[d].MathJax.elementJax&&b[d].type&&b[d].type.replace(/ *;(.|\s)*/,"")===f){c.push(b[d].MathJax.elementJax)}}return c},getJaxFor:function(a){if(typeof(a)==="string"){a=document.getElementById(a)}if(a&&a.MathJax){return a.MathJax.elementJax}if(this.isMathJaxNode(a)){if(!a.isMathJax){a=a.firstChild}while(a&&!a.jaxID){a=a.parentNode}if(a){return MathJax.OutputJax[a.jaxID].getJaxFromMath(a)}}return null},isJax:function(a){if(typeof(a)==="string"){a=document.getElementById(a)}if(this.isMathJaxNode(a)){return 1}if(a&&(a.tagName||"").toLowerCase()==="script"){if(a.MathJax){return(a.MathJax.state===MathJax.ElementJax.STATE.PROCESSED?1:-1)}if(a.type&&this.inputJax[a.type.replace(/ *;(.|\s)*/,"")]){return -1}}return 0},isMathJaxNode:function(a){return !!a&&(a.isMathJax||(a.className||"")==="MathJax_MathML")},setRenderer:function(d,c){if(!d){return}if(!MathJax.OutputJax[d]){this.config.menuSettings.renderer="";var b="[MathJax]/jax/output/"+d+"/config.js";return MathJax.Ajax.Require(b,["setRenderer",this,d,c])}else{this.config.menuSettings.renderer=d;if(c==null){c="jax/mml"}var a=this.outputJax;if(a[c]&&a[c].length){if(d!==a[c][0].id){a[c].unshift(MathJax.OutputJax[d]);return this.signal.Post(["Renderer Selected",d])}}return null}},Queue:function(){return this.queue.Push.apply(this.queue,arguments)},Typeset:function(c,d){if(!MathJax.isReady){return null}var b=this.elementCallback(c,d);if(b.count){var a=MathJax.Callback.Queue(["PreProcess",this,b.elements],["Process",this,b.elements])}return a.Push(b.callback)},PreProcess:function(e,g){var c=this.elementCallback(e,g);var b=MathJax.Callback.Queue();if(c.count){var f=(c.count===1?[c.elements]:c.elements);b.Push(["Post",this.signal,["Begin PreProcess",c.elements]]);for(var d=0,a=f.length;d<a;d++){if(f[d]){b.Push(["Execute",this.preProcessors,f[d]])}}b.Push(["Post",this.signal,["End PreProcess",c.elements]])}return b.Push(c.callback)},Process:function(a,b){return this.takeAction("Process",a,b)},Update:function(a,b){return this.takeAction("Update",a,b)},Reprocess:function(a,b){return this.takeAction("Reprocess",a,b)},Rerender:function(a,b){return this.takeAction("Rerender",a,b)},takeAction:function(g,d,h){var c=this.elementCallback(d,h);var f=c.elements;var a=MathJax.Callback.Queue(["Clear",this.signal]);var e={scripts:[],start:new Date().getTime(),i:0,j:0,jax:{},jaxIDs:[]};if(c.count){var b=["Delay",MathJax.Callback,this.processSectionDelay];if(!b[2]){b={}}a.Push(["clearCounts",MathJax.Message],["Post",this.signal,["Begin "+g,f]],["Post",this.signal,["Begin Math",f,g]],["prepareScripts",this,g,f,e],["Post",this.signal,["Begin Math Input",f,g]],["processInput",this,e],["Post",this.signal,["End Math Input",f,g]],b,["prepareOutput",this,e,"preProcess"],b,["Post",this.signal,["Begin Math Output",f,g]],["processOutput",this,e],["Post",this.signal,["End Math Output",f,g]],b,["prepareOutput",this,e,"postProcess"],b,["Post",this.signal,["End Math",f,g]],["Post",this.signal,["End "+g,f]],["clearCounts",MathJax.Message])}return a.Push(c.callback)},scriptAction:{Process:function(a){},Update:function(b){var a=b.MathJax.elementJax;if(a&&a.needsUpdate()){a.Remove(true);b.MathJax.state=a.STATE.UPDATE}else{b.MathJax.state=a.STATE.PROCESSED}},Reprocess:function(b){var a=b.MathJax.elementJax;if(a){a.Remove(true);b.MathJax.state=a.STATE.UPDATE}},Rerender:function(b){var a=b.MathJax.elementJax;if(a){a.Remove(true);b.MathJax.state=a.STATE.OUTPUT}}},prepareScripts:function(h,e,g){if(arguments.callee.disabled){return}var b=this.elementScripts(e);var f=MathJax.ElementJax.STATE;for(var d=0,a=b.length;d<a;d++){var c=b[d];if(c.type&&this.inputJax[c.type.replace(/ *;(.|\n)*/,"")]){if(c.MathJax){if(c.MathJax.elementJax&&c.MathJax.elementJax.hover){MathJax.Extension.MathEvents.Hover.ClearHover(c.MathJax.elementJax)}if(c.MathJax.state!==f.PENDING){this.scriptAction[h](c)}}if(!c.MathJax){c.MathJax={state:f.PENDING}}if(c.MathJax.error){delete c.MathJax.error}if(c.MathJax.state!==f.PROCESSED){g.scripts.push(c)}}}},checkScriptSiblings:function(a){if(a.MathJax.checked){return}var b=this.config,f=a.previousSibling;if(f&&f.nodeName==="#text"){var d,e,c=a.nextSibling;if(c&&c.nodeName!=="#text"){c=null}if(b.preJax){if(typeof(b.preJax)==="string"){b.preJax=new RegExp(b.preJax+"$")}d=f.nodeValue.match(b.preJax)}if(b.postJax&&c){if(typeof(b.postJax)==="string"){b.postJax=new RegExp("^"+b.postJax)}e=c.nodeValue.match(b.postJax)}if(d&&(!b.postJax||e)){f.nodeValue=f.nodeValue.replace(b.preJax,(d.length>1?d[1]:""));f=null}if(e&&(!b.preJax||d)){c.nodeValue=c.nodeValue.replace(b.postJax,(e.length>1?e[1]:""))}if(f&&!f.nodeValue.match(/\S/)){f=f.previousSibling}}if(b.preRemoveClass&&f&&f.className===b.preRemoveClass){a.MathJax.preview=f}a.MathJax.checked=1},processInput:function(a){var b,i=MathJax.ElementJax.STATE;var h,e,d=a.scripts.length;try{while(a.i<d){h=a.scripts[a.i];if(!h){a.i++;continue}e=h.previousSibling;if(e&&e.className==="MathJax_Error"){e.parentNode.removeChild(e)}if(!h.parentNode||!h.MathJax||h.MathJax.state===i.PROCESSED){a.i++;continue}if(!h.MathJax.elementJax||h.MathJax.state===i.UPDATE){this.checkScriptSiblings(h);var g=h.type.replace(/ *;(.|\s)*/,"");var j=this.inputJax[g];b=j.Process(h,a);if(typeof b==="function"){if(b.called){continue}this.RestartAfter(b)}b=b.Attach(h,j.id);this.saveScript(b,a,h,i);this.postInputHooks.Execute(b,j.id,h)}else{if(h.MathJax.state===i.OUTPUT){this.saveScript(h.MathJax.elementJax,a,h,i)}}a.i++;var c=new Date().getTime();if(c-a.start>this.processUpdateTime&&a.i<a.scripts.length){a.start=c;this.RestartAfter(MathJax.Callback.Delay(1))}}}catch(f){return this.processError(f,a,"Input")}if(a.scripts.length&&this.config.showProcessingMessages){MathJax.Message.Set(["ProcessMath","Processing math: %1%%",100],0)}a.start=new Date().getTime();a.i=a.j=0;return null},postInputHooks:MathJax.Callback.Hooks(true),saveScript:function(a,d,b,c){if(!this.outputJax[a.mimeType]){b.MathJax.state=c.UPDATE;throw Error("No output jax registered for "+a.mimeType)}a.outputJax=this.outputJax[a.mimeType][0].id;if(!d.jax[a.outputJax]){if(d.jaxIDs.length===0){d.jax[a.outputJax]=d.scripts}else{if(d.jaxIDs.length===1){d.jax[d.jaxIDs[0]]=d.scripts.slice(0,d.i)}d.jax[a.outputJax]=[]}d.jaxIDs.push(a.outputJax)}if(d.jaxIDs.length>1){d.jax[a.outputJax].push(b)}b.MathJax.state=c.OUTPUT},prepareOutput:function(c,f){while(c.j<c.jaxIDs.length){var e=c.jaxIDs[c.j],d=MathJax.OutputJax[e];if(d[f]){try{var a=d[f](c);if(typeof a==="function"){if(a.called){continue}this.RestartAfter(a)}}catch(b){if(!b.restart){MathJax.Message.Set(["PrepError","Error preparing %1 output (%2)",e,f],null,600);MathJax.Hub.lastPrepError=b;c.j++}return MathJax.Callback.After(["prepareOutput",this,c,f],b.restart)}}c.j++}return null},processOutput:function(h){var b,g=MathJax.ElementJax.STATE,d,a=h.scripts.length;try{while(h.i<a){d=h.scripts[h.i];if(!d||!d.parentNode||!d.MathJax||d.MathJax.error){h.i++;continue}var c=d.MathJax.elementJax;if(!c){h.i++;continue}b=MathJax.OutputJax[c.outputJax].Process(d,h);if(b!==false){d.MathJax.state=g.PROCESSED;if(d.MathJax.preview){d.MathJax.preview.innerHTML="";d.MathJax.preview.style.display="none"}this.signal.Post(["New Math",c.inputID])}h.i++;var e=new Date().getTime();if(e-h.start>this.processUpdateTime&&h.i<h.scripts.length){h.start=e;this.RestartAfter(MathJax.Callback.Delay(this.processUpdateDelay))}}}catch(f){return this.processError(f,h,"Output")}if(h.scripts.length&&this.config.showProcessingMessages){MathJax.Message.Set(["TypesetMath","Typesetting math: %1%%",100],0);MathJax.Message.Clear(0)}h.i=h.j=0;return null},processMessage:function(d,b){var a=Math.floor(d.i/(d.scripts.length)*100);var c=(b==="Output"?["TypesetMath","Typesetting math: %1%%"]:["ProcessMath","Processing math: %1%%"]);if(this.config.showProcessingMessages){MathJax.Message.Set(c.concat(a),0)}},processError:function(b,c,a){if(!b.restart){if(!this.config.errorSettings.message){throw b}this.formatError(c.scripts[c.i],b);c.i++}this.processMessage(c,a);return MathJax.Callback.After(["process"+a,this,c],b.restart)},formatError:function(b,f){var h=function(l,k,j,i){return MathJax.Localization._(l,k,j,i)};var e=h("ErrorMessage","Error: %1",f.message)+"\n";if(f.sourceURL||f.fileName){e+="\n"+h("ErrorFile","file: %1",f.sourceURL||f.fileName)}if(f.line||f.lineNumber){e+="\n"+h("ErrorLine","line: %1",f.line||f.lineNumber)}e+="\n\n"+h("ErrorTips","Debugging tips: use %1, inspect %2 in the browser console","'unpacked/MathJax.js'","'MathJax.Hub.lastError'");b.MathJax.error=MathJax.OutputJax.Error.Jax(e,b);if(b.MathJax.elementJax){b.MathJax.error.inputID=b.MathJax.elementJax.inputID}var g=this.config.errorSettings;var a=h(g.messageId,g.message);var c=MathJax.HTML.Element("span",{className:"MathJax_Error",jaxID:"Error",isMathJax:true,id:b.MathJax.error.inputID+"-Frame"},[["span",null,a]]);MathJax.Ajax.Require("[MathJax]/extensions/MathEvents.js",function(){var j=MathJax.Extension.MathEvents.Event,i=MathJax.Hub;c.oncontextmenu=j.Menu;c.onmousedown=j.Mousedown;c.onkeydown=j.Keydown;c.tabIndex=i.getTabOrder(i.getJaxFor(b))});var d=document.getElementById(c.id);if(d){d.parentNode.removeChild(d)}if(b.parentNode){b.parentNode.insertBefore(c,b)}if(b.MathJax.preview){b.MathJax.preview.innerHTML="";b.MathJax.preview.style.display="none"}this.lastError=f;this.signal.Post(["Math Processing Error",b,f])},RestartAfter:function(a){throw this.Insert(Error("restart"),{restart:MathJax.Callback(a)})},elementCallback:function(c,f){if(f==null&&(MathJax.Object.isArray(c)||typeof c==="function")){try{MathJax.Callback(c);f=c;c=null}catch(d){}}if(c==null){c=this.config.elements||[]}if(this.isHTMLCollection(c)){c=this.HTMLCollection2Array(c)}if(!MathJax.Object.isArray(c)){c=[c]}c=[].concat(c);for(var b=0,a=c.length;b<a;b++){if(typeof(c[b])==="string"){c[b]=document.getElementById(c[b])}}if(!document.body){document.body=document.getElementsByTagName("body")[0]}if(c.length==0){c.push(document.body)}if(!f){f={}}return{count:c.length,elements:(c.length===1?c[0]:c),callback:f}},elementScripts:function(e){var b=[];if(MathJax.Object.isArray(e)||this.isHTMLCollection(e)){for(var d=0,a=e.length;d<a;d++){var f=0;for(var c=0;c<d&&!f;c++){f=e[c].contains(e[d])}if(!f){b.push.apply(b,this.elementScripts(e[d]))}}return b}if(typeof(e)==="string"){e=document.getElementById(e)}if(!document.body){document.body=document.getElementsByTagName("body")[0]}if(e==null){e=document.body}if(e.tagName!=null&&e.tagName.toLowerCase()==="script"){return[e]}b=e.getElementsByTagName("script");if(this.msieHTMLCollectionBug){b=this.HTMLCollection2Array(b)}return b},isHTMLCollection:function(a){return("HTMLCollection" in window&&typeof(a)==="object"&&a instanceof HTMLCollection)},HTMLCollection2Array:function(c){if(!this.msieHTMLCollectionBug){return[].slice.call(c)}var b=[];for(var d=0,a=c.length;d<a;d++){b[d]=c[d]}return b},Insert:function(c,a){for(var b in a){if(a.hasOwnProperty(b)){if(typeof a[b]==="object"&&!(MathJax.Object.isArray(a[b]))&&(typeof c[b]==="object"||typeof c[b]==="function")){this.Insert(c[b],a[b])}else{c[b]=a[b]}}}return c},getTabOrder:function(a){return this.config.menuSettings.inTabOrder?0:-1},SplitList:("trim" in String.prototype?function(a){return a.trim().split(/\s+/)}:function(a){return a.replace(/^\s+/,"").replace(/\s+$/,"").split(/\s+/)})};MathJax.Hub.Insert(MathJax.Hub.config.styles,MathJax.Message.styles);MathJax.Hub.Insert(MathJax.Hub.config.styles,{".MathJax_Error":MathJax.Hub.config.errorSettings.style});MathJax.Extension={};MathJax.Hub.Configured=MathJax.Callback({});MathJax.Hub.Startup={script:"",queue:MathJax.Callback.Queue(),signal:MathJax.Callback.Signal("Startup"),params:{},Config:function(){this.queue.Push(["Post",this.signal,"Begin Config"]);if(MathJax.AuthorConfig&&MathJax.AuthorConfig.root){MathJax.Ajax.config.root=MathJax.AuthorConfig.root}if(this.params.locale){MathJax.Localization.resetLocale(this.params.locale);MathJax.Hub.config.menuSettings.locale=this.params.locale}if(this.params.config){var c=this.params.config.split(/,/);for(var b=0,a=c.length;b<a;b++){if(!c[b].match(/\.js$/)){c[b]+=".js"}this.queue.Push(["Require",MathJax.Ajax,this.URL("config",c[b])])}}this.queue.Push(["Config",MathJax.Hub,MathJax.AuthorConfig]);if(this.script.match(/\S/)){this.queue.Push(this.script+";\n1;")}this.queue.Push(["ConfigDelay",this],["ConfigBlocks",this],[function(d){return d.loadArray(MathJax.Hub.config.config,"config",null,true)},this],["Post",this.signal,"End Config"])},ConfigDelay:function(){var a=this.params.delayStartupUntil||MathJax.Hub.config.delayStartupUntil;if(a==="onload"){return this.onload}if(a==="configured"){return MathJax.Hub.Configured}return a},ConfigBlocks:function(){var c=document.getElementsByTagName("script");var b=MathJax.Callback.Queue();for(var d=0,a=c.length;d<a;d++){var e=String(c[d].type).replace(/ /g,"");if(e.match(/^text\/x-mathjax-config(;.*)?$/)&&!e.match(/;executed=true/)){c[d].type+=";executed=true";b.Push(c[d].innerHTML+";\n1;")}}return b.Push(function(){MathJax.Ajax.config.root=MathJax.Hub.config.root})},Cookie:function(){return this.queue.Push(["Post",this.signal,"Begin Cookie"],["Get",MathJax.HTML.Cookie,"menu",MathJax.Hub.config.menuSettings],[function(e){var d=e.menuSettings;if(d.locale){MathJax.Localization.resetLocale(d.locale)}var g=e.menuSettings.renderer,b=e.jax;if(g){var c="output/"+g;b.sort();for(var f=0,a=b.length;f<a;f++){if(b[f].substr(0,7)==="output/"){break}}if(f==a-1){b.pop()}else{while(f<a){if(b[f]===c){b.splice(f,1);break}f++}}b.unshift(c)}if(d.CHTMLpreview!=null){if(d.FastPreview==null){d.FastPreview=d.CHTMLpreview}delete d.CHTMLpreview}if(d.FastPreview&&!MathJax.Extension["fast-preview"]){MathJax.Hub.config.extensions.push("fast-preview.js")}if(e.menuSettings.assistiveMML&&!MathJax.Extension.AssistiveMML){MathJax.Hub.config.extensions.push("AssistiveMML.js")}},MathJax.Hub.config],["Post",this.signal,"End Cookie"])},Styles:function(){return this.queue.Push(["Post",this.signal,"Begin Styles"],["loadArray",this,MathJax.Hub.config.styleSheets,"config"],["Styles",MathJax.Ajax,MathJax.Hub.config.styles],["Post",this.signal,"End Styles"])},Jax:function(){var f=MathJax.Hub.config,c=MathJax.Hub.outputJax;for(var g=0,b=f.jax.length,d=0;g<b;g++){var e=f.jax[g].substr(7);if(f.jax[g].substr(0,7)==="output/"&&c.order[e]==null){c.order[e]=d;d++}}var a=MathJax.Callback.Queue();return a.Push(["Post",this.signal,"Begin Jax"],["loadArray",this,f.jax,"jax","config.js"],["Post",this.signal,"End Jax"])},Extensions:function(){var a=MathJax.Callback.Queue();return a.Push(["Post",this.signal,"Begin Extensions"],["loadArray",this,MathJax.Hub.config.extensions,"extensions"],["Post",this.signal,"End Extensions"])},Message:function(){MathJax.Message.Init(true)},Menu:function(){var b=MathJax.Hub.config.menuSettings,a=MathJax.Hub.outputJax,d;for(var c in a){if(a.hasOwnProperty(c)){if(a[c].length){d=a[c];break}}}if(d&&d.length){if(b.renderer&&b.renderer!==d[0].id){d.unshift(MathJax.OutputJax[b.renderer])}b.renderer=d[0].id}},Hash:function(){if(MathJax.Hub.config.positionToHash&&document.location.hash&&document.body&&document.body.scrollIntoView){var d=document.location.hash.substr(1);var f=document.getElementById(d);if(!f){var c=document.getElementsByTagName("a");for(var e=0,b=c.length;e<b;e++){if(c[e].name===d){f=c[e];break}}}if(f){while(!f.scrollIntoView){f=f.parentNode}f=this.HashCheck(f);if(f&&f.scrollIntoView){setTimeout(function(){f.scrollIntoView(true)},1)}}}},HashCheck:function(b){var a=MathJax.Hub.getJaxFor(b);if(a&&MathJax.OutputJax[a.outputJax].hashCheck){b=MathJax.OutputJax[a.outputJax].hashCheck(b)}return b},MenuZoom:function(){if(MathJax.Hub.config.showMathMenu){if(!MathJax.Extension.MathMenu){setTimeout(function(){MathJax.Callback.Queue(["Require",MathJax.Ajax,"[MathJax]/extensions/MathMenu.js",{}],["loadDomain",MathJax.Localization,"MathMenu"])},1000)}else{setTimeout(MathJax.Callback(["loadDomain",MathJax.Localization,"MathMenu"]),1000)}if(!MathJax.Extension.MathZoom){setTimeout(MathJax.Callback(["Require",MathJax.Ajax,"[MathJax]/extensions/MathZoom.js",{}]),2000)}}},onLoad:function(){var a=this.onload=MathJax.Callback(function(){MathJax.Hub.Startup.signal.Post("onLoad")});if(document.body&&document.readyState){if(MathJax.Hub.Browser.isMSIE){if(document.readyState==="complete"){return[a]}}else{if(document.readyState!=="loading"){return[a]}}}if(window.addEventListener){window.addEventListener("load",a,false);if(!this.params.noDOMContentEvent){window.addEventListener("DOMContentLoaded",a,false)}}else{if(window.attachEvent){window.attachEvent("onload",a)}else{window.onload=a}}return a},Typeset:function(a,b){if(MathJax.Hub.config.skipStartupTypeset){return function(){}}return this.queue.Push(["Post",this.signal,"Begin Typeset"],["Typeset",MathJax.Hub,a,b],["Post",this.signal,"End Typeset"])},URL:function(b,a){if(!a.match(/^([a-z]+:\/\/|\[|\/)/)){a="[MathJax]/"+b+"/"+a}return a},loadArray:function(b,f,c,a){if(b){if(!MathJax.Object.isArray(b)){b=[b]}if(b.length){var h=MathJax.Callback.Queue(),j={},e;for(var g=0,d=b.length;g<d;g++){e=this.URL(f,b[g]);if(c){e+="/"+c}if(a){h.Push(["Require",MathJax.Ajax,e,j])}else{h.Push(MathJax.Ajax.Require(e,j))}}return h.Push({})}}return null}};(function(d){var b=window[d],e="["+d+"]";var c=b.Hub,a=b.Ajax,f=b.Callback;var g=MathJax.Object.Subclass({JAXFILE:"jax.js",require:null,config:{},Init:function(i,h){if(arguments.length===0){return this}return(this.constructor.Subclass(i,h))()},Augment:function(k,j){var i=this.constructor,h={};if(k!=null){for(var l in k){if(k.hasOwnProperty(l)){if(typeof k[l]==="function"){i.protoFunction(l,k[l])}else{h[l]=k[l]}}}if(k.toString!==i.prototype.toString&&k.toString!=={}.toString){i.protoFunction("toString",k.toString)}}c.Insert(i.prototype,h);i.Augment(null,j);return this},Translate:function(h,i){throw Error(this.directory+"/"+this.JAXFILE+" failed to define the Translate() method")},Register:function(h){},Config:function(){this.config=c.CombineConfig(this.id,this.config);if(this.config.Augment){this.Augment(this.config.Augment)}},Startup:function(){},loadComplete:function(i){if(i==="config.js"){return a.loadComplete(this.directory+"/"+i)}else{var h=f.Queue();h.Push(c.Register.StartupHook("End Config",{}),["Post",c.Startup.signal,this.id+" Jax Config"],["Config",this],["Post",c.Startup.signal,this.id+" Jax Require"],[function(j){return MathJax.Hub.Startup.loadArray(j.require,this.directory)},this],[function(j,k){return MathJax.Hub.Startup.loadArray(j.extensions,"extensions/"+k)},this.config||{},this.id],["Post",c.Startup.signal,this.id+" Jax Startup"],["Startup",this],["Post",c.Startup.signal,this.id+" Jax Ready"]);if(this.copyTranslate){h.Push([function(j){j.preProcess=j.preTranslate;j.Process=j.Translate;j.postProcess=j.postTranslate},this.constructor.prototype])}return h.Push(["loadComplete",a,this.directory+"/"+i])}}},{id:"Jax",version:"2.7.1",directory:e+"/jax",extensionDir:e+"/extensions"});b.InputJax=g.Subclass({elementJax:"mml",sourceMenuTitle:["Original","Original Form"],copyTranslate:true,Process:function(l,q){var j=f.Queue(),o;var k=this.elementJax;if(!b.Object.isArray(k)){k=[k]}for(var n=0,h=k.length;n<h;n++){o=b.ElementJax.directory+"/"+k[n]+"/"+this.JAXFILE;if(!this.require){this.require=[]}else{if(!b.Object.isArray(this.require)){this.require=[this.require]}}this.require.push(o);j.Push(a.Require(o))}o=this.directory+"/"+this.JAXFILE;var p=j.Push(a.Require(o));if(!p.called){this.constructor.prototype.Process=function(){if(!p.called){return p}throw Error(o+" failed to load properly")}}k=c.outputJax["jax/"+k[0]];if(k){j.Push(a.Require(k[0].directory+"/"+this.JAXFILE))}return j.Push({})},needsUpdate:function(h){var i=h.SourceElement();return(h.originalText!==b.HTML.getScript(i))},Register:function(h){if(!c.inputJax){c.inputJax={}}c.inputJax[h]=this}},{id:"InputJax",version:"2.7.1",directory:g.directory+"/input",extensionDir:g.extensionDir});b.OutputJax=g.Subclass({copyTranslate:true,preProcess:function(j){var i,h=this.directory+"/"+this.JAXFILE;this.constructor.prototype.preProcess=function(k){if(!i.called){return i}throw Error(h+" failed to load properly")};i=a.Require(h);return i},Register:function(i){var h=c.outputJax;if(!h[i]){h[i]=[]}if(h[i].length&&(this.id===c.config.menuSettings.renderer||(h.order[this.id]||0)<(h.order[h[i][0].id]||0))){h[i].unshift(this)}else{h[i].push(this)}if(!this.require){this.require=[]}else{if(!b.Object.isArray(this.require)){this.require=[this.require]}}this.require.push(b.ElementJax.directory+"/"+(i.split(/\//)[1])+"/"+this.JAXFILE)},Remove:function(h){}},{id:"OutputJax",version:"2.7.1",directory:g.directory+"/output",extensionDir:g.extensionDir,fontDir:e+(b.isPacked?"":"/..")+"/fonts",imageDir:e+(b.isPacked?"":"/..")+"/images"});b.ElementJax=g.Subclass({Init:function(i,h){return this.constructor.Subclass(i,h)},inputJax:null,outputJax:null,inputID:null,originalText:"",mimeType:"",sourceMenuTitle:["MathMLcode","MathML Code"],Text:function(i,j){var h=this.SourceElement();b.HTML.setScript(h,i);h.MathJax.state=this.STATE.UPDATE;return c.Update(h,j)},Reprocess:function(i){var h=this.SourceElement();h.MathJax.state=this.STATE.UPDATE;return c.Reprocess(h,i)},Update:function(h){return this.Rerender(h)},Rerender:function(i){var h=this.SourceElement();h.MathJax.state=this.STATE.OUTPUT;return c.Process(h,i)},Remove:function(h){if(this.hover){this.hover.clear(this)}b.OutputJax[this.outputJax].Remove(this);if(!h){c.signal.Post(["Remove Math",this.inputID]);this.Detach()}},needsUpdate:function(){return b.InputJax[this.inputJax].needsUpdate(this)},SourceElement:function(){return document.getElementById(this.inputID)},Attach:function(i,j){var h=i.MathJax.elementJax;if(i.MathJax.state===this.STATE.UPDATE){h.Clone(this)}else{h=i.MathJax.elementJax=this;if(i.id){this.inputID=i.id}else{i.id=this.inputID=b.ElementJax.GetID();this.newID=1}}h.originalText=b.HTML.getScript(i);h.inputJax=j;if(h.root){h.root.inputID=h.inputID}return h},Detach:function(){var h=this.SourceElement();if(!h){return}try{delete h.MathJax}catch(i){h.MathJax=null}if(this.newID){h.id=""}},Clone:function(h){var i;for(i in this){if(!this.hasOwnProperty(i)){continue}if(typeof(h[i])==="undefined"&&i!=="newID"){delete this[i]}}for(i in h){if(!h.hasOwnProperty(i)){continue}if(typeof(this[i])==="undefined"||(this[i]!==h[i]&&i!=="inputID")){this[i]=h[i]}}}},{id:"ElementJax",version:"2.7.1",directory:g.directory+"/element",extensionDir:g.extensionDir,ID:0,STATE:{PENDING:1,PROCESSED:2,UPDATE:3,OUTPUT:4},GetID:function(){this.ID++;return"MathJax-Element-"+this.ID},Subclass:function(){var h=g.Subclass.apply(this,arguments);h.loadComplete=this.prototype.loadComplete;return h}});b.ElementJax.prototype.STATE=b.ElementJax.STATE;b.OutputJax.Error={id:"Error",version:"2.7.1",config:{},errors:0,ContextMenu:function(){return b.Extension.MathEvents.Event.ContextMenu.apply(b.Extension.MathEvents.Event,arguments)},Mousedown:function(){return b.Extension.MathEvents.Event.AltContextMenu.apply(b.Extension.MathEvents.Event,arguments)},getJaxFromMath:function(h){return(h.nextSibling.MathJax||{}).error},Jax:function(j,i){var h=MathJax.Hub.inputJax[i.type.replace(/ *;(.|\s)*/,"")];this.errors++;return{inputJax:(h||{id:"Error"}).id,outputJax:"Error",inputID:"MathJax-Error-"+this.errors,sourceMenuTitle:["ErrorMessage","Error Message"],sourceMenuFormat:"Error",originalText:MathJax.HTML.getScript(i),errorText:j}}};b.InputJax.Error={id:"Error",version:"2.7.1",config:{},sourceMenuTitle:["Original","Original Form"]}})("MathJax");(function(o){var h=window[o];if(!h){h=window[o]={}}var d=h.Hub;var s=d.Startup;var w=d.config;var g=document.head||(document.getElementsByTagName("head")[0]);if(!g){g=document.childNodes[0]}var b=(document.documentElement||document).getElementsByTagName("script");if(b.length===0&&g.namespaceURI){b=document.getElementsByTagNameNS(g.namespaceURI,"script")}var f=new RegExp("(^|/)"+o+"\\.js(\\?.*)?$");for(var q=b.length-1;q>=0;q--){if((b[q].src||"").match(f)){s.script=b[q].innerHTML;if(RegExp.$2){var t=RegExp.$2.substr(1).split(/\&/);for(var p=0,l=t.length;p<l;p++){var n=t[p].match(/(.*)=(.*)/);if(n){s.params[unescape(n[1])]=unescape(n[2])}else{s.params[t[p]]=true}}}w.root=b[q].src.replace(/(^|\/)[^\/]*(\?.*)?$/,"");h.Ajax.config.root=w.root;h.Ajax.params=s.params;break}}var k=navigator.userAgent;var a={isMac:(navigator.platform.substr(0,3)==="Mac"),isPC:(navigator.platform.substr(0,3)==="Win"),isMSIE:("ActiveXObject" in window&&"clipboardData" in window),isEdge:("MSGestureEvent" in window&&"chrome" in window&&window.chrome.loadTimes==null),isFirefox:(!!k.match(/Gecko\//)&&!k.match(/like Gecko/)),isSafari:(!!k.match(/ (Apple)?WebKit\//)&&!k.match(/ like iPhone /)&&(!window.chrome||window.chrome.app==null)),isChrome:("chrome" in window&&window.chrome.loadTimes!=null),isOpera:("opera" in window&&window.opera.version!=null),isKonqueror:("konqueror" in window&&navigator.vendor=="KDE"),versionAtLeast:function(y){var x=(this.version).split(".");y=(new String(y)).split(".");for(var z=0,j=y.length;z<j;z++){if(x[z]!=y[z]){return parseInt(x[z]||"0")>=parseInt(y[z])}}return true},Select:function(j){var i=j[d.Browser];if(i){return i(d.Browser)}return null}};var e=k.replace(/^Mozilla\/(\d+\.)+\d+ /,"").replace(/[a-z][-a-z0-9._: ]+\/\d+[^ ]*-[^ ]*\.([a-z][a-z])?\d+ /i,"").replace(/Gentoo |Ubuntu\/(\d+\.)*\d+ (\([^)]*\) )?/,"");d.Browser=d.Insert(d.Insert(new String("Unknown"),{version:"0.0"}),a);for(var v in a){if(a.hasOwnProperty(v)){if(a[v]&&v.substr(0,2)==="is"){v=v.slice(2);if(v==="Mac"||v==="PC"){continue}d.Browser=d.Insert(new String(v),a);var r=new RegExp(".*(Version/| Trident/.*; rv:)((?:\\d+\\.)+\\d+)|.*("+v+")"+(v=="MSIE"?" ":"/")+"((?:\\d+\\.)*\\d+)|(?:^|\\(| )([a-z][-a-z0-9._: ]+|(?:Apple)?WebKit)/((?:\\d+\\.)+\\d+)");var u=r.exec(e)||["","","","unknown","0.0"];d.Browser.name=(u[1]!=""?v:(u[3]||u[5]));d.Browser.version=u[2]||u[4]||u[6];break}}}try{d.Browser.Select({Safari:function(j){var i=parseInt((String(j.version).split("."))[0]);if(i>85){j.webkit=j.version}if(i>=538){j.version="8.0"}else{if(i>=537){j.version="7.0"}else{if(i>=536){j.version="6.0"}else{if(i>=534){j.version="5.1"}else{if(i>=533){j.version="5.0"}else{if(i>=526){j.version="4.0"}else{if(i>=525){j.version="3.1"}else{if(i>500){j.version="3.0"}else{if(i>400){j.version="2.0"}else{if(i>85){j.version="1.0"}}}}}}}}}}j.webkit=(navigator.appVersion.match(/WebKit\/(\d+)\./))[1];j.isMobile=(navigator.appVersion.match(/Mobile/i)!=null);j.noContextMenu=j.isMobile},Firefox:function(j){if((j.version==="0.0"||k.match(/Firefox/)==null)&&navigator.product==="Gecko"){var m=k.match(/[\/ ]rv:(\d+\.\d.*?)[\) ]/);if(m){j.version=m[1]}else{var i=(navigator.buildID||navigator.productSub||"0").substr(0,8);if(i>="20111220"){j.version="9.0"}else{if(i>="20111120"){j.version="8.0"}else{if(i>="20110927"){j.version="7.0"}else{if(i>="20110816"){j.version="6.0"}else{if(i>="20110621"){j.version="5.0"}else{if(i>="20110320"){j.version="4.0"}else{if(i>="20100121"){j.version="3.6"}else{if(i>="20090630"){j.version="3.5"}else{if(i>="20080617"){j.version="3.0"}else{if(i>="20061024"){j.version="2.0"}}}}}}}}}}}}j.isMobile=(navigator.appVersion.match(/Android/i)!=null||k.match(/ Fennec\//)!=null||k.match(/Mobile/)!=null)},Chrome:function(i){i.noContextMenu=i.isMobile=!!navigator.userAgent.match(/ Mobile[ \/]/)},Opera:function(i){i.version=opera.version()},Edge:function(i){i.isMobile=!!navigator.userAgent.match(/ Phone/)},MSIE:function(j){j.isMobile=!!navigator.userAgent.match(/ Phone/);j.isIE9=!!(document.documentMode&&(window.performance||window.msPerformance));MathJax.HTML.setScriptBug=!j.isIE9||document.documentMode<9;MathJax.Hub.msieHTMLCollectionBug=(document.documentMode<9);if(document.documentMode<10&&!s.params.NoMathPlayer){try{new ActiveXObject("MathPlayer.Factory.1");j.hasMathPlayer=true}catch(m){}try{if(j.hasMathPlayer){var i=document.createElement("object");i.id="mathplayer";i.classid="clsid:32F66A20-7614-11D4-BD11-00104BD3F987";g.appendChild(i);document.namespaces.add("m","http://www.w3.org/1998/Math/MathML");j.mpNamespace=true;if(document.readyState&&(document.readyState==="loading"||document.readyState==="interactive")){document.write('<?import namespace="m" implementation="#MathPlayer">');j.mpImported=true}}else{document.namespaces.add("mjx_IE_fix","http://www.w3.org/1999/xlink")}}catch(m){}}}})}catch(c){console.error(c.message)}d.Browser.Select(MathJax.Message.browsers);if(h.AuthorConfig&&typeof h.AuthorConfig.AuthorInit==="function"){h.AuthorConfig.AuthorInit()}d.queue=h.Callback.Queue();d.queue.Push(["Post",s.signal,"Begin"],["Config",s],["Cookie",s],["Styles",s],["Message",s],function(){var i=h.Callback.Queue(s.Jax(),s.Extensions());return i.Push({})},["Menu",s],s.onLoad(),function(){MathJax.isReady=true},["Typeset",s],["Hash",s],["MenuZoom",s],["Post",s.signal,"End"])})("MathJax")}};
//
// 2D vectors
//
// (c) Lauri Savioja, 2016
//


"use strict";

function log10(x) {
    return Math.log(x)/Math.LN10;
}

function roundToNdigits(x, N) {
    var scaler = Math.floor(log10(x)) + 1;
    scaler = Math.pow(10,scaler-N);
    x = x/scaler;
    x = Math.round(x);
    x = x*scaler;
    return x;
}

function toDeg(a) {
    return 180*a/M_PI;
}

//
// Vec2 class for 2D vector operations
//
function Vec2(x, y) {
    if (y == undefined) {
	this.x = x.x;
	this.y = x.y;
    } else {
	this.x = x;
	this.y = y;
    }
}


function getDir(p0, p1) {
    var d = new Vec2(p1);
    d.sub(p0);
    return d;
}

function getNormal(p0, p1) {
    var d = getDir(p0, p1);
    return new Vec2(d.y, -d.x);
}

Vec2.prototype.set = function(x,y){
    if (y == undefined) {
        this.x = x.x;
        this.y = x.y;
    } else {
        this.x = x;
        this.y = y;
    }
};

Vec2.prototype.setUnitVector = function(ang){
    this.x = Math.cos(ang);
    this.y = Math.sin(ang);
};

Vec2.prototype.scale = function(s) {
    this.x = this.x*s;
    this.y = this.y*s;
};

Vec2.prototype.add = function(v2) {
    this.x = this.x + v2.x;
    this.y = this.y + v2.y;
};

function vec2Add(v1, v2) {
    var v=new Vec2(v1);
    v.add(v2);
    return v;
}

Vec2.prototype.sub = function(v2) {
    this.x = this.x - v2.x;
    this.y = this.y - v2.y;
};

// Distances and lengths are internally represented in an internal coordinate system
Vec2.prototype.len = function() {
    return(Math.sqrt(this.x*this.x + this.y*this.y));
};

Vec2.prototype.normalize = function() {
    var l=this.len();
    this.scale(1/l);
};

Vec2.prototype.relativeScale = function(p, s) {
    this.sub(p);
    this.scale(s);
    this.add(p);
};

Vec2.prototype.distance = function(v) {
    var dx = this.x- v.x;
    var dy = this.y- v.y;
    return(Math.sqrt(dx*dx + dy*dy));
};

// The internally represented speed of sound has a value of 1 spatial unit in 1 temporal unit.
// I wouldn't dare to touch this constant, as it's value is assumed to be one elsewhere (GA_receiver).
var speedOfSound = 1;

Vec2.prototype.timeOfFlight = function(dest) {
    var v;
    if (dest)
        v = getDir(this, dest);
    else
        v = this;
    return (v.len() / speedOfSound);
};

Vec2.prototype.scaleToTime = function(t) {
    this.normalize();
    this.scale(t * speedOfSound);
};

Vec2.prototype.dot = function(v2) {
    return this.x*v2.x + this.y*v2.y;
};

// Reflect 'this' against line going through center and having normalized direction l
Vec2.prototype.reflect = function(l, center) {
    var v = getDir(center, this);
    var v_dot_l = v.dot(l);
    var r = new Vec2(l);
    r.scale(2*v_dot_l);
    r.sub(v);
    r.add(center);
    return r;
};

// Intersection of two lines of form l = p + t*s
// returns t for line: p1 + t*s1
function intersect(p0, s0, p1, s1) {
    var scaler = s0.x*s1.y - s1.x*s0.y;
    if(scaler == 0){
        return null; //Lines are parallel
    }else{
        return (s0.x*(p0.y - p1.y) - s0.y*(p0.x - p1.x)) / scaler
    }
}

function intersectionPoint(p0, s0, p1, s1) {
    var t=intersect(p0, s0, p1, s1);
    var ip = new Vec2(s1);
    ip.scale(t);
    ip.add(p1);
    return ip;
}

function segmentsIntersect(p0, s0, p1, s1, mult) {
    var eps = mult * EPS;
    var t = intersect(p0, s0, p1, s1);
    if ((t>eps) && (t<(1-eps))) {
        t = intersect(p1, s1, p0, s0);
        if ((t > eps) && (t < (1-eps)))
            return true;
    }
    return false;
}

function getLineOrientation(p0, p1) {
    return Math.atan2(p1.y - p0.y, p1.x - p0.x);
}

Vec2.prototype.inFrontOfPlane = function(c, norm) {
    var pointToCenter = getDir(this, c);
    return (pointToCenter.dot(norm) < 0);
};

Vec2.prototype.print = function(txt) {
    console.log(txt + " = [" + this.x + "," + this.y + "]");
};

module.exports = {
    ARTshoot,
    AirAbs,
    BRDF,
    DirectionalResponse,
    GA,
    PolarDensity,
    Ray,
    RealLifeParams,
    Receiver,
    SampledResponse,
    Sector
}
