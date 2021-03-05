from __future__ import division

from time import sleep, time
from threading import Thread

import Adafruit_PCA9685
import RPi.GPIO as GPIO

pwm = Adafruit_PCA9685.PCA9685()

import configuration
from motors import Motor
from servo import Servo

servo = Servo(GPIO, configuration.servo_pin, 180)
motor_f_r = Motor(configuration.motor_f_r, pwm, GPIO)
motor_f_l = Motor(configuration.motor_f_l, pwm, GPIO)
motor_b_r = Motor(configuration.motor_b_r, pwm, GPIO)
motor_b_l = Motor(configuration.motor_b_l, pwm, GPIO)

current_milli_time = lambda: int(round(time() * 1000))

import matplotlib.pyplot as plt
import random


def sign(num):
    return -1 if num < 0 else 1


class PID(Thread):
    def __init__(self, motor, kP, kI, kD):
        Thread.__init__(self)
        self.motor = motor
        self.kP = kP
        self.kI = kI
        self.kD = kD
        self.__kK = 5
        self.__last_time = 0
        self.__last_encoder = self.motor.get_encoder()
        self.__integral = 0
        self.__last_err = 0

        self.__stabilising = Thread()
        self.__stop = {'stop': False}

        self._log = [[], [], []]

    def set_stab_power(self, power):
        cur_time = current_milli_time()
        dt = cur_time - self.__last_time
        # print("enc", self.motor.get_encoder(), self.__last_encoder)
        cur_enc = self.motor.get_encoder()
        speed = (cur_enc - self.__last_encoder) / (dt / 1000)
        #print("speed", speed)
        self.__last_encoder = cur_enc
        err = power - speed
        self.__integral += err * dt
        D = (err - self.__last_err) / dt
        self.__last_err = err
        corrected_power = err * self.kP + (D * self.kD + self.__integral * self.kI if self.__last_time != 0 else 0)

        '''self._log[0].append(cur_time)
        self._log[1].append(speed)
        self._log[2].append(corrected_power)'''

        corrected_power = corrected_power if sign(corrected_power) == sign(power) else 0
        corrected_power = corrected_power if self.__last_time != 0 else 50*sign(power)

        self.__last_time = current_milli_time()
        #print(speed, err * self.kP,  self.__integral * self.kI, D * self.kD, corrected_power)
        print(corrected_power)
        self.motor.set_power(corrected_power)

    def __stabilise_power(self, power, stop):
        while not stop['stop']:
            self.set_stab_power(power)
            sleep(0.01)
        self.motor.stop(0.1)
        self.__stop['stop'] = False

    def start_stabilising(self, power):
        self.__last_time = 0
        self.__last_encoder = self.motor.get_encoder()
        self.__integral = 0
        self.__last_err = 0
        self.__stabilise = Thread(target=self.__stabilise_power, args=(power, self.__stop,))
        self.__stabilise.start()

    def stop(self):
        self.__stop['stop'] = True
        self.__stabilise.join()

        '''fig, ax = plt.subplots()
        ax.set_ylim([-1*sign(self._log[2][0]), abs(max(self._log[1]))*sign(self._log[2][0])])
        ax.plot(self._log[0], self._log[1])
        ax.plot(self._log[0], self._log[2])
        fig.savefig('log')
        self._log = [[], [], []]'''


def forward(power):
    motor_f_r.set_power(power)
    motor_f_l.set_power(power)
    motor_b_r.set_power(power)
    motor_b_l.set_power(power)


def backward(power):
    motor_f_r.set_power(-power)
    motor_f_l.set_power(-power)
    motor_b_r.set_power(-power)
    motor_b_l.set_power(-power)


def right(power):
    motor_f_r.set_power(-power)
    motor_f_l.set_power(power)
    motor_b_r.set_power(power)
    motor_b_l.set_power(-power)


def left(power):
    motor_f_r.set_power(power)
    motor_f_l.set_power(-power)
    motor_b_r.set_power(-power)
    motor_b_l.set_power(power)


def stop():
    motor_b_r.stop(0.5)
    motor_b_l.stop(0.5)
    motor_f_r.stop(0.5)
    motor_f_l.stop(0.5)


kP = 0.2
kI = 0.00000000000015
kD = 0.05  # 0.05

PID_b_r = PID(motor_b_r, kP, kI, kD)
PID_b_l = PID(motor_b_l, kP, kI, kD)
PID_f_r = PID(motor_f_r, kP, kI, kD)
PID_f_l = PID(motor_f_l, kP, kI, kD)


def main():
    ''' while True:
         pass'''

    '''speed = 100
    PID_f_r.start_stabilising(speed)
    sleep(2)
    PID_f_r.stop()'''

    for i in range(1, 2):
         speed = 200
         PID_b_r.start_stabilising((-1) ** i * speed)
         PID_b_l.start_stabilising((-1) ** i * (-1) * speed)
         PID_f_r.start_stabilising((-1) ** i * (-1) * speed)
         PID_f_l.start_stabilising((-1) ** i * speed)
         sleep(2)
         PID_b_r.stop()
         PID_b_l.stop()
         PID_f_r.stop()
         PID_f_l.stop()
         sleep(1)

    '''left(50)
    sleep(2)
    stop()'''

    '''forward(30)
    sleep(2)
    stop()
    sleep(0.1)
    right(30)
    sleep(2)
    stop()
    sleep(0.1)
    backward(30)
    sleep(2)
    stop()
    sleep(0.1)
    left(30)
    sleep(2)
    stop()'''

    '''print("start servo")
    for i in range(181):
        servo.set_angle(i)
        print("Angle", i)
        sleep(0.01)'''


if __name__ == "__main__":
    main()
