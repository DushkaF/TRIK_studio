var __interpretation_started_timestamp__;
var pi = 3.141592653589793;

var rMotor = brick.motor(M3);
var lMotor = brick.motor(M4);

var lSens = brick.sensor(A2);
var rSens = brick.sensor(A1);
var fSens = brick.sensor(D1);
var bSens = brick.sensor(D2);
    
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

var main = function() {
    __interpretation_started_timestamp__ = Date.now();

    calibrateGyro();
    setStartPoint();

    readInput();
    map = makeEmptyMap(37, 37);
    
    /*for(var i = 3; i >= 0; i--)
        turnToRequiredAngle(i);
    */
    
    while(true){
        researchCell();
        if(!whereNext()) break;
    }
    
    print("Hell");
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
    x = Math.ceil(height / 2);
    y = Math.ceil(width / 2);
    map[x][y] = "X";
    return map;
}

function drawAround(wall, position){
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
     if(!wall){
            map[x+2*tx][y+2*ty] = map[x+2*tx][y+2*ty] != "X" ? " " : "X";
    }
    map[x+tx][y+ty] = wall ? (tx != 0 ? "-" : "|") : map[x+2*tx][y+2*ty] != "X" ? " " : "X";
}

function researchCell(){
    drawAround(lSens.read() <= 70, 3);
    drawAround(rSens.read() <= 70, 1);
    drawAround(fSens.read() <= 70, 0);
    drawAround(bSens.read() <= 70, 2);
    map[x][y] = "X";
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
        if(map[x + tx][y + ty] === " " && map[x + 2*tx][y + 2*ty] === " "){
            print("I go to ", tx + x, " ", ty + y, " ", map[x + 2*tx][y + 2*ty]);
            flag = true;
            angle = ti; 
            break;
        }
    }
    if(flag == true){
        print("Angle need ", angle, " now ", nowAngle);
        if(nowAngle != angle){
            turnToRequiredAngle(angle);
        }
        toNextCell();
        x += 2*((1 - nowAngle) % 2);
        y += 2*((2 - nowAngle) % 2);
        //print("Coords ", x, " ", y)
    } else{
        waveTracing();
    }
    return true;
    
}

function waveTracing(){
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
    printMap(mask);
    var way = tracing(findAdjacentCeil());
    //print("Length of way is ", way.length);
    printMap(mask);
    while(way.length > 0){
        var ceilCoord = way.pop();
        print(ceilCoord[0], " ", ceilCoord[1]);
        goToNearCeil(ceilCoord[0], ceilCoord[1]);
    }
}

function findAdjacentCeil(){
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
                        //print(i, " ", tx, ty, " ", mask[row + tx][col + ty]);
                        if(mask[row + tx][col + ty] === " " && mask[row + 2*tx][col + 2*ty] === " "){
                            mask[row + 2*tx][col + 2*ty] = counter + 1;
                            lastCounter = counter;
                        }
                        if(String(map[row + 2*tx][col + 2*ty]) == ' '){
                            //print("****** it near");
                            near_flag = true;
                            return [row + 2*tx, col + 2*ty];
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
}

// -------- ArTag -------- //

function rawToBoolean(raw, length, width) {
    var blackWhiteArTag = [];
    for (var i = 0; i < width; i++) {
        blackWhiteArTag[i] = [];
        for (var j = 0; j < length; j++) {
            var pixel = raw[i * length + j];
            var monoColor = function(pixel) {
                if (Math.floor((parseInt(pixel.substring(0, 2), 16) + parseInt(pixel.substring(2, 4), 16) + parseInt(pixel.substring(4, 6), 16)) / 3) > 128) //Высчитываем "тон", среднее по всем каналам
                    return 0;
                else
                    return 1;
            };
            blackWhiteArTag[i][j] = monoColor(pixel);
        }
    }
    return blackWhiteArTag;
}

function getDistance(start, end) {
    return Math.sqrt(Math.pow((start[0] - end[0]), 2) + Math.pow((start[1] - end[1]), 2));
}

function findCorner(matrix, start, value) {
    var minWay = getDistance([0, 0], [matrix.length, matrix[0].length]);
    var corner = [];
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix[0].length; j++) {
            if (matrix[i][j] == value) {
                var lengthToThis = getDistance(start, [i, j]);
                if (minWay > lengthToThis) {
                    minWay = lengthToThis;
                    corner = [i, j];
                }
            }
        }
    }
    return corner;
}

function cutLine(cordA, cordB, lambda) {
    cordC = [];
    for (var i = 0; i < 2; i++) {
        cordC[i] = Math.floor((cordA[i] + lambda * cordB[i]) / (lambda + 1));
    }
    return cordC;
}

function getMidPixelColor(matrix, center, radius) {
    var sum = 0;
    for (var i = center[0] - radius; i <= center[0] + radius; i++) {
        for (var j = center[1] - radius; j <= center[1] + radius; j++) {
            sum += matrix[i][j];
        }
    }
    return (sum / Math.pow(2 * radius + 1, 2));
}

function readPixelFromArTag(matrix, size, border, radius) {
    var rawArTag = [];
    var row = [];
    row[0] = [border[0], border[1]];
    row[size] = [border[2], border[3]];
    for (var i = 0; i < size; i++) { // бежим по строкам
        if (row[i + 1] == undefined) {
            row[i + 1] = [];
            var lambda = (i + 1) / (size - (i + 1));
            row[i + 1][0] = cutLine(row[0][0], row[size][0], lambda);
            row[i + 1][1] = cutLine(row[0][1], row[size][1], lambda);
        }
        var column = [];
        column[0] = cutLine(row[i][0], row[i + 1][0], 1); //Делим сторону строки по середине
        column[size] = cutLine(row[i][1], row[i + 1][1], 1);

        rawArTag[i] = [];
        for (var j = 0; j < size; j++) { // бежим по "колонкам"
            if (column[j + 1] == undefined) {
                var lambda = (j + 1) / (size - (j + 1));
                column[j + 1] = cutLine(column[0], column[size], lambda);
            }
            var center = cutLine(column[j], column[j + 1], 1);
            rawArTag[i][j] = Math.round(getMidPixelColor(matrix, center, radius));
        }
    }
    return rawArTag;
}

function rotationMatrix(matrix) {
    var N = matrix.length;
    for (var i = 0; i < N / 2; i++) {
        for (var j = i; j < N - i - 1; j++) {
            var temp = matrix[i][j];
            matrix[i][j] = matrix[j][N - i - 1];
            matrix[j][N - i - 1] = matrix[N - i - 1][N - j - 1];
            matrix[N - i - 1][N - j - 1] = matrix[N - j - 1][i];
            matrix[N - j - 1][i] = temp;
        }
    }
    return matrix;
}

function orientationArTag(matrix, pointVal, value) {
    while (matrix[pointVal[0]][pointVal[1]] != value) {
        matrix = rotationMatrix(matrix);
    }
    return matrix;
}

function getValueArTag(matrix) {
    var strBin = String(matrix[1][2]).concat(matrix[2][1], matrix[2][3], matrix[3][2]);
    //print(strBin);
    return parseInt(strBin, 2);
}

function getCordination(rawCord) {
    var readyCord = [0, 0];
    for (var i = 0; i < rawCord.length; i++) {
        if (rawCord[i] < 8) {
            readyCord[0] = rawCord[i];
        } else {
            readyCord[1] = rawCord[i] - 8;
        }
    }
    return readyCord;
}

function ArTag(rawImage, length, width, size) {
    var monoChrome = rawToBoolean(rawImage, length, width);
    var borders = [ //1 - левый верхний, 2 - правый верхний, 3 - нихний левый, 4 - нижний правый
        findCorner(monoChrome, [0, 0], 1),
        findCorner(monoChrome, [0, monoChrome[0].length], 1),
        findCorner(monoChrome, [monoChrome.length, 0], 1),
        findCorner(monoChrome, [monoChrome.length, monoChrome[0].length], 1),
    ];

    var rawArTag = readPixelFromArTag(monoChrome, size, borders, 2);
    /*for(var  i= 0; i < rawArTag.length; i++){
        print(rawArTag[i]);
    }*/
    var orientedArTag = orientationArTag(rawArTag, [3, 3], 0);
    return getValueArTag(orientedArTag);
}

function readInput() {
    var FirstValueArTag = ArTag(script.readAll("C:\\FieldsTRIK\\sim_tests\\task1_0.txt")[0].split(" "), 160, 120, 5);
    var SecondValueArTag = ArTag(script.readAll("C:\\FieldsTRIK\\sim_tests\\task1_0.txt")[1].split(" "), 160, 120, 5);
    var finishCord = getCordination([FirstValueArTag, SecondValueArTag]);

    /*for (var i = 0; i < monoChrome.length; i++) {
        print(i, "", monoChrome[i]);
    }*/
    print(finishCord);
    return finishCord;
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

