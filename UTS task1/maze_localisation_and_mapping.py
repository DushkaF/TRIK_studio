import copy

from moving import *
import moving
from math import floor

l_sens = brick.sensor("A3")
r_sens = brick.sensor("A2")
f_sens = brick.sensor("A1")

cell_width = 70
sens_err = 5
infrared_sens = 80

map_size = (16 + 2) * 2
background = '■'  # "♥" # "💘"

x = 0
y = 0
absolut_X = -1
absolut_Y = -1
MAP = None
MASK = None


def sign(var):
    if var > 0:
        return 1
    elif var < 0:
        return -1
    else:
        return 0


def print_map(arr):
    for i in range(len(arr) - 1, -1, -1):
        temp = str(i) + ("* " if i > 9 else "*  ")
        for j in range(len(arr[i]) - 1):
            temp += str(arr[i][j]) + (" " if len(str(arr[i][j]) + "") > 1 else "  ")
        print(temp)


def make_empty_map(height, width):
    global x, y
    map = []
    for i in range(height):
        map.append([])
        for j in range(width):
            map[i].append(background)

    x = round(height / 2)
    y = round(width / 2)
    map[x][y] = 'X'
    return map
    """
    y ----------->
    x
    |
    |
    |
    V
    """


def mapping_direction(value, position, maximum):
    global MAP, x, y
    _now_angle = moving.now_angle
    count = value // (cell_width + sens_err)
    # print("before", position, _now_angle)
    position = (_now_angle + position) % 4
    # print("after", position)
    tx = 0
    ty = 0

    if position == 0:
        tx = 1
    elif position == 1:
        ty = 1
    elif position == 2:
        tx = -1
    elif position == 3:
        ty = -1

    # print(tx, ty)

    if not value < 0:
        if count < (maximum // (cell_width + sens_err)):
            MAP[x + tx * (2 * count + 1)][y + ty * (2 * count + 1)] = '-' if tx != 0 else '|'
            # print("coord", x, y, "wall", x + tx * (2 * count + 1), y + ty * (2 * count + 1))
            # для дорисовывания предполагаемых стенок
            # pass
        else:
            count = maximum // (cell_width + sens_err)

        for i in range(count, 0, -1):
            MAP[x + 2 * tx * i][y + 2 * ty * i] = ' ' if MAP[x + 2 * tx * i][y + 2 * ty * i] != 'X' else 'X'
            MAP[x + tx * (2 * i - 1)][y + ty * (2 * i - 1)] = ' ' if MAP[x + tx * (2 * i)][
                                                                         y + ty * (2 * i)] != 'X' else 'X'
    else:
        if MAP[x + 2 * tx][y + 2 * ty] == 'X':
            MAP[x + tx][y + ty] = 'X'


def research_cell():
    global MAP, x, y
    MAP[x][y] = 'X'
    mapping_direction(l_sens.read(), 3, infrared_sens)
    mapping_direction(r_sens.read(), 1, infrared_sens)
    mapping_direction(f_sens.read(), 0, infrared_sens)
    mapping_direction(-1, 2, infrared_sens)
    print_map(MAP)


def research_first_cell():
    research_cell()
    turn_to_required_angle(1, to_center=True)
    research_cell()
    turn_to_required_angle(0)


#   --------------- None-stop researching --------------------

def check_wall():
    return f_sens.read() > cell_width / 2


def research_cell_position():
    global x, y
    _now_angle = moving.now_angle
    x += 2 * ((1 - _now_angle) % 2) * sign(1 - _now_angle)
    y += 2 * ((2 - _now_angle) % 2) * sign(2 - _now_angle)
    research_cell()


def going():
    global MAP, x, y
    _now_angle = moving.now_angle
    last_count_researched_cell = 0
    while check_wall():
        set_motion(100, 100)
        now_count_researched_cell = (r_enc.readRawData() - moving.encoder_absolut) // distance_to_next_cell
        if last_count_researched_cell < now_count_researched_cell:
            research_cell_position()
            last_count_researched_cell = now_count_researched_cell
            if MAP[x + ((1 - _now_angle) % 2) * sign(1 - _now_angle)][
                y + ((2 - _now_angle) % 2) * sign(2 - _now_angle)] != ' ':
                print("next cell", MAP[x + ((1 - _now_angle) % 2) * sign(1 - _now_angle)][
                    y + ((2 - _now_angle) % 2) * sign(2 - _now_angle)])
                break
    print("reason", check_wall())

    needed_encoder = moving.encoder_absolut
    if abs(last_count_researched_cell * distance_to_next_cell - (r_enc.readRawData() - moving.encoder_absolut)) > abs(
            (last_count_researched_cell + 1) * distance_to_next_cell - (r_enc.readRawData() - moving.encoder_absolut)):
        needed_encoder += (last_count_researched_cell + 1) * distance_to_next_cell
        research_cell_position()
    else:
        needed_encoder += last_count_researched_cell * distance_to_next_cell

    moving.encoder_absolut = r_enc.readRawData()
    set_moving((needed_encoder - moving.encoder_absolut) + indent)
    moving.not_indent = True


#   --------------------------------------------------------------


def find_required_cell(tag=None):
    global MASK, MAP
    counter = 0
    last_counter = 0
    near_flag = False
    while True:
        for row in range(len(MASK)):
            for col in range(len(MASK[row])):
                if type(MASK[row][col]) == int and MASK[row][col] == counter and not near_flag:
                    for i in range(4):
                        tx = (1 - i) % 2 * sign(1 - i)
                        ty = (2 - i) % 2 * sign(2 - i)
                        if MASK[row + tx][col + ty] == ' ' and MASK[row + 2 * tx][col + 2 * ty] == ' ':
                            MASK[row + 2 * tx][col + 2 * ty] = counter + 1
                            last_counter = counter
                        if tag is None:
                            if str(MAP[row + 2 * tx][col + 2 * ty]) == ' ' and MASK[row + tx][col + ty] == ' ':
                                return [row + 2 * tx, col + 2 * ty]
                        else:
                            if row + 2 * tx == tag[0] and col + 2 * ty == tag[1] and MASK[row + tx][col + ty] == ' ':
                                return [row + 2 * tx, col + 2 * ty]
        if counter != last_counter:
            break
        counter += 1
    return


def tracing(coords):
    global MAP, MASK, x, y
    _now_angle = moving.now_angle
    xi = coords[0]
    yi = coords[1]
    count = MASK[xi][yi]
    way = []
    while count > 0:
        way.append([xi, yi])
        for i in range(4):
            ti = (_now_angle + i) % 4
            tx = (1 - ti) % 2 * sign(1 - ti)
            ty = (2 - ti) % 2 * sign(2 - ti)
            if type(MASK[xi + 2*tx][yi + 2*ty]) == int and MASK[xi + 2*tx][yi + 2*ty] == count - 1:
                xi += 2*tx
                yi += 2*ty
                count -= 1
                break
    return way


def move_to_required_cell(coords=None):
    global MASK, MAP
    MASK = copy.deepcopy(MAP)
    for i in range(len(MASK)):
        for j in range(len(MASK[i])):
            if MASK[i][j] == 'X':
                MASK[i][j] = ' '
    MASK[x][y] = 0
    end_coords = find_required_cell(coords)
    if end_coords is None:
        return False

    print_map(MASK)
    way = tracing(end_coords)

    while len(way) > 0:
        cell_coord = way.pop()
        go_to_near_cell(cell_coord[0], cell_coord[1])
    return True


def go_to_near_cell(xi, yi):
    global x, y, absolut_X, absolut_Y
    _now_angle = moving.now_angle
    angle = 0
    if x - xi < 0:
        angle = 0
    elif x - xi > 0:
        angle = 2
    elif y - yi < 0:
        angle = 1
    elif y - yi > 0:
        angle = 3

    turn_to_required_angle(angle)
    _now_angle = moving.now_angle
    to_next_cell()
    x += 2 * ((1 - _now_angle) % 2) * sign(1 - _now_angle)
    y += 2 * ((2 - _now_angle) % 2) * sign(2 - _now_angle)
    if absolut_X >= 0:
        absolut_X += ((1 - _now_angle) % 2) * sign(1 - _now_angle)
    if absolut_Y >= 0:
        absolut_Y += ((2 - _now_angle) % 2) * sign(2 - _now_angle)


def where_next():
    global x, y, MAP
    _now_angle = moving.now_angle
    tx = 0
    ty = 0
    flag = False
    angle = None
    for i in range(4):
        ti = (_now_angle + i) % 4
        tx = (1 - ti) % 2 * sign(1 - ti)
        ty = (2 - ti) % 2 * sign(2 - ti)
        if MAP[x + tx][y + ty] == ' ' and MAP[x + 2 * tx][y + 2 * ty] == ' ':
            flag = True
            angle = ti
            break
    if flag:
        turn_to_required_angle(angle)
        _now_angle = moving.now_angle
        going()
        '''to_next_cell()
        x += 2 * ((1 - _now_angle) % 2) * sign(1 - _now_angle)
        y += 2 * ((2 - _now_angle) % 2) * sign(2 - _now_angle)'''
    else:
        if not move_to_required_cell():
            return False
    return True


def check_absolut_position(absolut):
    global MAP
    num = 8
    if absolut < 0:
        matrix = [0]
        count = 0
        for i in range(len(MAP)):
            visit = 0
            for j in range(len(MAP[i])):
                if MAP[i][j] == 'X':
                    visit = 1
            count += visit
            matrix[i] = visit
        if count == (8*2 - 1):
            for i in range(1, x+1, 2):
                if matrix[i] == 1:
                    absolut += 1


def definition_absolut_coords():
    if absolut_X:
        pass