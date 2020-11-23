var monoChrome = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 1, 1, 1, 0, 1, 1],
    [1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1, 1, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

var borders = [ //1 - левый верхний, 2 - правый верхний, 3 - нихний левый, 4 - нижний правый
    findCorner(monoChrome, [0, 0], 0),
    findCorner(monoChrome, [0, monoChrome[0].length], 0),
    findCorner(monoChrome, [monoChrome.length, 0], 0),
    findCorner(monoChrome, [monoChrome.length, monoChrome[0].length], 0),
];

var rawArTag = readPixelFromArTag(monoChrome, 3, borders, 1, 2);

for (var i = 0; i < rawArTag.length; i++) {
    console.log(rawArTag[i]);
}

function rawToBoolean(raw, length, width) {
    var blackWhiteArTag = [];
    for (var i = 0; i < width; i++) {
        blackWhiteArTag[i] = [];
        for (var j = 0; j < length; j++) {
            var pixel = raw[i * length + j];
            var monoColor = function(pixel) {
                if (Math.floor((parseInt(pixel.substring(0, 2), 16) + parseInt(pixel.substring(2, 4), 16) + parseInt(pixel.substring(4, 6), 16)) / 3) > 128) //Высчитываем "тон", среднее по всем каналам
                    return 1;
                else
                    return 0;
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

function readPixelFromArTag(matrix, size, border, value, radius) {
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