#!/bin/env -S liquidsoap

width = 640
height = 360

set("log.level", 5)
set("frame.video.width", width)
set("frame.video.height", height)

speaker = input.harbor(buffer=2., "speaker", port=8000)

s = speaker
s = video.add_text(x=640, speed=100, "Hello world!", s)

# e = %ffmpeg(format="webm", %audio.copy, %video.copy)
# e = %ffmpeg(format="mpegts",
        # %audio(codec="ac3",channel_coupling=0),
        # %video(codec="libx264",b="2600k",
               # "x264-params"="scenecut=0:open_gop=0:min-keyint=150:keyint=150",
               # preset="ultrafast"))
# output.harbor(fallible=true, mount="mount", port=9000, format="video/webm", e, s)

# e = %ffmpeg(format="webm", %audio.copy, %video.copy)
# output.srt(mode="listener", port=3000, e, fallible=true, s)
# s = ffmpeg.decode.audio_video(s)

output.graphics(mksafe(s))
# output(fallible=true, s)

ytkey = string.trim(file.contents("youtube-key"))
ytenc = %ffmpeg(format="mpegts", %audio(codec="libmp3lame", samplerate=44100, q=5), %video(codec="libx264", width=854, height=480, b="800k", g=50, preset="veryfast"))

# output.youtube.live.hls(key=ytkey, encoder=ytenc, mksafe(s))

# e = %ffmpeg(format="mp4", %audio(codec="libmp3lame", q=4), %video(codec="libx264", preset="fast", crf=20))
# e = %ffmpeg(format="mpegts", %audio(codec="libmp3lame"), %video(codec="libx264"))
# e = %ffmpeg(format="mpegts", %audio(codec="libmp3lame"), %video(codec="libvpx"))
# output.harbor(mount="stream", port=8080, format="video/mp4", e, mksafe(s))