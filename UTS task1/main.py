#!/usr/bin/env python3

import sys
from robot_library.robot import *
import cv2
import rospy
import numpy as np
import math

import gazebo_builtins

from moving import *
from maze_localisation_and_mapping import *
import maze_localisation_and_mapping

import gazebo_builtins
# initialize robot
gazebo_builtins.robot = Robot()
# defining constant from simulator
WHEEL_RADIUS = 0.09




if __name__ == "__main__":
    gazebo_builtins.robot = Robot()
    # just move square 1x1m
    maze_localisation_and_mapping.MAP = make_empty_map(map_size, map_size)
    calibrate_gyro()
    set_start_point()

    research_first_cell()
    while True:
        research_cell()
        if not where_next():
            break

    '''turn_to_required_angle(3)
    to_next_cell()
    turn_to_required_angle(2)
    to_next_cell()
    turn_to_required_angle(1)
    to_next_cell(2)'''

    exit(1)
