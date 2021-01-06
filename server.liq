#!/bin/env -S liquidsoap

set("log.level", 5)
set("frame.video.width", 640)
set("frame.video.height", 480)

s = input.harbor("mount", dumpfile="harbor.webm", port=8080)
output.graphics(fallible=true, s)
output(fallible=true, s)
