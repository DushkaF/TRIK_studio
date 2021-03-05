from threading import Thread
from time import sleep


class Motor():
    def __init__(self, motor_config, pwm, GPIO):
        self.encoder_counter = 0
        self.last_state = False

        self.in1 = motor_config['IN1']
        self.in2 = motor_config['IN2']
        self.enc1 = motor_config['ENC1']
        self.enc2 = motor_config['ENC2']

        self.pwm = pwm
        self.pwm.set_pwm_freq(1600)

        self.stopping = Thread()

        self.GPIO = GPIO
        self.GPIO.setmode(GPIO.BCM)
        self.GPIO.setup(self.enc1, GPIO.IN)
        self.GPIO.setup(self.enc2, GPIO.IN)
        self.GPIO.add_event_detect(self.enc1, GPIO.BOTH, callback=self.__enc_counting)
        # self.GPIO.add_event_detect(self.enc2, GPIO.BOTH, callback=self.__enc_counting)

    def set_power(self, value):
        if value > 100:
            value = 100
        elif value < -100:
            value = -100

        value = int(4095 * (value / 100))

        if value >= 0:
            self.__set_value(self.in1, value)
            self.__set_value(self.in2, False)
        elif value < 0:
            self.__set_value(self.in1, 4095 + value)
            self.__set_value(self.in2, True)

    def stop(self, time):
        time = abs(time)
        if time > 1:
            time = 1
        self.stopping = Thread(target=self.__turn_off_stopping, args=(time,))
        self.__set_value(self.in1, True)
        self.__set_value(self.in2, True)
        self.stopping.start()

    def get_encoder(self):
        return self.encoder_counter

    def reset_encoder(self):
        self.encoder_counter = 0

    def __enc_counting(self, pin):
        self.encoder_counter += (1 if self.GPIO.input(self.enc1) == self.GPIO.input(self.enc2) else -1)
        '''state = self.GPIO.input(self.enc1)
        if state != self.last_state:
            self.encoder_counter += (-1 if  self.GPIO.input(self.enc2) != self.last_state else 1)
            self.last_state = state
        '''
        # print(self.encoder_counter)

    def __turn_off_stopping(self, time):
        sleep(time)
        self.__set_value(self.in1, False)
        self.__set_value(self.in2, False)

    def __set_value(self, pin, set):
        value = 0
        if isinstance(set, bool):
            value = set * 4095
        elif isinstance(set, int):
            value = set

        self.pwm.set_pwm(pin, 0, value)

    def __del__(self):
        self.GPIO.remove_event_detect(self.enc1)
        self.GPIO.remove_event_detect(self.enc2)
        self.__set_value(self.in1, False)
        self.__set_value(self.in2, False)
        self.stopping.join()
