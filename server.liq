#!/bin/env -S liquidsoap

set("log.level", 5)
set("frame.video.width", 640)
set("frame.video.height", 480)

s = input.harbor("mount", dumpfile="harbor.webm", port=8000)

# e = %ffmpeg(format="webm", %audio.copy, %video.copy)
# e = %ffmpeg(format="mpegts",
        # %audio(codec="ac3",channel_coupling=0),
        # %video(codec="libx264",b="2600k",
               # "x264-params"="scenecut=0:open_gop=0:min-keyint=150:keyint=150",
               # preset="ultrafast"))
# output.harbor(fallible=true, mount="mount", port=9000, format="video/webm", e, s)

e = %ffmpeg(format="webm", %audio.copy, %video.copy)
output.srt(mode="listener", port=3000, e, fallible=true, s)

# output.graphics(fallible=true, s)
# output(fallible=true, s)
