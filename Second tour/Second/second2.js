var __interpretation_started_timestamp__;
var pi = 3.141592653589793;

var rMotor = brick.motor(M3);
var lMotor = brick.motor(M4);
var lastUsedStop = true;

var lSens = brick.sensor(A1);
var rSens = brick.sensor(A2);
var fSens = brick.sensor(D1);
var bSens = brick.sensor(D2);
var ultrasonicSens = 150;
var infaredSens = 80;
    
var rEnc = brick.encoder(E3);
var lEnc = brick.encoder(E4);

var gyroP = 0.0001; //0.00005
var setSpeedGyro = 5;

var moveP = 0.05; // 0.005
var encoderAbsolut = 0;

var nesserationAngle = [180, 270, 360, 90];
var nowAngle = 0;
var lastAngle = 0;
var indent = 175;
var notNeedToGoIndent = false;

//var distanceToNextCeil = 1430/2;
var distanceToNextCeil = 715; 
var ceilWidth = 35;
var sensErr = 5;
var diametr = 5.6;
//var distanceToNextCeil = 374*(ceilWidth/(pi*diametr));

var mapSize = (16 + 2)*2;
var map;
var x;
var y;
var mask;
var background = "■"//"💘";

var absolutX = -1;
var absolutY = -1;
var countX = 0;
var countY = 0;
var startInResearchedX = -1;
var startInResearchedY = -1;

var READY = 0;
var ALERT = 0;

var main = function() {
    __interpretation_started_timestamp__ = Date.now();
    
    //script.wait(5000);
    calibrateGyro();
    setStartPoint();

    
    map = makeEmptyMap(mapSize, mapSize);
    
    //while(setMotion(100, 100) != -1){ }
    
    
    while(true){
        researchCeil();
        if(!whereNext()) break;
        mapAnalysis();
        if (READY != 0) break;
        //if (ALERT != 0) break;
    }
    
    print("finish");
    if(READY == 0){
        answ(READY, map);
    } else {
        brick.display().addLabel(READY, 0, 0);
        brick.display().redraw();
    }
    //brick.print("FINISH");
    return;
}

function answ(inp, arr){
    return map[inp-1][inp-1];
}

// ------------ Map analis ------------- //

function analysisAxis(startColumn, column, startRaw, row, orientation){
    var matrix = [];
    for(var i = 0; i < column; i++){
        matrix[i] = background;
    }
    var count = 0;
    var startInResearched = -1;
    for(var i = 0; i < column; i++){
        var visit = 0;
        var visitAll = 0; 
        var wall = 0;
        for(var j = 0; j < row; j++){
            var tx = orientation == 0 ? i + startColumn : j + startRaw;
            var ty = orientation == 0 ? j + startRaw : i + startColumn;
            if (map[tx][ty] === "X" || map[tx][ty] === " "){
                if(map[tx][ty] === "X") {
                    visit = 1;
                    if (startInResearched == -1){
                        startInResearched = i;
                    }
                }
                visitAll++;
            } else if (map[tx][ty] === "|" || map[tx][ty] === "-"){
                wall++;
            }
        }
        count += visit;
        if (visitAll == 15){
            matrix[i] = "X";
        } else if (wall > 0){
            matrix[i] = "|";
        } else{
            matrix[i] = background;
        }
    }
    return [count, startInResearched, matrix];
}

function mapAnalysis(){
    if (!(countX == 15 && countY == 15)){
        var xAnalysis = analysisAxis(0, map.length, 0, map[0].length, 0);
        var yAnalysis = analysisAxis(0, map[0].length, 0, map.length, 1);
        countX = xAnalysis[0];
        countY = yAnalysis[0];
        print("X projection ", xAnalysis[2], " ", countX);
        print("Y projection ", yAnalysis[2], " ", countY);
        if(countX == 15 && countY == 15){
            startInResearchedX = xAnalysis[1];
            startInResearchedY = yAnalysis[1];
        }
        print("starts ", startInResearchedX, " ", startInResearchedY);
    } else {
        var xAnalysis = analysisAxis(startInResearchedX, countX, startInResearchedY, countY, 0);
        var yAnalysis = analysisAxis(startInResearchedY, countY, startInResearchedX, countX, 1);
        print("X projection ", xAnalysis[2], " ", countX);
        print("Y projection ", yAnalysis[2], " ", countY);
        print("starts ", startInResearchedX, " ", startInResearchedY);
        var firstRes =  projectionAnalysis(xAnalysis[2]);
        if (firstRes == -1) return;
        var res = projectionAnalysis(yAnalysis[2], firstRes);
        if(res != -1){
            print("RESULT: ", res*ceilWidth);
            READY = res*ceilWidth;
            //script.wait(5000);
        }
    }
}

function projectionAnalysis(researched, lastValue){
    var distantionForWall = [researched.lastIndexOf("|") != -1 ? researched.indexOf("|") + 1 : -1, researched.lastIndexOf("|") != -1 ? 15 - researched.lastIndexOf("|") : -1];
    var distantionForUnsearched = [researched.lastIndexOf(background) != -1 ? researched.indexOf(background) + 1 : -1, researched.lastIndexOf(background) != -1 ? 15 - researched.lastIndexOf(background) : -1];
    //print(distantionForWall, " ", distantionForUnsearched);
    
    var nowValue = [/*researched.lastIndexOf("|") == researched.indexOf("|") ? -1 :*/ Math.min.apply(null, distantionForWall), Math.min.apply(null, distantionForUnsearched) == -1 ? 16 : Math.min.apply(null, distantionForUnsearched)];
    print(nowValue);
    if (lastValue == undefined){
        return nowValue;
    } else {
        if (!(nowValue[0] == -1 && lastValue[0] == -1) && ((nowValue[1] >= nowValue[0] && lastValue[1] >= nowValue[0] || 
                                                                (nowValue[1] >= lastValue[0]) && lastValue[1] >= lastValue[0]))){
            return Math.min(lastValue[0], nowValue[0]);
        } else {
            return -1;
        }
    }
}


//-------------------- Исследование лабиринта --------------------------//

function printMap(arr){
    for(var i = arr.length - 1; i >= 0; i--){
        var temp = "".concat(i + (i > 9 ? "*" : "* "));
        for(var j = 0; j < arr[i].length; j++){
            //temp = temp.concat(arr[i][j] + ((arr[i][j] + "").length > 1 ? " " : "  "));
            temp = temp.concat(arr[i][j]);
        }
        print(temp);
    }
}

function makeEmptyMap(height, width){
    var map = [];
    for(var i = 0; i < height; i ++){
        map[i] = [];
        for(var j = 0; j < height; j++){
             map[i][j] = background;
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

/*function drawAround(value, position, maximum){
    var flag= false;
    if(value == undefined){
        flag = true;
    }
    var count =  Math.floor(value / (ceilWidth + sensErr));
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
        if(count < Math.floor(maximum / (ceilWidth + sensErr))){
            map[x+tx*(2*count + 1)][y+ty*(2*count + 1)] = (tx != 0 ? "-" : "|");
            
            //-- для дорисовывания предполагаемых стенок --//
        
            map[x+tx*(2*count + 1 + 6)][y+ty*(2*count + 1 + 6)] = (tx != 0 ? "-" : "|");
        } else {
            count = Math.floor(maximum / (ceilWidth + sensErr));
        }
        
        for(var i = count; i >= 1; i--){
            map[x+tx*2*i][y+ty*2*i] = map[x+tx*2*i][y+ty*2*i] != "X" /*&& map[x+tx*(2*i + 1)][y+ty*(2*i + 1)] == "X"*//* ? " " : "X";
            map[x+tx*(2*i-1)][y+ty*(2*i-1)] = map[x+tx*(2*i)][y+ty*(2*i)] != "X" ? " " : "X";
        }
    } else {
        if( map[x+2*tx][y+2*ty] == "X"){
            map[x+tx][y+ty] = "X";
        }
    }
}*/

function drawAroundForThis(value, position, maximum, arr){
    var flag= false;
    if(value == undefined){
        flag = true;
    }
    var count =  Math.floor(value / (ceilWidth + sensErr));
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
        if(count < Math.floor(maximum / (ceilWidth + sensErr))){
            map[x+tx*(count + 1)][y+ty*(count + 1)] = (tx != 0 ? "-" : "|");
            
            //-- для дорисовывания предполагаемых стенок --//
        
            map[x+tx*(count + 1 + 2)][y+ty*(count + 1 + 2)] = (tx != 0 ? "-" : "|");
        } else {
            count = Math.floor(maximum / (ceilWidth + sensErr));
        }
        
        for(var i = count; i >= 1; i--){
            map[x+tx*i][y+ty*i] = map[x+tx*i][y+ty*i] != "X" ? (map[x+tx*i][y+ty*i] == background ? " " : map[x+tx*i][y+ty*i]) : "X";
            if(map[x+tx*i][y+ty*i] == ' '){
                var tempCount = 0;
                for(var j = 0; j < 4; j++){
                    var ti = (nowAngle + j) % 4;
                    ttx = (1 - ti) % 2;
                    tty = (2 - ti) % 2;
                    if(map[x+tx*i + ttx][y+ty*i + tty] != " " && map[x+tx*i + ttx][y+ty*i + tty] != "X"){
                        break;
                    }
                    tempCount++;
                }
                if(tempCount == 4){
                    map[x+tx*i][y+ty*i] = "X";
                }
            }
            
        }
    } else {
    }
}

function researchCeil(){    
    map[x][y] = "X";
    drawAroundForThis(lSens.read(), 3, infaredSens, map);
    drawAroundForThis(rSens.read(), 1, infaredSens, map);
    drawAroundForThis(fSens.read(), 0, ultrasonicSens, map);
    drawAroundForThis(bSens.read(), 2, ultrasonicSens, map);
    //print(fSens.read());
    //drawAround(undefined, 2);   // для заполения крестиками промежутков стенок при отсутствии заднего датчика
    printMap(map);
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
        if(map[x + tx][y + ty] === " "){
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
        going();
        /*x += 2*((1 - nowAngle) % 2);
        y += 2*((2 - nowAngle) % 2);*/
        //print("Coords ", x, " ", y)
    } else{
        if(!moveToRequiredCeil()){
            return false;
        }
    }
    return true;
    
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
                        if(mask[row + tx][col + ty] === " "){
                            mask[row + tx][col + ty] = counter + 1;
                            lastCounter = counter; 
                        }
                        if(tag == undefined){
                            if(/*(row + 2*tx) % 4 == 0 && (col + 2*ty) % 4 == 0 &&*/ String(map[row + tx][col + ty]) == ' '){
                                /*print("Near ", map[row + 2*tx][col + 2*ty]);
                                print("****** it near ", row + 2*tx, " ", col + 2*ty);*/
                                near_flag = true;
                                return [row + tx, col + ty];
                            }
                        } else {
                            if(row + tx == tag[0] && col + ty == tag[1] && mask[row + tx][col + ty] === " "){
                                /*print("Near ", map[row + 2*tx][col + 2*ty]);
                                print("****** it near ", row + 2*tx, " ", col + 2*ty);*/
                                near_flag = true;
                                return [row + tx, col + ty];
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
            if(parseInt(mask[xi + tx][yi + ty]) == count-1){
                xi += tx;
                yi += ty;
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
    if (toNextCeil() != -1){
        x += ((1 - nowAngle) % 2);
        y += ((2 - nowAngle) % 2);
    }
    
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

//------ New my ideas about motion -----//


function checkWall(){
    return fSens.read() > ceilWidth;
}

function researchCeilPosition(){
    x += ((1 - nowAngle) % 2);
    y += ((2 - nowAngle) % 2);
    researchCeil();
}

function going(){
    //researchCeilPosition();
    var lastCountResearchedCeil = 0;
    while(checkWall()){
        if(setMotion(100, 100) == -1){
            script.wait(0.5);
            break;
        }
        var nowCountResearchedCeil = Math.floor((rEnc.readRawData() - encoderAbsolut) / distanceToNextCeil);
        //print("nowCountResearchedCeil ", nowCountResearchedCeil, " ", (rEnc.readRawData() - encoderAbsolut));
        if(lastCountResearchedCeil < nowCountResearchedCeil){
            //print(nowCountResearchedCeil, " last ", lastCountResearchedCeil);
            researchCeilPosition();
            lastCountResearchedCeil = nowCountResearchedCeil;
            //printMap(map);
            //print(map[x +  2*((1 - nowAngle) % 2)][y + 2*((2 - nowAngle) % 2)]);
            if(map[x +  ((1 - nowAngle) % 2)][y + ((2 - nowAngle) % 2)] != " ") break;
        }
    }
    //stop();
    //researchCeil();
    //printMap(map);
    //print(encoderAbsolut);
    
    var needEncoder = encoderAbsolut;
    print("last enc ", needEncoder, " encAbsolut " , encoderAbsolut);
    if(Math.abs(lastCountResearchedCeil*distanceToNextCeil - (rEnc.readRawData() - encoderAbsolut)) > Math.abs((lastCountResearchedCeil + 1)*distanceToNextCeil - (rEnc.readRawData() - encoderAbsolut))){
        needEncoder += (lastCountResearchedCeil + 1)*distanceToNextCeil;
        researchCeilPosition();
    } else {
        needEncoder += (lastCountResearchedCeil)*distanceToNextCeil;
    }
    encoderAbsolut = rEnc.readRawData();
    
    print("x ", (x - Math.ceil(mapSize / 2)), " y ", (y - Math.ceil(mapSize / 2)));
    print("count ", lastCountResearchedCeil, " ", encoderAbsolut - needEncoder);
    print("before ", encoderAbsolut, " ",  needEncoder);
    setMoving((needEncoder - encoderAbsolut) + indent);
    notNeedToGoIndent = true;
    print("after ", encoderAbsolut, " ",  rEnc.readRawData());
    
    /*if(!((x - Math.ceil(mapSize / 2)) % 4 == 0 && (y - Math.ceil(mapSize / 2)) % 4 == 0)){
        script.wait(1000);
        print("rev");
        //print("before ", encoderAbsolut, " ",  rEnc.readRawData());
        //encoderAbsolut -= distanceToNextCeil;
        x -= 2*((1 - nowAngle) % 2);
        y -= 2*((2 - nowAngle) % 2);
        //print("recalculate ", encoderAbsolut);
        setMoving(-distanceToNextCeil);
        //print("after ", encoderAbsolut);
        script.wait(1000);
    }*/
}

//---------------------------------------//


function turnTo(count) {
    print("turning");
    if(count == undefined) count = 1;
    if(notNeedToGoIndent)
        notNeedToGoIndent = false;
    else
        setMoving(indent);
        
    //print("*", nowAngle);
    if(count > 0){
        nowAngle += count;
        nowAngle = Math.abs(nowAngle % 4);
        setMotion(100, -100, true, true);
    }else{
        nowAngle += count;
        if(nowAngle < 0)
            nowAngle = 4 + nowAngle % 4;
        setMotion(-100, 100, true, true);
    }
    //print("next angle ", nowAngle);
    script.wait(100);       // костыль для перескока пограничных ситуаций
    lastAngle = gyro();

    while (checkAnglePosition(count > 0)) {
        var resultSpeed;
        if(count > 0){
            resultSpeed = setSpeedGyro * gyroP * (nesserationAngle[nowAngle] * 1000 - gyro()) + 1;
        } else if(count < 0){
            resultSpeed = setSpeedGyro * gyroP * ((nesserationAngle[nowAngle]%360) * 1000 - gyro()) - 1;
        }
        setMotion(resultSpeed, -resultSpeed, true, true);
        script.wait(0.3);
    }
    
    //print(gyro(), " ", nesserationAngle[nowAngle]*1000);
    
    stop();
    setStartPoint();
    setMoving(-indent, undefined, true);
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
    /*lMotor.brake(100);
    rMotor.brake(100);*/
    lMotor.setPower(0);
    rMotor.setPower(0);
    lastSpeedValue = 0; // для обнуления счётчика плавного пуска
}

function encReset(){
    rEnc.reset();
    lEnc.reset();
}

var lastTime = -1.0;
var lastMotionValue = 0.0;

var lastSpeedValue = 0;

function setMotion(lPower, rPower, noCheck, noReg){
    if (noReg == undefined || !noReg){
        if(lastSpeedValue < lPower){
            //print(lastSpeedValue);
            lastSpeedValue++;
        }
    } else{
        lastSpeedValue = 0;
    }
    lMotor.setPower(lastSpeedValue != 0 ? lastSpeedValue : lPower);
    rMotor.setPower(lastSpeedValue != 0 ? lastSpeedValue : rPower);
    
    
    var nowTime = script.time() / 100;
    var nowMotionValue = rEnc.readRawData();
    if(noCheck) {
        lastTime = -1;
        lastMotionValue = 0;
    } else if (noCheck == undefined){
        //print("in ", nowTime - lastTime, " ", nowTime, " ", lastTime);
        if(nowTime - lastTime >= 1){
            var V = Math.abs(nowMotionValue - lastMotionValue)/(nowTime - lastTime)
            //print(V);
            if(V == 0 && lastTime != -1){
                //ALERT = 1;
                print("ALERT ", V);
                moveBack();
                return -1;
            }
            lastTime = nowTime;
            lastMotionValue = nowMotionValue;
        }
    }
}

function setMoving(distance, setSpeed, illusion){
    if (typeof(setSpeed)==='undefined') setSpeed = 50;
    encoderAbsolut += distance;
    if (illusion) return;
    
    var flag= false;
    if (distance > 0){
        while(rEnc.readRawData() <= encoderAbsolut){
            var resultSpeed = setSpeed*moveP * (encoderAbsolut - rEnc.readRawData()) + 10;
            if(setMotion(resultSpeed, resultSpeed) == -1){
                flag = true;
                break;
            }
            script.wait(0.5);
        }
    } else if (distance < 0){
        while(rEnc.readRawData() >= encoderAbsolut){
            var resultSpeed = setSpeed*moveP * (Math.abs(rEnc.readRawData() - encoderAbsolut)) + 10;
            //print(Math.abs(rEnc.readRawData() - encoderAbsolut));
            if(setMotion(-resultSpeed, -resultSpeed) == -1){
                flag = true;
                break;
            }
            script.wait(0.5);
        }
    }
    //print(rEnc.readRawData()-encoderAbsolut, " ", distance);
    stop();
    lastSpeedValue = 0; // для обнуления счётчика плавного пуска
    if(flag)
        return -1;
}

function toNextCeil(count){
    if (typeof(count)==='undefined') count = 1;
    return setMoving(distanceToNextCeil*count /* + !notNeedToGoIndent ? indent : 0*/);
    //notNeedToGoIndent = true;
}

function moveBack(){
    setSpeed = 50;
    while(fSens.readRawData() <= ceilWidth){
        var resultSpeed = setSpeed*moveP * (ceilWidth - fSens.readRawData()) + 10;
        setMotion(-resultSpeed, -resultSpeed, true, true);
        script.wait(0.5);
    }
    stop();
    setStartPoint();
    //print("x: ", x, " y: ", y);
    notNeedToGoIndent = false;
}