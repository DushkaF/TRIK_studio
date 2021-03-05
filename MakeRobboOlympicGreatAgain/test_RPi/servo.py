from time import sleep
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)


class Servo(object):
    def __init__(self, pin, start_directoin=0):
        self.pin = pin
        GPIO.setup(pin, GPIO.OUT)
        self.pwm = GPIO.PWM(pin, 50)
        self.pwm.start(8)
        dutyCycle = start_directoin / 18. + 3.
        self.pwm.ChangeDutyCycle(dutyCycle)

    def set_angle(self, angle):
        dutyCycle = angle / 18. + 3.
        self.pwm.ChangeDutyCycle(dutyCycle)

    def detatch(self):
        self.pwm.stop()
        GPIO.cleanup(self.pin)


servo_pin = 4

print("Start")
servo = Servo(servo_pin, 0)
sleep(1)

for i in range(180):
    servo.set_angle(i)
    print("Angle", i)
    sleep(0.01)

servo.detatch()
del servo
