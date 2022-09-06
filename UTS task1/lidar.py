import numpy as np
import matplotlib.pyplot as plt

increment_angle = 0.006141935475170612

radial_points = []

with open('tests.txt', 'r') as file:
    radial_points = [float(i) for i in file.read().split(' ')][27:-27]
    file.close()

cartesian_points_x = [radial_points[i] * np.cos(i * increment_angle) for i in range(len(radial_points))]
cartesian_points_y = [radial_points[i] * np.sin(i * increment_angle) for i in range(len(radial_points))]

dir_vector_x = np.cos(len(radial_points) / 2 * increment_angle)
dir_vector_y = np.sin(len(radial_points) / 2 * increment_angle)
dir_vector_k = [(dir_vector_y / dir_vector_x), -(dir_vector_x / dir_vector_y)]

corner_points = []
banned_corner_point = set()
parallel_lines = []
coordinated_lines = []  # dir, dist, start, end

map_size = (16 * 2 + 2) * 2
background = '■'  # '█' #'■'  # "♥" # "💘"
cell_width = 0.6 / 2
sens_err_front = 0.05
sens_err_side = 0.2
addition_dist_to_front = 0.15

x = 0
y = 0
now_angle = 1


def find_lines():
    global cartesian_points_x, cartesian_points_y, radial_points

    permissible_err_points = 0.2

    prev_K = None
    for i in range(1, len(radial_points)):
        K = (cartesian_points_y[i] - cartesian_points_y[i - 1]) / (cartesian_points_x[i] - cartesian_points_x[i - 1])
        if prev_K is None or abs(prev_K - K) > permissible_err_points:
            corner_points.append(i - 1)
        elif radial_points[i] == float('inf') and radial_points[i - 1] != float('inf'):
            corner_points.append(i - 1)
            banned_corner_point.add(i - 1)
        elif radial_points[i - 1] == float('inf') and radial_points[i] != float('inf'):
            corner_points.append(i)
            banned_corner_point.add(i)
        prev_K = K
    corner_points.append(len(radial_points) - 1)


def find_parallels():
    global corner_points, banned_corner_point, cartesian_points_y, cartesian_points_x, dir_vector_k
    permissible_err_lines_K = 0.05
    min_line_length = 0.05

    for i in range(1, len(corner_points)):
        x1 = cartesian_points_x[corner_points[i - 1]]
        y1 = cartesian_points_y[corner_points[i - 1]]
        x2 = cartesian_points_x[corner_points[i]]
        y2 = cartesian_points_y[corner_points[i]]
        if not (i in banned_corner_point and i - 1 in corner_points_closed) and ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** (
                1 / 2) > min_line_length:
            K = (y2 - y1) / (x2 - x1)
            for k in range(2):
                if abs(dir_vector_k[k] - K) < permissible_err_lines_K:
                    parallel_lines.append([[x1, x2], [y1, y2], k])


def get_distention_to_line():
    global parallel_lines, dir_vector_k, coordinated_lines
    for i in range(len(parallel_lines)):
        Ax = -dir_vector_k[parallel_lines[i][2]]
        Bx = 1
        dist = (Ax * sum(parallel_lines[i][0]) / 2 + Bx * sum(parallel_lines[i][1]) / 2) / (
                (Ax ** 2 + Bx ** 2) ** (1 / 2))
        Ay = -dir_vector_k[(parallel_lines[i][2] + 1) % 2]
        By = 1
        start = (Ay * parallel_lines[i][0][0] + By * parallel_lines[i][1][0]) / ((Ay ** 2 + By ** 2) ** (1 / 2))
        end = (Ay * parallel_lines[i][0][1] + By * parallel_lines[i][1][1]) / ((Ay ** 2 + By ** 2) ** (1 / 2))
        # print(parallel_lines[i][0][0], parallel_lines[i][1][0], Ay, end)
        coordinated_lines.append([parallel_lines[i][2], dist, start, end])


def show_plot():
    fig = plt.figure(figsize=(20, 25))
    ax = fig.add_subplot()
    # ax.set_lim()
    ax.plot(cartesian_points_x, cartesian_points_y)
    ax.arrow(0, 0, dir_vector_x, dir_vector_y, width=0.05, color='red')
    ax.arrow(0, 0, 1, 1 * dir_vector_k[1], width=0.05, color='green')
    ax.scatter(np.array(cartesian_points_x)[corner_points], np.array(cartesian_points_y)[corner_points], color='orange',
               s=20, marker='o')

    for i in parallel_lines:
        ax.plot(i[0], i[1], color='red' if i[2] == 0 else 'green')

    ax.scatter(0, 0, color='red', s=40, marker='o')
    fig.show()


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
    '''
    y ----------->
    x
    |
    |
    |
    V   
    '''


def mapping():
    global coordinated_lines, x, y, MAP, now_angle
    area_corners = []
    area_corners.append([x, y])
    for i in range(len(coordinated_lines)):
        dir = coordinated_lines[i][0]
        dist = coordinated_lines[i][1] + addition_dist_to_front * dir
        dist_count = (abs(dist) // cell_width +
                      (1 if (cell_width - abs(dist) % cell_width) < sens_err_front else 0)) * np.sign(dist)
        start_dist = coordinated_lines[i][2]
        start_count = int(calculate_side_count(start_dist, sens_err_side, dir, addition_dist_to_front))
        end_dist = coordinated_lines[i][3]
        end_count = int(calculate_side_count(end_dist, sens_err_side, dir, addition_dist_to_front))
        # print(dist_count, start_count, end_count)
        for j in range(min(start_count, end_count), max(start_count, end_count) + 1):
            tx = delta_increment(now_angle, dir, dist_count, j)
            ty = delta_increment(now_angle, dir, j, dist_count)
            MAP[x + tx][y + ty] = '|' if (dir == 0 and ((1 - now_angle) % 2) == 0) or \
                                         (dir == 1 and ((1 - now_angle) % 2) == 1) else '-'


        tx_start = delta_increment(now_angle, dir, dist_count, start_count)
        ty_start = delta_increment(now_angle, dir, start_count, dist_count)
        tx_end = delta_increment(now_angle, dir, dist_count, end_count)
        ty_end = delta_increment(now_angle, dir, end_count, dist_count)
        if area_corners[-1] != [x + tx_start, y + ty_start]:
            area_corners.append([x + tx_start, y + ty_start])
        area_corners.append([x + tx_end, y + ty_end])


    print(area_corners)
    for i in range(map_size):
        for j in range(map_size):
            if in_polygon(area_corners, i, j):
                MAP[i][j] = ' ' if MAP[i][j] == background else MAP[i][j]

    '''fig = plt.figure(figsize=(10, 10))
    ax = fig.add_subplot()
    ax.plot([area_corners[i][0] for i in range(len(area_corners))],
            [area_corners[i][1] for i in range(len(area_corners))])
    fig.show()'''


def delta_increment(now_angle, dir, first, second):
    return int(
        (((1 - now_angle) % 2) * np.sign(1 - now_angle) + ((2 - now_angle) % 2) * np.sign(2 - now_angle)) *
        (first if (dir == 1 and (1 - now_angle) % 2 == 0) or
                 (dir == 0 and (1 - now_angle) % 2 == 1) else second))


def calculate_side_count(dist, err, dir, addition):
    dir = (dir + 1) % 2
    dist += addition * dir
    return (abs(dist) // cell_width + (1 if abs(dist) % cell_width > err else 0)) * np.sign(dist)


def in_polygon(corners, tX, tY):
    angle_sum = 0.0
    for i in range(len(corners)):
        len_1 = vector_len([tX, tY], corners[i - 1])
        len_2 = vector_len([tX, tY], corners[i])
        if len_1 != 0 and len_2 != 0:
            cos_angle = scalar(corners[i - 1], [tX, tY], corners[i]) / (len_1 * len_2)
            angle = np.arccos(max(-1, min(1, cos_angle)))
            angle_sum += angle if vector(corners[i - 1], [tX, tY], corners[i]) >= 0 else -angle
    # print(tX, tY, angle_sum, angle_sum / (2 * np.pi), np.pi)
    return angle_sum == float('nan') or (angle_sum != float('nan') and round(angle_sum / (2 * np.pi)) != 0)


def scalar(point1, point2, point3):  # 1 --- 2 --- 3, 2 in center coords
    return (point1[0] - point2[0]) * (point3[0] - point2[0]) + (point1[1] - point2[1]) * (point3[1] - point2[1])


def vector_len(point1, point2):
    return ((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2) ** (1 / 2)


def vector(point1, point2, point3):  # 1 --- 2 --- 3, 2 in center coords
    return (point1[0] - point2[0]) * (point3[1] - point2[1]) - (point1[1] - point2[1]) * (point3[0] - point2[0])


def print_map(arr):
    for i in range(len(arr) - 1, -1, -1):
        temp = str(i) + ("* " if i > 9 else "*  ")
        for j in range(len(arr[i]) - 1):
            temp += str(arr[i][j]) + (" " if len(str(arr[i][j]) + "") > 1 else "  ")
        print(temp)


find_lines()
find_parallels()
get_distention_to_line()
print(coordinated_lines)
show_plot()

MAP = make_empty_map(map_size, map_size)
mapping()
print_map(MAP)
