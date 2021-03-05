#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

#define MOTOR1_IN 0
#define MOTOR1_PWM 1

void setup() {
  /*pinMode(MOTOR1_IN, OUTPUT);
    pinMode(MOTOR1_PWM, OUTPUT);*/

  pwm.begin();
  pwm.setOscillatorFrequency(27000000);
  pwm.setPWMFreq(1600);  // This is the maximum PWM frequency
  Wire.setClock(400000);
}

void loop() {
  motorControl(analogRead(0), MOTOR1_IN, MOTOR1_PWM);
}

// принимает знач. 0-1023, пин IN и PWM
void motorControl(int val, byte pinIN, byte pinPWM) {
  val = map(val, 0, 1023, -4095, 4095);

  if (val > 0) {  // вперёд
    setPca9985(pinPWM, val);
    setPca9985(pinIN, false);
  } else if (val < 0) {  // назад
    setPca9985(pinPWM, 4095 + val);
    setPca9985(pinIN, true);
  } else {  // стоп
    setPca9985(pinIN, true);
    setPca9985(pinPWM, true);
  }
}

void setPca9985(uint8_t pin, int value) {
  pwm.setPWM(pin, 0, value);
}

void setPca9985(uint8_t pin, boolean state) {
  setPca9985(pin, state ? 4095 : 0);
}
