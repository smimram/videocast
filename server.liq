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
harbor.http.static(content_type=content_type, path="/control", ".")

### The slideshow

# Convert a pdf to a list of png files.
def pdf2png(pdf)
  dir = file.temp_dir("liqpdf")
  if process.test("pdftoppm -png #{process.quote(pdf)} #{dir}/pdf") then
    file.ls(absolute=true, sorted=true, dir)
  else
    []
  end
end
# slides = video.color(0x00ff00)
png = pdf2png("slides.pdf")
# print("png files: #{png}")
slides = video.slideshow(png)

# Move slides
def advance(next)
  fun (~protocol=_, ~data=_, ~headers=_, _) -> begin
    if next then slides.next() else slides.prev() end
    http.response(headers=[("Access-Control-Allow-Origin","*")])
  end
end
harbor.http.register("prev", advance(false))
harbor.http.register("next", advance(true))

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
def upload(~protocol=_, ~data, ~headers, url)
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

speaker = input.harbor(buffer=2., "speaker", port=8000)
# speaker = single("harbor.webm")
# speaker = (single("harbor.webm") : source(video=canvas(width=100,height=100)))
speaker = video.crop(speaker)
speaker = fallback(track_sensitive=false, [speaker, video.color(0x0000ff)])

### Combine everybody

slides = video.align(top=true, left=true, slides)
speaker = video.resize(proportional=true, width=120, height=120, speaker)
speaker = video.align(top=true, right=true, speaker)
speaker = video.translate(x=width-120, speaker)
s = add([slides, speaker])
s = video.add_text(x=640, y=320, speed=100, color=0xff0000, "Hello world!", s)

### Encode

output.graphics(mksafe(s))

ytkey = string.trim(file.contents("youtube-key"))
ytenc = %ffmpeg(format="mpegts", %audio(codec="libmp3lame", samplerate=44100, q=5), %video(codec="libx264", width=width, height=height, b="800k", g=50, preset="veryfast"))

output.youtube.live.hls(key=ytkey, encoder=ytenc, mksafe(s))
