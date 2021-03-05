import sys, termios, atexit
from select import select

import main
from time import sleep

# save the terminal settings
fd = sys.stdin.fileno()
new_term = termios.tcgetattr(fd)
old_term = termios.tcgetattr(fd)

# new terminal setting unbuffered
new_term[3] = (new_term[3] & ~termios.ICANON & ~termios.ECHO)

# switch to normal terminal
def set_normal_term():
    termios.tcsetattr(fd, termios.TCSAFLUSH, old_term)

# switch to unbuffered terminal
def set_curses_term():
    termios.tcsetattr(fd, termios.TCSAFLUSH, new_term)

def kbhit():
    dr,dw,de = select([sys.stdin], [], [], 0)
    return dr != []

if __name__ == '__main__':
    atexit.register(set_normal_term)
    set_curses_term()
    flag = False
    while True:
        if kbhit():
            key = sys.stdin.read(1)
            if key == '\x1b':
                # Если escape последовательность, то считать еще 2 символа
                # Но будет некорректно работать, если был нажата клавиша Escape (будет ждать нажатия еще 2 кнопок)
                key += sys.stdin.read(2)

            print(repr(key))

            if key == '\x1b[A':
                print('Up')
                main.forward()
                flag = True
            elif key == '\x1b[B':
                print('Down')
                main.backward()
                flag = True
            elif key == '\x1b[C':
                print('Right')
                main.right()
                flag = True
            elif key == '\x1b[D':
                print('Left')
                main.left()
                flag = True
            sleep(0.1)
        elif(flag):
            main.stop()
            flag = False