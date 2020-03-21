/*
	Set up canvas.
*/
var CANVAS_LENGTH = 580;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
canvas.width = CANVAS_LENGTH;
canvas.height = CANVAS_LENGTH;
var diff = document.documentElement.clientHeight - CANVAS_LENGTH;
canvas.style.marginTop = '20px';


var gcounter = 0;

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
function Ball (posX, posY, velX, velY, r, m) {
	this.p = {x: posX, y: posY};
	this.v = {x: velX, y: velY};
	this.r = r;
	this.healtimer = 200;

	//s meint den Status des punktes (infiziert/nichtinfiziert)
	var sick = Math.random()


	//5% sind infiziert
	if(sick<0.05){
		this.s=1;
	}
	else{
		this.s=0;
	}


	if (m != undefined) {
		this.m = m;
	} else {
		this.m = Math.ceil(Math.PI*r*r);
	}

	// Basic move/draw
	this.move = function (dt) {



		this.p.x = this.p.x + this.v.x*dt;
		this.p.y = this.p.y + this.v.y*dt;
	};
	this.draw = function () {

		if(this.s == 1){
			this.healtimer-=1;
			if(this.healtimer<=0){
				this.s = 2;
			}
		}


		ctx.beginPath();
		ctx.arc(this.p.x, this.p.y, this.r, 0, 2*Math.PI);


		//die Farbe ist unterschiedlich je nach Status

		switch(this.s) {
		  case 0:
		    ctx.fillStyle = "black";
		    break;
			case 1:
				ctx.fillStyle = "red";
				break;
			case 2:
				ctx.fillStyle = "green";
				break;
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
			return ((CANVAS_LENGTH - this.r - this.p.x)/this.v.x);
		}
		return ((this.r - this.p.x)/this.v.x);
	};
	this.timeToHitHorizontalWall = function () {
		if (this.v.y === 0) { return Number.POSITIVE_INFINITY; }
		if (this.v.y > 0) {
			return ((CANVAS_LENGTH - this.r - this.p.y)/this.v.y);
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


		if(ball.s==1&&this.s!=2){
			this.s=1;
		}

		if(this.s==1&&ball.s!=2){
			ball.s=1;
		}
		/*if(ball.s==1){
			if(this.s=0){
				this.s=1;
			}
		}

		if(this.s==1){
			if(ball.s=0){
				ball.s=1;
			}
		}*/

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
		ctx.clearRect(0, 0, CANVAS_LENGTH, CANVAS_LENGTH);
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
var cl = CANVAS_LENGTH;
function validateNewBall (balls, ball) {
	if (	ball.p.x - ball.r <= 0 || ball.p.x + ball.r >= cl
		 ||	ball.p.y - ball.r <= 0 || ball.p.y + ball.r >= cl)
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
	var speed = 30;
	var badBallCounter = 0;
	for (var i = 0; i < params.n; i++) {
		if (params.r) {
			newBall = new Ball(
				Math.floor(Math.random()*cl),
				Math.floor(Math.random()*cl),
				posNeg()*Math.floor(Math.random()*speed),
				posNeg()*Math.floor(Math.random()*speed),
				params.r
			);
		} else {
			newBall = new Ball(
				Math.floor(Math.random()*cl),
				Math.floor(Math.random()*cl),
				posNeg()*Math.floor(Math.random()*100),
				posNeg()*Math.floor(Math.random()*100),
				2 + Math.floor(Math.random()*29)
			);
		}
		if (validateNewBall(balls, newBall)) {
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
	return balls;
}


/*
	Running the simulation
*/

var ms = 30;
var dt = ms/1000;
var balls = [];
var sim;
var population = 200;

function makeSim () {
	balls = generateBalls({
		style: 'random',
		n: population,
		r: 5})

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

makeSim();
sim.redraw();

$('#stop').on('click', deactivateInterval);
$('#start').on('click', activateInterval);
$('#new').on('click', function () {
	deactivateInterval();
	sim.redraw();
});
