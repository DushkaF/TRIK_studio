var __interpretation_started_timestamp__;
var pi = 3.141592653589793;

var rMotor = brick.motor(M3);
var lMotor = brick.motor(M4);


var lSens = brick.sensor(A3);
var rSens = brick.sensor(A2);
var fSens = brick.sensor(A1);
//var bSens = brick.sensor(A3);
    
var rEnc = brick.encoder(E3);
var lEnc = brick.encoder(E4);

var gyroP = 0.0005; //0.00005
var setSpeedGyro = 10;

var moveP = 0.05; // 0.005
var encoderAbsolut = 0;

var nesserationAngle = [180, 270, 360, 90];
var nowAngle = 0;
var lastAngle = 0;

var distanceToNextCell = 1430;

var map;
var x;
var y;
var mask;

var absolutX = -1;
var absolutY = -1;

var main = function() {
    __interpretation_started_timestamp__ = Date.now();

    calibrateGyro();
    setStartPoint();

    var finishAbsolut = readInput();
    map = makeEmptyMap(37, 37);
    
    /*for(var i = 3; i >= 0; i--)
        turnToRequiredAngle(i);
    */
   
    researchFirstCell();
    
    while(true){
        researchCell();
        if(!whereNext()) break;
    }
    
    definitionAbsolutCoords();
    //print(absolutX, " ", absolutY);
    var finish = convertAbsolutCoordsToOurSystem([x, y], [absolutX, absolutY], finishAbsolut, 0);
    moveToRequiredCeil(finish);
    
    print("finish");
    brick.display().addLabel("finish", 0, 0);
    brick.display().redraw();
    //brick.print("FINISH");
    return;
}


//-------------------- Исследование лабиринта --------------------------//

function printMap(arr){
    for(var i = arr.length - 1; i >= 0; i--){
        var temp = "".concat(i + (i > 9 ? "*" : "* "));
        for(var j = 0; j < arr[i].length; j++){
            temp = temp.concat(arr[i][j] + ((arr[i][j] + "").length > 1 ? " " : "  "));
        }
        print(temp);
    }
}

function makeEmptyMap(height, width){
    var map = [];
    for(var i = 0; i < height; i ++){
        map[i] = [];
        for(var j = 0; j < height; j++){
             map[i][j] = "■";
        }
    }
    
    /*
     y----------->
    x
    |
    |
    |
    V
    */
   
    x = Math.ceil(height / 2);
    y = Math.ceil(width / 2);
    map[x][y] = "X";
    return map;
}

function drawAround(wall, position){
    var flag= false;
    if(wall == undefined){
        flag = true;
    }
    position = (nowAngle + position) % 4;
    var tx = 0;
    var ty = 0;
    switch(position){
        case 0:
            tx = 1;
            break;
        case 1:
            ty = 1;
            break;
        case 2:
            tx = -1;
            break;
        case 3:
            ty = -1;
            break;
    }
    if(!flag){
        if(!wall){
            map[x+2*tx][y+2*ty] = map[x+2*tx][y+2*ty] != "X" ? " " : "X";
        }
        map[x+tx][y+ty] = wall ? (tx != 0 ? "-" : "|") : map[x+2*tx][y+2*ty] != "X" ? " " : "X";
    } else{
        if( map[x+2*tx][y+2*ty] == "X"){
            map[x+tx][y+ty] = "X";
        }
    }
    
}

function definitionAbsolutCoords(){     //----------- ПЕРЕДЕЛАТЬ ДЛЯ ДРУГОГО НАПРАВЛЕНИЯ. НЕ УНИВЕРСАЛЬНА! ----------------//
    if(absolutX < 0){
        var matrixX = [];
        var count = 0;
        for(var i = 0; i < map.length; i++){
            var visit = 0;
            for(var j = 0; j < map[i].length; j++){
                if (map[i][j] === "X"){
                    visit = 1;
                }
            }
            count += visit;
            matrixX[i] = visit;
        }
        if(count == (8*2-1)){
            for(var i = 1; i <= x; i+=2){
                if(matrixX[i] == 1){
                    absolutX++;
                }
            }
            //print("X: ", absolutX);
        }
    }
    if(absolutY < 0){
        var matrixY = [];
        for(var i = 0; i < map[0].length; i++){
            matrixY[i] = 0;
        }
        var count = 0;
        for(var i = 0; i < map.length; i++){
            for(var j = 0; j < map[i].length; j++){
                if (map[i][j] === "X" && matrixY[j] == 0){
                    matrixY[j] = 1;
                    count++;
                }
            }
        }
        if(count == (8*2-1)){
            for(var i = 1; i <= y; i+=2){
                if(matrixY[i] == 1){
                    absolutY++;
                }
            }
            //print("Y: ", absolutY);
        }
    }
}

function researchFirstCell(){
    turnToRequiredAngle(1);
    researchCell();
    turnToRequiredAngle(0);
}

function researchCell(){    
    map[x][y] = "X";
    drawAround(lSens.read() <= 70, 3);
    drawAround(rSens.read() <= 70, 1);
    drawAround(fSens.read() <= 70, 0);
    //drawAround(bSens.read() <= 70, 2);
    drawAround(undefined, 2);   // для заполения крестиками промежутков стенок
    //printMap(map);
}

function whereNext(){
    var tx;
    var ty;
    var flag = false;
    var angle;
    for(var i = 0; i < 4; i++){
        var ti = (nowAngle + i) % 4
        tx = (1 - ti) % 2;
        ty = (2 - ti) % 2;
        if(map[x + tx][y + ty] === " " && map[x + 2*tx][y + 2*ty] === " "){
            //print("I go to ", tx + x, " ", ty + y, " ", map[x + 2*tx][y + 2*ty]);
            flag = true;
            angle = ti; 
            break;
        }
    }
    if(flag == true){
        //print("Angle need ", angle, " now ", nowAngle);
        if(nowAngle != angle){
            turnToRequiredAngle(angle);
        }
        toNextCell();
        x += 2*((1 - nowAngle) % 2);
        y += 2*((2 - nowAngle) % 2);
        //print("Coords ", x, " ", y)
    } else{
        if(!moveToRequiredCeil()){
            return false;
        }
    }
    return true;
    
}

function convertAbsolutCoordsToOurSystem(nowCoords, nowAbsolutCoords, needAbsolutCoords, direction){
    var tx = ((1 - direction) % 2)*(needAbsolutCoords[0] - nowAbsolutCoords[0]) + ((2 - direction) % 2)*(needAbsolutCoords[1] - nowAbsolutCoords[1]);
    var ty = ((1 - direction) % 2)*(needAbsolutCoords[1] - nowAbsolutCoords[1]) + ((2 - direction) % 2)*(needAbsolutCoords[0] - nowAbsolutCoords[0]);
    return [nowCoords[0]+tx*2, nowCoords[1]+ty*2]; 
}

function moveToRequiredCeil(coords){
    mask = map.map(function(arr) {
        return arr.slice();
    });
    for(var i = 0; i < mask.length; i++){
        for(var j = 0; j < mask[i].length; j++){
            if(mask[i][j] === "X"){
                mask[i][j] = " ";
            }
        }
    }
    mask[x][y] = 0;
    
    //printMap(mask);
    
    var end_coords = findRequiredCeil(coords);
    if (end_coords == undefined){
        return false;
    }
    var way = tracing(end_coords);
    
    //printMap(mask);
    
    while(way.length > 0){
        var ceilCoord = way.pop();
        goToNearCeil(ceilCoord[0], ceilCoord[1]);
    }
    
    return true;
}

function findRequiredCeil(tag){
    var counter = 0;
    var lastCounter = 0;
    var near_flag = false;
    while(true){
        for(var row  = 0; row  < mask.length; row++){
            for(var col = 0; col < mask[row].length; col++){
                //print(parseInt(mask[row][col]));
                if(parseInt(mask[row][col]) == counter && !near_flag){
                    for(var i = 0; i < 4; i++){
                        tx = (1 - i) % 2;
                        ty = (2 - i) % 2;
                        //print(i, " ", tx, ty, " ", mask[row + tx][col + ty], " ", mask[row + 2*tx][col + 2*ty]);
                        if(mask[row + tx][col + ty] === " " && mask[row + 2*tx][col + 2*ty] === " "){
                            mask[row + 2*tx][col + 2*ty] = counter + 1;
                            lastCounter = counter; 
                        }
                        if(tag == undefined){
                            if(String(map[row + 2*tx][col + 2*ty]) == ' ' && mask[row + tx][col + ty] === " "){
                                /*print("Near ", map[row + 2*tx][col + 2*ty]);
                                print("****** it near ", row + 2*tx, " ", col + 2*ty);*/
                                near_flag = true;
                                return [row + 2*tx, col + 2*ty];
                            }
                        } else {
                            if(row + 2*tx == tag[0] && col + 2*ty == tag[1] && mask[row + tx][col + ty] === " "){
                                /*print("Near ", map[row + 2*tx][col + 2*ty]);
                                print("****** it near ", row + 2*tx, " ", col + 2*ty);*/
                                near_flag = true;
                                return [row + 2*tx, col + 2*ty];
                            }
                        }
                       
                    }
                }
            }
        }
        if(counter != lastCounter || near_flag){
            break;
        }
        counter++;
    }
    return;
}

function tracing(coords){
    var count = mask[coords[0]][coords[1]];
    var xi = coords[0];
    var yi = coords[1];
    var way = [];
    //print("empty ", coords);
    while(count > 0){
        way.push([xi, yi]);
        for(var i = 0; i < 4; i++){
            var ti = (nowAngle + i) % 4
            var tx = (1 - ti) % 2;
            var ty = (2 - ti) % 2;
            //print(xi + 2*tx, " ", yi + 2*ty, " ", parseInt(mask[xi + 2*tx][yi + 2*ty]));
            if(parseInt(mask[xi + 2*tx][yi + 2*ty]) == count-1){
                xi += 2*tx;
                yi += 2*ty;
                //print("next ", xi, " ", yi);
                count--;
                break;
            }
        }
    }
    /*print("it is way");
    for(var i = 0; i < way.length; i++){
        print("way ", way[i]);
    }*/
    return way;
}

function goToNearCeil(xi, yi){
    var angle = 0;
    if(x - xi < 0){
        angle = 0;
    } else if (x - xi > 0){
        angle = 2;
    } else if (y - yi < 0){
        angle = 1;
    } else if (y - yi > 0){
        angle = 3;
    }
    //print("Angle need ", angle, " now ", nowAngle);
    if(nowAngle != angle){
        turnToRequiredAngle(angle);
    }
    toNextCell();
    x += 2*((1 - nowAngle) % 2);
    y += 2*((2 - nowAngle) % 2);
    
    if(absolutX >= 0){
        absolutX +=((1 - nowAngle) % 2);
    }
    if(absolutY >= 0){
        absolutY +=((2 - nowAngle) % 2);
    }
}

// -------------- Mooving ------------ //

function calibrateGyro() {
    brick.gyroscope().calibrate(2000);
    script.wait(2000);
}

function setStartPoint(){
    encoderAbsolut = rEnc.readRawData();
}

function gyro() {
    return (brick.gyroscope().read()[6] + 180000);
}

function checkAnglePosition(dir){
    var angle = gyro();
    
    var result;
    if(dir){
        result = angle < nesserationAngle[nowAngle]*1000 && angle - lastAngle >= 0;
    }else{
        result = angle > (nesserationAngle[nowAngle]%360)*1000 && angle - lastAngle <= 0;
    }
    if (result) 
        stop();
    lastAngle = angle;
    return result;
}


function turnTo(count) {
    if(count == undefined) count = 1;
    var indent = 175;
    setMoving(indent);
    //print("*", nowAngle);
    if(count > 0){
        nowAngle += count;
        nowAngle = Math.abs(nowAngle % 4);
        setMotion(100, -100);
    }else{
        nowAngle += count;
        if(nowAngle < 0)
            nowAngle = 4 + nowAngle % 4;
        setMotion(-100, 100);
    }
    //print("next angle ", nowAngle);
    script.wait(100);
    lastAngle = gyro();

    while (checkAnglePosition(count > 0)) {
        var resultSpeed;
        if(count > 0){
            resultSpeed = setSpeedGyro * gyroP * (nesserationAngle[nowAngle] * 1000 - gyro()) + 1;
        } else if(count < 0){
            resultSpeed = setSpeedGyro * gyroP * ((nesserationAngle[nowAngle]%360) * 1000 - gyro()) - 1;
        }
        setMotion(resultSpeed, -resultSpeed);
        script.wait(0.5);
    }
    
    //print(gyro(), " ", nesserationAngle[nowAngle]*1000);
    
    stop();
    setStartPoint();
    setMoving(-indent);
    //encReset();
}

function turnToRequiredAngle(needAngle){
    //print("I want turn to ", needAngle, ", now is ", nowAngle);
    if(Math.abs(needAngle - nowAngle) == 2){
        //print("diametr");
        if(needAngle - nowAngle < 0 || needAngle == 2){
            turnTo(2);
        } else{
            turnTo(-2);
        }
    } else if((needAngle - nowAngle > 0 && !(nowAngle == 0 && needAngle == 3)) || (needAngle - nowAngle < 0 && needAngle == 0 && nowAngle == 3)){
        //print("right");
        turnTo();
    } else if((needAngle - nowAngle < 0 && !(nowAngle == 3 && needAngle ==0)) || (needAngle - nowAngle > 0 && needAngle == 3 && nowAngle == 0)){
        //print("left");
        turnTo(-1);
    }
}

function stop(){
    lMotor.brake(100);
    rMotor.brake(100);
}

function encReset(){
    rEnc.reset();
    lEnc.reset();
}

function setMotion(lPower, rPower){
    lMotor.setPower(lPower);
    rMotor.setPower(rPower);
}

function setMoving(distance, setSpeed){
    if (typeof(setSpeed)==='undefined') setSpeed = 50;
    encoderAbsolut += distance;
    if(distance > 0){
        while(rEnc.readRawData() <= encoderAbsolut){
            var resultSpeed = setSpeed*moveP * (encoderAbsolut - rEnc.readRawData()) + 10;
            setMotion(resultSpeed, resultSpeed);
            script.wait(0.5);
        }
    } else if(distance < 0){
        //print("in");
        while(rEnc.readRawData() >= encoderAbsolut){
            var resultSpeed = setSpeed*moveP * (Math.abs(rEnc.readRawData() - encoderAbsolut)) + 10;
            //print(Math.abs(rEnc.readRawData() - encoderAbsolut));
            setMotion(-resultSpeed, -resultSpeed);
            script.wait(0.5);
        }
    }
    //print(rEnc.readRawData()-encoderAbsolut, " ", distance);
    stop();
}

function toNextCell(count){
    if (typeof(count)==='undefined') count = 1;
    setMoving(distanceToNextCell*count);
    //additionalMoving(distanceToNextCell*count);
}