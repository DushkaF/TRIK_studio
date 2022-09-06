from gazebo_builtins import *
import numpy as np


encoder_absolut = 0

distance_to_next_cell = 0.6
WHEEL_RADIUS = 0.09
move_p = 0.05  # PID

necessary_angle = [180, 270, 360, 90]
last_angle = 0
now_angle = 0
not_indent = False
gyro_speed = 10
gyro_p = 0.0005


def set_start_point():
    global encoder_absolut
    encoder_absolut = robot.getEncoders().get("left")


def gyro():
    return 360.0/(2*np.pi)*robot.getDirection() + 180000

def to_next_cell(count=1):
    moveDist(distance_to_next_cell * count)

def turn_to_required_angle(angle):
    if abs(angle - now_angle) == 2:
        if angle - now_angle < 0 or angle == 2:
            turn(2)
        else:
            turn(-2)
    elif (angle - now_angle > 0 and not (now_angle == 0 and angle == 3)) or (
            angle - now_angle < 0 and angle == 0 and now_angle == 3):
        turn(1)
    elif (angle - now_angle < 0 and not (now_angle == 3 and angle == 0)) or (
            angle - now_angle > 0 and angle == 3 and now_angle == 0):
        turn(-1)


def check_angle_position(dir):
    global last_angle, robot
    angle = gyro()
    result = False
    if dir:
        result = angle < necessary_angle[now_angle] * 1000 and angle - last_angle >= 0;
    else:
        result = angle > (necessary_angle[now_angle] % 360) * 1000 and angle - last_angle <= 0;
    if result:
        robot.setVelosities(0,0)
    last_angle = angle
    return result


def turn(count=1):
    global not_indent, now_angle, last_angle

    now_angle += count
    if count > 0:
        now_angle = abs(now_angle % 4)
    else:
        now_angle = (now_angle % 4) if now_angle < 0 else now_angle
    last_angle = gyro()
    while check_angle_position(count > 0):
        resultSpeed = 0
        if count > 0:
            robot.setVelosities(0,resultSpeed)
            resultSpeed = gyro_speed * gyro_p * (necessary_angle[now_angle] * 1000 - gyro()) + 1
        elif count < 0:
            resultSpeed = gyro_speed * gyro_p * ((necessary_angle[now_angle] % 360) * 1000 - gyro()) - 1
        robot.setVelosities(0, resultSpeed)
        robot.sleep(0.01)
    stop()
    set_start_point()


'''def turn(count):
    global now_angle
    global robot
    """
    function turns robot at given angle in radians
    returns predicted position after turn (calculated position, real position may differ)
    """                                                                                                                                       южддддждддддддддддддддддддддюжюждюжюжджжю

    now_angle += count
    if count > 0:
        now_angle = abs(now_angle % 4)
    else:
        now_angle = (now_angle % 4) if now_angle < 0 else now_angle

    # defining some constants
    MAX_TURN_SPEED = 0.4
    P_COEF = 0.4

    current_dir = robot.getDirection()
    # calculate target direction of robot after turn
    target_dir = current_dir + add_deg_rad

    # calculate error of rotation (nobody knows how it works, but it does)
    e = (target_dir - current_dir + np.pi * 5) % (np.pi * 2) - (np.pi)

    # accepting threshold after turn is 0.01
    while abs(e - np.sign(e) * np.pi) > 0.01:
        current_dir = robot.getDirection()
        e = (target_dir - current_dir + np.pi * 5) % (np.pi * 2) - (np.pi)
        turn_speed = -(e - np.sign(e) * np.pi) * P_COEF + np.sign(e) * 0.1

        # limit our speed with MAX_TURN_SPEED bound
        turn_speed = np.sign(turn_speed) * np.maximum(np.abs(turn_speed), MAX_TURN_SPEED)
        # equivalent to bottom line
        # turn_speed = (turn_speed if turn_speed > -MAX_TURN_SPEED else -MAX_TURN_SPEED) if turn_speed < MAX_TURN_SPEED else MAX_TURN_SPEED

        robot.setVelosities(0, turn_speed)

        # some delay for don't overload computation
        robot.sleep(0.001)

    robot.setVelosities(0, 0)'''


def moveDist(dist):
    """
    function moves robot on desired distance in meters
    """
    global WHEEL_RADIUS
    # calculating how many radians to the required position left
    dist_left = (dist / WHEEL_RADIUS)

    # save initial number of encoders
    initial_enc = robot.getEncoders().get("left")

    while abs(dist_left) > 0.005:
        enc = robot.getEncoders().get("left")
        dist_left = initial_enc + (dist * 1.0 / WHEEL_RADIUS) - enc
        up = 0.1 * dist_left
        up = (up if up > -0.3 else -0.3) if up < 0.3 else 0.3
        robot.setVelosities(up, 0)

        robot.sleep(0.001)
    robot.setVelosities(0, 0)
