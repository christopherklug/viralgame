/*
	Set up canvas.
*/
var CANVAS_WIDTH = $('body').width() / 2;
var CANVAS_HEIGHT = $('body').height();
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
var diff = document.documentElement.clientHeight - CANVAS_HEIGHT;


var gcounter = 0;
var stateCount = {uninfected: 0, infected: 0, healed: 0, dead: 0, freeBeds: 0, diedBecauseOfNoBed: 0}

var stateProxy = new Proxy(stateCount, {
	set: function (target, key, value) {
		target[key] = value;

		var outputStatUninfected = document.getElementById("statUninfected");
		outputStatUninfected.innerHTML = stateCount.uninfected

		var outputStatInfected = document.getElementById("statInfected");
		outputStatInfected.innerHTML = stateCount.infected

		var outputStatHealed = document.getElementById("statHealed");
		outputStatHealed.innerHTML = stateCount.healed

		var outputStatDied = document.getElementById("statDied");
		outputStatDied.innerHTML = stateCount.dead

		var outputStatFreeBeds = document.getElementById("statFreeBeds");
		outputStatFreeBeds.innerHTML = stateCount.freeBeds

		return true;
	}
  });


/*
	Minimum Priority Queue (MinPQ) constructor
*/
function MinPQ () {
	this.heap = [null];
	this.n = 0;

	// MinPQ API
	this.insert = function (key) {
		this.heap.push(key);
		this.swim(++this.n);
		//console.log('inserted, n=' + this.n);
		//console.log(this.heap);
	};
	this.viewMin = function () {
		if (this.n < 1) {
			return null;
		}
		return this.heap[1];
	}
	this.delMin = function () {
		if (this.n < 1) {
			throw new Error('Called delMin() on empty MinPQ');
		}
		//console.log('delete min, n=' + this.n)
		this.exch(1, this.n--);
		var deleted = this.heap.pop();
		this.sink(1);
		return deleted;
	};
	this.isEmpty = function () {
		return (this.n === 0);
	};

	// Heap helpers
	this.swim = function (k) {
		var j = Math.floor(k/2);
		while (j > 0 && this.less(k, j)) {
			this.exch(j, k);
			k = j;
			j = Math.floor(k/2);
		}
	};
	this.sink = function (k) {
		var j = 2*k;
		while (j <= this.n) {
			if (j < this.n && this.less(j+1, j)) { j++; }
			if (this.less(k, j)) { break; }
			this.exch(j, k);
			k = j;
			j = 2*k;
		}
	};

	// Array compare and exchange
	this.less = function (i, j) {
		// Note: this is particular to the SimEvent object.
		//console.log(this.heap[i]);
		//console.log(this.heap[j]);
		return this.heap[i].time < this.heap[j].time;
	};
	this.exch = function (i, j) {
		var swap = this.heap[i];
		this.heap[i] = this.heap[j];
		this.heap[j] = swap;
	};
}


/*
	Ball constructor
*/
function Ball (posX, posY, velX, velY, r, recoveryTime, hospitalTime) {
	this.p = {x: posX, y: posY};
	this.v = {x: velX, y: velY};
	this.r = r;
	this.healtimer = recoveryTime;
	this.hospitaltimer = hospitalTime;

	var s = 0 // 0:uninfected, 1:infected, 2:healed, 3: dead, 4:hospital
	//s meint den Status des punktes (infiziert/nichtinfiziert)

	var m = Math.ceil(Math.PI*r*r);


	// Basic move/draw
	this.move = function (dt) {
		if(this.s!=3 && this.s!=4){
			this.p.x = this.p.x + this.v.x*dt;
			this.p.y = this.p.y + this.v.y*dt;
		}
	};

	this.draw = function () {

		if(this.s == 1){
			this.healtimer-=1;
			if(this.healtimer==0){
				stateProxy.infected = parseInt(stateProxy.infected) - parseInt(1)
				if(Math.random()*100<parseInt(sliderNeededHospital.value)) {
					if(stateProxy.freeBeds>0)
					{
						stateProxy.freeBeds = parseInt(stateProxy.freeBeds) - parseInt(1)
						this.s = 4
					}
					else
					{
						stateProxy.dead = parseInt(stateProxy.dead) + parseInt(1)
						stateProxy.diedBecauseOfNoBed = parseInt(stateProxy.diedBecauseOfNoBed) + parseInt(1)
						this.s = 3
					}
				}
				else
				{
					this.s = 2;
					stateProxy.healed = parseInt(stateProxy.healed) + parseInt(1);
				}
			}
		}else
		{
			if(this.s == 4) {
				this.hospitaltimer-=1;
				if(this.hospitaltimer==0)
				{
					stateProxy.freeBeds = parseInt(stateProxy.freeBeds) + parseInt(1)
					if(Math.random()*100<parseInt(sliderDeathRate.value)) {
						stateProxy.dead = parseInt(stateProxy.dead) + parseInt(1)
						this.s = 3
					}
					else
					{
						this.s = 2;
						stateProxy.healed = parseInt(stateProxy.healed) + parseInt(1);
					}
				}
			}
		}

		ctx.beginPath();
		if(this.s==4)
		{
			ctx.rect(this.p.x, this.p.y-this.r, this.r, this.r*3)
			ctx.rect(this.p.x-this.r, this.p.y, this.r*3, this.r)
		}
		else
		{
			ctx.arc(this.p.x, this.p.y, this.r, 0, 2*Math.PI);
		}

		//die Farbe ist unterschiedlich je nach Status

		switch(this.s) {
			case 0:
				ctx.fillStyle = "black";
				break;
			case 1:
				ctx.fillStyle = "#CC0000";
				break;
			case 2:
				ctx.fillStyle = "green";
				break;
			case 3:
				ctx.fillStyle = "#ab1bb5";
				break;
			case 4:
				ctx.fillStyle = "red";
		}

		ctx.fill();
	};

	// Equality comparator
	this.equals = function (ball) {
		return (
			this.p.x === ball.p.x &&
			this.p.y === ball.p.y &&
			this.v.x === ball.v.x &&
			this.v.y === ball.v.y &&
			this.r === ball.r
		);
	};

	// Collision prediction
	this.timeToHit = function (ball) {
		if (this.equals(ball)) { return Number.POSITIVE_INFINITY; }
		var dpx = ball.p.x - this.p.x;
		var dpy = ball.p.y - this.p.y;
		var dvx = ball.v.x - this.v.x;
		var dvy = ball.v.y - this.v.y;
		var dpdv = dvx*dpx + dvy*dpy;
		if (dpdv > 0) { return Number.POSITIVE_INFINITY; }
		var dvdv = dvx*dvx + dvy*dvy;
		var dpdp = dpx*dpx + dpy*dpy;
		var R = ball.r + this.r;
		var D = dpdv*dpdv - dvdv*(dpdp - R*R);
		if (D < 0) { return Number.POSITIVE_INFINITY; }
		//console.log('Predicted: ' + (-(dpdv + Math.sqrt(D))/dvdv) )
		return ( -(dpdv + Math.sqrt(D))/dvdv );
	};
	this.timeToHitVerticalWall = function () {
		if (this.v.x === 0) { return Number.POSITIVE_INFINITY; }
		if (this.v.x > 0) {
			return ((CANVAS_WIDTH - this.r - this.p.x)/this.v.x);
		}
		return ((this.r - this.p.x)/this.v.x);
	};
	this.timeToHitHorizontalWall = function () {
		if (this.v.y === 0) { return Number.POSITIVE_INFINITY; }
		if (this.v.y > 0) {
			return ((CANVAS_HEIGHT - this.r - this.p.y)/this.v.y);
		}
		return ((this.r - this.p.y)/this.v.y);
	};

	// Collision resolution
	// simplified (physically not correct!)
	this.bounceOff = function (ball) {
		this.v.x  = -this.v.x;
		this.v.y  = -this.v.y;
		ball.v.x  = -ball.v.x;
		ball.v.y  = -ball.v.y;

		//wenn ein Infizierter einen anderen berührt, wird dieser ebenfalls infiziert
		if(ball.s==1&&this.s==0){
			this.s=1;
			stateProxy.infected = parseInt(stateProxy.infected) + parseInt(1);
			stateProxy.uninfected = parseInt(stateProxy.uninfected) - parseInt(1);
		}

		if(this.s==1&&ball.s==0){
			ball.s=1;
			stateProxy.infected = parseInt(stateProxy.infected) + parseInt(1);
			stateProxy.uninfected = parseInt(stateProxy.uninfected) - parseInt(1);
		}
	};
	this.bounceOffVerticalWall = function () {
		this.v.x = -this.v.x;
	};
	this.bounceOffHorizontalWall = function () {
		this.v.y = -this.v.y;
	};
}

/*
	SimEvent constructor
	---
	Accepts 2 Ball objects a and b.
	If FIRST one is null, that means vertical wall collision.
	If SECOND is null, that means horizontal wall collision.
*/
function SimEvent (time, a, b) {
	this.time = time;
	this.a = a;
	this.b = b;
	this.compareTo = function (simEvent) {
		return this.time - simEvent.time;
	};
	this.isValid = function (simTime) {
		// Note: toFixed(4) is used to avoid potential floating-point
		// accuracy errors
		var log = '';
		// Note: this check forces only one event at a given instant
		if (this.time < simTime) {
			log += 'Event precedes simulation time';
			//console.log(log);
			return false;
		}
		if (a === null) { //vertical wall
			log += 'Validating vertical wall.\n';
			log += 'Event time: ' + this.time.toFixed(4) + ', Fresh time: ' + (simTime +  b.timeToHitVerticalWall()).toFixed(4) + '\n'
			//console.log(log);
			return this.time.toFixed(4) === (simTime + b.timeToHitVerticalWall()).toFixed(4);
		} else if (b === null) { //horizontal wall
			log += 'Validating vertical wall.\n';
			log += 'Event time: ' + this.time.toFixed(4) + ', Fresh time: ' + (simTime +  a.timeToHitVerticalWall()).toFixed(4) + '\n';
			//console.log(log);
			return this.time.toFixed(4) === (simTime + a.timeToHitHorizontalWall()).toFixed(4);
		} else { //particle-particle
			log += 'Validating two-particle.\n';
			log += 'Event time: ' + this.time.toFixed(4) + ', Fresh time: ' + (simTime +  a.timeToHit(b)).toFixed(4) + '\n';
			//console.log(log);
			return this.time.toFixed(4) === (simTime + a.timeToHit(b)).toFixed(4);
		}
	};

	///
	/// TEMP FOR DEBUGGING:
	///
	this.type = function () {
		if (a === null) { return 'vertical wall'; }
		if (b === null) { return 'horizontal wall'; }
		return 'ball';
	};
}


/*
	Sim constructor
*/
function Sim (balls) {
	if (balls == null) {
		throw new Error('Sim constructor requires array of balls');
	}
	for (var i = 0; i < balls.length; i++) {
		if (balls[i] == null) {
			throw new Error('Invalid ball passed to Sim constructor');
		}
	}

	this.time = 0;
	this.balls = balls;
	this.pq = new MinPQ();

	this.predictAll = function (ball) {
		if (ball == null) { return; }
		var dt;
		for (var i = 0; i < this.balls.length; i++) {
			//
			//
			// Uncomment this once the wall collisions are working,
			// AND isValid() is complete.
			//
			//

			dt = ball.timeToHit(balls[i]);
			if (!isFinite(dt) || dt <= 0) { continue; }
			this.pq.insert(new SimEvent(this.time + dt, ball, balls[i]));
			//console.log('Ball event inserted');

		}
		dt = ball.timeToHitVerticalWall();
		if (isFinite(dt) && dt > 0) {
			//console.log('Vert event inserted');
			this.pq.insert(new SimEvent(this.time + dt, null, ball));
		}
		dt = ball.timeToHitHorizontalWall();
		if (isFinite(dt) && dt > 0) {
			//console.log('Horiz event inserted');
			this.pq.insert(new SimEvent(this.time + dt, ball, null));
		}
	};
	this.predictBalls = function (ball) {
		if (ball == null) { return; }
		var dt;
		for (var i = 0; i < this.balls.length; i++) {
			//
			//
			// Uncomment this once the wall collisions are working,
			// AND isValid() is complete.
			//
			//

			dt = ball.timeToHit(balls[i]);
			if (!isFinite(dt) || dt <= 0) { continue; }
			this.pq.insert(new SimEvent(this.time + dt, ball, balls[i]));

		}
	};
	this.predictVerticalWall = function (ball) {
		if (ball == null) { return; }
		var dt = ball.timeToHitVerticalWall();
		if (isFinite(dt) && dt > 0) {
			//console.log('Vert event inserted');
			this.pq.insert(new SimEvent(this.time + dt, null, ball));
		}
	};
	this.predictHorizontalWall = function (ball) {
		if (ball == null) { return; }
		var dt = ball.timeToHitHorizontalWall();
		if (isFinite(dt) && dt > 0) {
			//console.log('Horiz event inserted');
			this.pq.insert(new SimEvent(this.time + dt, ball, null));
		}
	};

	for (var i = 0; i < this.balls.length; i++) {
		this.predictAll(this.balls[i]);
	}

	this.redraw = function () {
		ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		for (var i = 0; i < this.balls.length; i++) {
			balls[i].draw();

		}
		gcounter+=1;
	};

	// 'Increment' the simulation by time dt
	this.simulate = function (dt) {
		var simLog = 'Start time: ' + this.time + '\n';
		var end = this.time + dt;
		var minEvent;
		var inc;

		var counter = 0;
		while (!this.pq.isEmpty()) {
			// Check min event time. If outside time window, break.
			// Otherwise, delete it. If not valid, continue.
			// Otherwise, process the event.
			minEvent = this.pq.viewMin();
			if (minEvent.time >= end) {
				simLog += 'No events in time window (min time: ' + minEvent.time + ')';
				break;
			}
			this.pq.delMin();
			if (!minEvent.isValid(this.time)) {
				simLog += 'Invalid event: ' + minEvent.type() + '\n';
				continue;
			}

			simLog += 'Valid event: ' + minEvent.type() + '; ';
			inc = minEvent.time - this.time;
			for (var i = 0; i < this.balls.length; i++) {
				this.balls[i].move(inc);
			}
			this.time = minEvent.time;

			var a = minEvent.a;
			var b = minEvent.b;
			if (a !== null && b !== null) {
				a.bounceOff(b);
				simLog += 'Bounced off particle\n';
				this.predictAll(a);
				this.predictAll(b);
			}
			else if (a === null && b !== null) {
				b.bounceOffVerticalWall();
				simLog += 'Bounced off vertical\n';
				this.predictBalls(b);
				this.predictVerticalWall(b);
			}
			else {
				a.bounceOffHorizontalWall();
				simLog += 'Bounced off horizontal\n';
				this.predictBalls(a);
				this.predictHorizontalWall(a);
			}

			/// TEMPORARY COUNTER
			/// for debugging
			/*counter++;
			if (counter > 5) {
				console.log(simLog);
				throw new Error('killed event process loop after ' + counter + ' executions');
			}*/
		}

		inc = end - this.time;
		for (var i = 0; i < this.balls.length; i++) {
			this.balls[i].move(inc);
		}
		this.time = end;

		//console.log(simLog);
	};
}


/*
	Generating initial states
*/
var cl = CANVAS_WIDTH;
function validateNewBall (balls, ball) {
	if (	ball.p.x - ball.r <= 0 || ball.p.x + ball.r >= CANVAS_WIDTH
		 ||	ball.p.y - ball.r <= 0 || ball.p.y + ball.r >= CANVAS_HEIGHT)
		{ return false; }
	var dx;
	var dy;
	var r;
	for (var i = 0; i < balls.length; i++) {
		dx = balls[i].p.x - ball.p.x;
		dy = balls[i].p.y - ball.p.y;
		r = balls[i].r + ball.r;
		if (dx*dx + dy*dy <= r*r) { return false; }
	}
	return true;
}
function posNeg () {
	return Math.pow(-1, Math.floor(Math.random()*2));
}
function generateBalls (params) {
	var balls = [];
	var newBall;
	var badBallCounter = 0;
	var infectedCreated = 0;
	var fixedCreated = 0;

	var partFixed = Math.floor((params.populationFixed/params.n)*params.infected)
	var partMobile = params.infected-partFixed

	for (var i = 0; i < params.n; i++) {
		var min=0;
		var max=params.velocity;
		var vx = Math.random() * (+max - +min) + +min;
		var vy = Math.sqrt(Math.pow(params.velocity,2))

		if(fixedCreated < params.populationFixed )
		{
			newBall = new Ball(
				Math.floor(Math.random()*CANVAS_WIDTH),
				Math.floor(Math.random()*CANVAS_HEIGHT),
				0,
				0,
				params.r,
				params.recoveryTime,
				params.hospitalTime
			);

			if (validateNewBall(balls, newBall)) {
				if(infectedCreated<partFixed) {
					infectedCreated++
					newBall.s = 1
				}else
				{
				newBall.s=0
				}
				fixedCreated++
				balls.push(newBall);
				badBallCounter = 0;
			} else {
				if (++badBallCounter > 99) {
					console.log('Too many bad balls in random ball generator');
					return [];
				}
				i--;
			}
		}
		else
		{
			newBall = new Ball(
				Math.floor(Math.random()*CANVAS_WIDTH),
				Math.floor(Math.random()*CANVAS_HEIGHT),
				posNeg()*Math.floor(vx),
				posNeg()*Math.floor(vy),
				params.r,
				params.recoveryTime,
				params.hospitalTime
			);
			if (validateNewBall(balls, newBall)) {
				if(infectedCreated<params.infected) {
					infectedCreated++
					newBall.s = 1
				}else
				{
				newBall.s=0
				}
				balls.push(newBall);
				badBallCounter = 0;
			} else {
				if (++badBallCounter > 99) {
					console.log('Too many bad balls in random ball generator');
					return [];
				}
				i--;
			}
		}
	}
	return balls;
}


/*
	Running the simulation
*/

var ms = 30;
var dt = ms/1000;
var balls = [];
var sim;

function makeSim (populationSize, populationFixed, infectedSize, velocity, freeBeds, recoveryTime, hospitalTime) {
	stateProxy.infected = infectedSize
	stateProxy.healed = 0
	stateProxy.dead = 0
	stateProxy.uninfected = populationSize-infectedSize;
	stateProxy.freeBeds = freeBeds;
	stateProxy.diedBecauseOfNoBed = 0;

	balls = generateBalls({
		style: 'random',
		n: populationSize,
		r: 5,
		velocity: velocity,
		infected: infectedSize,
		recoveryTime: recoveryTime,
		hospitalTime: hospitalTime,
		populationFixed: populationFixed
	})

	sim = new Sim(balls);
}

var interval, intervalActive;
function activateInterval () {
	if (!intervalActive) {
		interval = window.setInterval(runSim, ms);
		intervalActive = true;
	}
}
function deactivateInterval () {
	window.clearInterval(interval);
	intervalActive = false;
}

function runSim () {
	sim.redraw();
	try {
		sim.simulate(dt);
	} catch (e) {
		console.log(e);
		window.clearInterval(interval);
	}
}

var sliderPopulation = document.getElementById("populationRange");
var outputPopulation = document.getElementById("populationSize");
outputPopulation.innerHTML = sliderPopulation.value;
sliderPopulation.oninput = function() {
	outputPopulation.innerHTML = this.value;
  }

var sliderPopulationFixed = document.getElementById("populationFixedRange");
var outputPopulationFixed = document.getElementById("populationFixed");
outputPopulationFixed.innerHTML = sliderPopulationFixed.value;
sliderPopulationFixed.oninput = function() {
	outputPopulationFixed.innerHTML = this.value;
  }

var sliderInfected = document.getElementById("infectedRange");
var outputInfected = document.getElementById("infectedSize");
outputInfected.innerHTML = sliderInfected.value;
sliderInfected.oninput = function() {
	outputInfected.innerHTML = this.value;
  }

var sliderVelocity = document.getElementById("velocityRange");
var outputVelocity = document.getElementById("velocity");
outputVelocity.innerHTML = sliderVelocity.value;
sliderVelocity.oninput = function() {
	outputVelocity.innerHTML = this.value;
}

var sliderHospital = document.getElementById("hospitalRange");
var outputHospital = document.getElementById("hospital");
outputHospital.innerHTML = sliderHospital.value;
sliderHospital.oninput = function() {
	outputHospital.innerHTML = this.value;
}

var sliderNeededHospital = document.getElementById("neededHospitalRange");
var outputNeededHospital = document.getElementById("neededHospital");
outputNeededHospital.innerHTML = sliderNeededHospital.value;
sliderNeededHospital.oninput = function() {
	outputNeededHospital.innerHTML = this.value;
}

var sliderDeathRate = document.getElementById("deathRateRange");
var outputDeathRate = document.getElementById("deathRate");
outputDeathRate.innerHTML = sliderDeathRate.value;
sliderDeathRate.oninput = function() {
	outputDeathRate.innerHTML = this.value;
}

var sliderRecoveryTime = document.getElementById("recoveryTimeRange");
var outputRecoveryTime = document.getElementById("recoveryTime");
outputRecoveryTime.innerHTML = sliderRecoveryTime.value;
sliderRecoveryTime.oninput = function() {
	outputRecoveryTime.innerHTML = this.value;
}

var sliderHospitalTime = document.getElementById("hospitalTimeRange");
var outputHospitalTime = document.getElementById("hospitalTime");
outputHospitalTime.innerHTML = sliderHospitalTime.value;
sliderHospitalTime.oninput = function() {
	outputHospitalTime.innerHTML = this.value;
}

makeSim(parseInt(sliderPopulation.value), parseInt(sliderPopulationFixed.value), parseInt(sliderInfected.value), parseInt(sliderVelocity.value),parseInt(sliderHospital.value), parseInt(sliderRecoveryTime.value), parseInt(sliderHospitalTime.value) );
sim.redraw();

$('#stop').on('click', deactivateInterval);
$('#start').on('click', activateInterval);
$('#new').on('click', function () {
	deactivateInterval();
	makeSim(parseInt(sliderPopulation.value), parseInt(sliderPopulationFixed.value), parseInt(sliderInfected.value), parseInt(sliderVelocity.value),parseInt(sliderHospital.value), parseInt(sliderRecoveryTime.value), parseInt(sliderHospitalTime.value) );
	sim.redraw();
});
