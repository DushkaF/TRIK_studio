import sys
import time
import random
import math

import trick_builtins

trick_builtins.brick = brick
trick_builtins.script = script

from moving import *
from maze_localisation_and_mapping import *
import maze_localisation_and_mapping


class Program():
    __interpretation_started_timestamp__ = time.time() * 1000

    pi = 3.141592653589793

    def execMain(self):
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
        return


def main():
    program = Program()
    program.execMain()


if __name__ == '__main__':
    main()
