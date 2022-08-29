#!../liquidsoap/liquidsoap
#!/bin/env -S liquidsoap

width = 640
height = 360

set("log.level", 5)
set("frame.video.width", width)
set("frame.video.height", height)

### The server

def content_type(fname)
  if string.contains(suffix=".html", fname) then "text/html"
  elsif string.contains(suffix=".css", fname) then "text/css"
  elsif string.contains(suffix=".js", fname) then "text/javascript"
  else "text/plain"
  end
end
harbor.http.static(content_type=content_type, path="/speaker", ".")

interactive.harbor()

### The slideshow

# Convert a pdf to a list of png files.
def pdf2png(pdf)
  dir = file.temp_dir("liqpdf")
  if process.test(timeout=60., "pdftoppm -png #{process.quote(pdf)} #{dir}/pdf") then
    file.ls(absolute=true, sorted=true, dir)
  else
    []
  end
end
# slides = video.color(0x00ff00)
png = pdf2png("liquidsoap.pdf")
# print("png files: #{png}")
slides = video.slideshow(png)

# Move slides
def advance(next)
  fun (~protocol=_, ~data=_, ~headers=_, _) -> begin
    if next then log.info("Going to the next slide.") else log.info("Going to the previous slide.") end
    if next then slides.next() else slides.prev() end
    http.response(headers=[("Access-Control-Allow-Origin","*")])
  end
end
harbor.http.register("prev", advance(false))
harbor.http.register("next", advance(true))
interactive.unit("prev", description="Go to the previous slide.", slides.prev)
interactive.unit("next", description="Go to the next slide.", slides.next)

# Current slide
def slide(~protocol=_, ~data=_, ~headers=_, _)
  http.response(data=file.contents(slides.current()))
end
harbor.http.register("slide", slide)

# Upload slides
def upload_options(~protocol=_, ~data=_, ~headers=_, _)
  http.response(headers=[("Access-Control-Allow-Origin","*"),("Access-Control-Allow-Headers","*")], code=204)
end
harbor.http.register(method="OPTIONS", "upload", upload_options)
def upload(~protocol=_, ~data, ~headers, _)
  print("headers: #{headers}")
  # print("GOT DATA")
  # print("headers: #{headers}")
  # print("url: #{url}")
  # print("DATA: <#{data}>")
  # print("END DATA")
  fname = file.temp("liq", ".pdf")
  file.write(data=data, fname)
  png = pdf2png(fname)
  log.important("Adding #{list.length(png)} slides")
  slides.append(png)
  http.response(headers=[("Access-Control-Allow-Origin","*")], data="Added #{list.length(png)} slides.")
end
harbor.http.register(method="POST", "upload", upload)

### The speaker

speaker = input.harbor(buffer=1., "speaker", port=8000)
speaker = video.crop(speaker)
speaker = fallback(track_sensitive=false, [speaker, video.color(0x0000ff)])

### Guests

guest1 = input.harbor(buffer=1., "guest1", port=8000)
guest1 = video.crop(guest1)
guest1 = fallback(track_sensitive=false, [guest1, video.color(0x00ff00)])

guest2 = input.harbor(buffer=1., "guest2", port=8000)
guest2 = video.crop(guest2)
guest2 = fallback(track_sensitive=false, [guest2, video.color(0xff0000)])

### Combine everybody

slides = video.align(slides)
slides = video.resize(width=width-120, height=height, slides)

speaker = video.resize(proportional=true, width=120, height=120, speaker)

# TODO: the following makes a segv when changing the value...
# swap = interactive.bool("swap-speaker-slides", description="Swap speaker and slides.", false)
# slides' = slides
# slides = source.dynamic({if swap() then speaker else slides end})
# speaker = source.dynamic({if swap() then slides' else speaker end})

speaker = video.align(top=true, right=true, speaker)
speaker = video.translate(x=width-120, speaker)

guest1 = video.resize(proportional=true, width=120, height=120, guest1)
guest1 = video.align(right=true, guest1)
guest1 = video.translate(x=width-120, y=120, guest1)

guest2 = video.resize(proportional=true, width=120, height=120, guest2)
guest2 = video.align(bottom=true, right=true, guest2)
guest2 = video.translate(x=width-120, y=240, guest2)

white = video.color(0xffffff)

s = add([white, slides, guest1, guest2, speaker])
s = video.add_text(x=640, y=320, speed=100, color=0xff0000, "Hello world!", s)

### Encode

output.graphics(mksafe(s))

ytkey = string.trim(file.contents("youtube-key"))
ytenc = %ffmpeg(format="flv", %audio(codec="libmp3lame", samplerate=44100, q=5), %video(codec="libx264", width=width, height=height, b="800k", g=50, preset="veryfast"))

# output.youtube.live.rtmp(key=ytkey, encoder=ytenc, mksafe(s))
