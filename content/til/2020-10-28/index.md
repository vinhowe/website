---
date: 2020-10-28
---

- https://wiki.archlinux.org/index.php/xorg#Invalid_MIT-MAGIC-COOKIE-1_key_when_trying_to_run_a_program_as_root
- https://source.chromium.org/chromium/chromium/src/+/master:third_party/glfw/src/src/x11_init.c;l=781?q=Xft&ss=chromium
- restarting chrome:
  - manually: `chrome://restart`
  - automated: `xdotool search --onlyvisible --class Chrome windowfocus key ctrl+l BackSpace type "chrome://restart"; xdotool key Return`
  - https://wiki.archlinux.org/index.php?title=Bluetooth_headset#Switch_between_HSP/HFP_and_A2DP_setting
- [LDAC support for PulseAudio](https://github.com/EHfive/pulseaudio-modules-bt)
- [How to apply a patch with Git](https://www.devroom.io/2009/10/26/how-to-create-and-apply-a-patch-with-git/)
