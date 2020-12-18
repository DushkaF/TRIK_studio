var __interpretation_started_timestamp__;
var pi = 3.141592653589793;

var rMotor = brick.motor(M3);
var lMotor = brick.motor(M4);

var lSens = brick.sensor(D1);

var normSpeed = 70;
var normDist = 20/(1/Math.sqrt(2));


var kp = 1.0;
var kd = 0.25;
var ki = 0.00000001;
var prevErr = 0;
var prevTime = 0;
var I = 0;

var main = function()
{
	__interpretation_started_timestamp__ = Date.now();
	brick.marker().down("blue");
	while(1){
		motion();
	}
	print("Hell");
	return;
}

function motion(){
	var err = getError();
	setMotion(normSpeed+err, normSpeed-err);
	script.wait(10);
}


function getError(){
	var dist = lSens.read();
	var time = script.time();
	var err = normDist - dist;
	var dt = time-prevTime;
	var D = (err - prevErr)*dt;
	I += dt*err;
	prevErr = err;
	prevTime = time;
	return kp*err + D*kd + ki*I;
}

function setMotion(lPower, rPower){
    lMotor.setPower(lPower);
    rMotor.setPower(rPower);
}