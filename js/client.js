async function play() {
  console.log("Playing...");
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  var audioContext = new AudioContext();

  const audioElement = document.querySelector('audio');
  const track = audioContext.createMediaElementSource(audioElement);
  const gainNode = audioContext.createGain();

  source = track.connect(gainNode);

  volumeControl = document.querySelector('#volume');
  volumeControl.addEventListener('input', function() {
    gainNode.gain.value = this.value;
  }, false);

  audioElement.play();

  // Get video stream
  const cam = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  });
  console.log("Got cam stream");

  // Display video
  video = document.querySelector("video");
  video.srcObject = cam;

  // Record video
  const ws = Webcast.Socket({
    url: "ws://source:hackme@localhost:8080/mount",
    mime: "video/webm",
    info: {}
  })
  const mediaRecorder = new MediaRecorder(cam, {
    mimeType: 'video/webm',
    videoBitsPerSecond: 3000000
  });
  mediaRecorder.ondataavailable = async function(e) {
    console.log("data recieved: "+e);
    const buf = await e.data.arrayBuffer();
    ws.sendData(buf);
  };
  mediaRecorder.start(1000/20); // 20 fps

  document.querySelector('#stop').addEventListener('click', function() { mediaRecorder.stop(); });

  var encoder = new Webcast.Encoder.Mp3({
    channels: 2,
    samplerate: 44100,
    bitrate: 128
  });
  // var webcast = audioContext.createWebcastSource(4096, 2);
  // source.connect(webcast);
  // webcast.connect(audioContext.destination);
  // webcast.connectSocket(encoder, "ws://source:hackme@localhost:8080/mount");
  // webcast.sendMetadata({
    // title:  "My Awesome Stream",
    // artist: "The Dude"
  // });
}

window.onload = function() {
  document.querySelector('button').addEventListener('click', play);
}
