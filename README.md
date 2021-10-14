Homebridge HDMI Switch
====

Introduction
----

Allows Homebridge to operate a RS232 controlled HDMI Switcher. 

Configuration
----

Configuration via Homebridge X GUI is provided, but for quick reference, this is what a configured switch would look like:

```
{
    "devices": [
        {
            "name": "Dev Switcher",
            "id": "Test0001",
            "manufacturer": "Test Manufacturer",
            "path": "/dev/cu.usbserial-145420",
            "baudRate": 57600,
            "inputs": 4,
            "powerOnCommand": "OUTON",
            "powerOffCommand": "OUTOFF",
            "outputSelectCommand": "OUT FR %d",
            "zeroIndexed": false,
            "commandEnd": "\r",
            "labels": [
                "TEST1",
                "TEST2",
                "TEST3",
                "TEST4"
            ]
        }
    ],
    "platform": "HDMISwitch"
}
```
