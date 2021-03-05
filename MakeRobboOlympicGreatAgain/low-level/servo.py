
class Servo:
    def __init__(self, GPIO, BCM_pin, start_direction=0):
        self.GPIO = GPIO
        self.GPIO.setmode(GPIO.BCM)
        self.GPIO.setwarnings(False)
        self.pin = BCM_pin
        self.GPIO.setup(BCM_pin, GPIO.OUT)
        self.pwm = GPIO.PWM(BCM_pin, 50)
        self.pwm.start(8)
        dutyCycle = start_direction / 18. + 3.
        self.pwm.ChangeDutyCycle(dutyCycle)

    def set_angle(self, angle):
        dutyCycle = angle / 18. + 3.
        self.pwm.ChangeDutyCycle(dutyCycle)

    def __del__(self):
        self.pwm.stop()
        self.GPIO.cleanup(self.pin)


