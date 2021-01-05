var fs = require('fs');


readInput();



// -------- ArTag -------- //

function rawToBoolean(raw, length, width) {
    var gradient = 110;
    var blackWhiteArTag = [];
    for (var i = 0; i < width; i++) {
        blackWhiteArTag[i] = [];
        for (var j = 0; j < length; j++) {
            var pixel = raw[i * length + j];
            var monoColor = function (pixel) {
                if (Math.floor((parseInt(pixel.substring(0, 2), 16) + parseInt(pixel.substring(2, 4), 16) + parseInt(pixel.substring(4, 6), 16)) / 3) > gradient) //Высчитываем "тон", среднее по всем каналам
                    return 0;
                else
                    return 1;
            };
            blackWhiteArTag[i][j] = monoColor(pixel);
        }
    }
    return blackWhiteArTag;
}

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


function ArTag(rawImage, length, width, size) {
    var monoChrome = rawToBoolean(rawImage, length, width);
    //printTagToFile(monoChrome);
    findIsle(monoChrome);
    
    
    /*var borders = [ //1 - левый верхний, 2 - правый верхний, 3 - нихний левый, 4 - нижний правый
        findCorner(monoChrome, [0, 0], 1),
        findCorner(monoChrome, [0, monoChrome[0].length], 1),
        findCorner(monoChrome, [monoChrome.length, 0], 1),
        findCorner(monoChrome, [monoChrome.length, monoChrome[0].length], 1),
    ];

    var rawArTag = readPixelFromArTag(monoChrome, size, borders, 2);
    for (var i = 0; i < rawArTag.length; i++) {
        print(rawArTag[i]);
    }*/
    // var orientedArTag = orientationArTag(rawArTag, [3, 3], 0);
    // return getValueArTag(orientedArTag);
}


function readInput() {
    var lines = readFile("task1_00.txt");
    var FirstValueArTag = ArTag(lines[0].split(" "), 160, 120, 8);


    /*for (var i = 0; i < monoChrome.length; i++) {
        print(i, "", monoChrome[i]);
    }*/
    //print(finishCord);
    //return finishCord;
}


// ------------ System functions ------------ //

function readFile(path) {
    var data = fs.readFileSync(path, 'utf-8').split("\n");
    return data;
}

function print(data) {
    console.log(data);
}

function printTagToFile(content) {
    var out = "";
    for (var i = 0; i < content.length; i++) {
        for (var j = 0; j < content[i].length; j++) {
            out += content[i][j];
        }
        out += "\n";
    }
    print("write");
    fs.writeFile('task1_00_visual.txt', out, (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
}