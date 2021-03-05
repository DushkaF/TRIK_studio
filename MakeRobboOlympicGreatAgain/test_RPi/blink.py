print("start")


import RPi.GPIO as GPIO  # Import Raspberry Pi GPIO library
from time import sleep  # Import the sleep function from the time module

led = 4

print("setup")

GPIO.setwarnings(False)  # Ignore warning for now
GPIO.setmode(GPIO.BCM)  # Use physical pin numbering
GPIO.setup(led, GPIO.OUT, initial=GPIO.LOW)  # Set pin 8 to be an output pin and set initial value to low (off)


while True:  # Run forever
    GPIO.output(led, GPIO.HIGH)  # Turn on
    sleep(1)  # Sleep for 1 second
    GPIO.output(led, GPIO.LOW)  # Turn off
    sleep(1)  # Sleep for 1 second
    print("period")