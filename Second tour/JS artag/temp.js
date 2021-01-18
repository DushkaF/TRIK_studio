var fs = require('fs');

//readSTD();


print(readInput());


// -------- ArTag -------- //

function getRGB(pixel) {
    return [parseInt(pixel.substring(0, 2), 16), parseInt(pixel.substring(2, 4), 16), parseInt(pixel.substring(4, 6), 16)]
}

function rawToBoolean(raw, length, width) {
    var blackWhiteArTag = [];
    for (var i = 0; i < width; i++) {
        blackWhiteArTag[i] = [];
        for (var j = 0; j < length; j++) {
            var pixel = raw[i * length + j];
            var monoColor = function (pixel) {
                if (Math.floor((parseInt(pixel.substring(0, 2), 16) + parseInt(pixel.substring(2, 4), 16) + parseInt(pixel.substring(4, 6), 16)) / 3) > 125) //Высчитываем "тон", среднее по всем каналам
                    return 0;
                else
                    return 1;
            };
            blackWhiteArTag[i][j] = monoColor(pixel);
        }
    }
    return blackWhiteArTag;
}

function getMiddlePictureColor(raw, length, width) {
    var middle = 0;
    for (var i = 0; i < width; i++) {
        for (var j = 0; j < length; j++) {
            var RGB = getRGB(raw[i][j]);
            middle += (RGB[0] + RGB[1] + RGB[2]) / 3;
        }
    }
    middle /= 160 * 120;
    //print("mid " + middle)
    return middle;
}

function selectColors(raw, length, width, mid) {
    value = [Math.pow(((30 / 142) * mid), 3), Math.pow(((102 / 142) * mid), 3), Math.pow(((150 / 142) * mid), 3)];
    var pictures = [];
    for (var k = 0; k < 3; k++) {
        for (var i = 0; i < width; i++) {
            pictures[i] = [];
            for (var j = 0; j < length; j++) {
                pictures[i][j] = [];
            }
        }
    }

    for (var i = 0; i < width; i++) {
        for (var j = 0; j < length; j++) {
            for (var k = 0; k < 3; k++) {
                var RGB = getRGB(raw[i][j]);
                var color = (RGB[0] * RGB[1] * RGB[2] < value[k]) ? 0 : 1;
                pictures[k][i][j] = color;
            }
        }
    }
    return pictures;
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
            //print(column[j])
            var center = cutLine(column[j], column[j + 1], 1);
            //print(center)
            rawArTag[i][j] = Math.round(getMidPixelColor(matrix, center, radius));
        }
    }
    //print(rawArTag);
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
    var strBin = String(matrix[3][2]).concat(matrix[2][3], matrix[2][1], matrix[1][2]);
    //print(strBin);
    return parseInt(strBin, 2);
}


function ArTag(rawImage, length, width, size) {
    var middleColor = getMiddlePictureColor(rawImage, length, width);
    var masks = selectColors(rawImage, length, width, middleColor);
    for (var i = 0; i < 3; i++) {
        //printTagToFile(masks[i], "mask" + i);
    }
    //var monoChrome = rawToBoolean(rawImage, length, width);
    //printTagToFile(monoChrome);
    var monoChrome = masks[0];
    var cornerTag = 0;
    var borders = [ //1 - левый верхний, 2 - правый верхний, 3 - нихний левый, 4 - нижний правый
        findCorner(monoChrome, [0, 0], cornerTag),
        findCorner(monoChrome, [0, monoChrome[0].length], cornerTag),
        findCorner(monoChrome, [monoChrome.length, 0], cornerTag),
        findCorner(monoChrome, [monoChrome.length, monoChrome[0].length], cornerTag),
    ];

    var rawArTag = readPixelFromArTag(monoChrome, size, borders, 2);
    //print("oriented");
    var orientedArTag = orientationArTag(rawArTag, [3, 3], cornerTag == 0 ? 1 : 0);
    /*for(var  i= 0; i < orientedArTag.length; i++){
        print(orientedArTag[i]);
    }*/
    return getValueArTag(orientedArTag);
}


function readInput(lines) {
    var lines = readFile("01");
   // print(lines);
    var picMitrix = [];
    for (var i = 0; i < 120; i++) {
        picMitrix[i] = lines[i].split(" ");
        picMitrix[i].pop();
    }
    var FirstValueArTag = ArTag(picMitrix, 160, 120, 5);
    return FirstValueArTag;
}


function readSTD() {
    const readLine = require("readline");
    const rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    var inputData = [];
    counter = 0;
    var array = [];
    rl.on('line', (line) => {
        array.push(line);
        //console.log(array);
        counter++;
        if (counter >= 120) {
            rl.close();
            print(readInput(array));
            //print(array);
            process.exit(0);
        }
    });
    //return array;
}


/*
function findIsle(monoChromeTag) {
    var partionTag = monoChromeTag;
    var tag = 1;
    var count = 2;
    for (var i = 0; i < partionTag.length; i++) {
        for (var j = 0; j < partionTag[i].length; j++) {
            if (partionTag[i][j] == tag) {
                print("found tag");
                partionTag = reseachIsle(partionTag, count, [i, j], tag);
                count++;
            }
        }
    }
    print("founded");
    printTagToFile(partionTag);
}

function reseachIsle(monoChromeTag, value, coords, tag) {
    var partion = monoChromeTag;
    for (var i = 0; i < 4; i++) {
        tx = (1 - i) % 2;
        ty = (2 - i) % 2;
        if (coords[0] + tx < partion.length && coords[0] + tx >= 0 && coords[1] + ty < partion[0].length && coords[1] + ty >= 0 && partion[coords[0] + tx][coords[1] + ty] == tag) {
            partion[coords[0] + tx][coords[1] + ty] = value;
            partion = reseachIsle(partion, value, [coords[0] + tx, coords[1] + ty], tag);
        }
    }
    return partion;
}*/


// ------------ System functions ------------ //

function readFile(path) {
    var data = fs.readFileSync(path, 'utf-8').split('\n');
    return data;
}

function print(data) {
    console.log(data);
}

function printTagToFile(content, name) {
    var out = "";
    for (var i = 0; i < content.length; i++) {
        for (var j = 0; j < content[i].length; j++) {
            out += content[i][j];
        }
        out += "\n";
    }
    print("write");
    fs.writeFile(name + '.txt', out, (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
}