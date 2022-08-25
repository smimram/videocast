#!../liquidsoap/liquidsoap

width = 640
height = 360

set("log.level", 5)
set("frame.video.width", width)
set("frame.video.height", height)

s = input.harbor(buffer=2., "speaker", port=8000)
s = fallback(track_sensitive=false, [s, video.color(0x0000ff)])

output.graphics(s)
