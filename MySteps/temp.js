function testDateTime(a, b) {
    var A = new Date();
    var B = new Date();
    A.setTime(Date.parse(a));
    B.setTime(Date.parse(b));
    var day;
    if (+A.getTime() > +B.getTime()) {
        day = A.getDay();
    } else {
        day = B.getDay();
    }
    var dName = "";
    switch (day) {
        case 0:
            dName = "Воскресенье";
            break;
        case 1:
            dName = "Понедельник";
            break;
        case 2:
            dName = "Вторник";
            break;
        case 3:
            dName = "Среда";
            break;
        case 4:
            dName = "Четверг";
            break;
        case 5:
            dName = "Пятница";
            break;
        case 6:
            dName = "Суббота";
            break;
    }
    return dName;
}