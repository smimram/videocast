async function play() {
  console.log("Playing...");
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  var audioContext = new AudioContext();

  /*
  const audioElement = document.querySelector('audio');
  const track = audioContext.createMediaElementSource(audioElement);
  const gainNode = audioContext.createGain();

  source = track.connect(gainNode);

  volumeControl = document.querySelector('#volume');
  volumeControl.addEventListener('input', function() {
    gainNode.gain.value = this.value;
  }, false);

  audioElement.play();
  */

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
  //url = "ws://source:hackme@localhost:8080/mount"
  url = "ws://"
    + document.querySelector('#user').value
    + ":"
    + document.querySelector('#password').value
    + "@"
    + document.querySelector('#server').value
    + ":"
    + document.querySelector('#port').value
    + "/"
    + document.querySelector('#mount').value;
  const ws = Webcast.Socket({
    url: url,
    mime: "video/webm",
    info: {}
  })
  const mediaRecorder = new MediaRecorder(cam, {
    mimeType: 'video/webm',
    videoBitsPerSecond: 3000000
  });
  mediaRecorder.ondataavailable = async function(e) {
    const buf = await e.data.arrayBuffer();
    console.log("got data!");
    // console.log("data recieved: " + buf.byteLength);
    // console.log("isOpen: " + ws.readyState);
    // console.log("value: " + WebSocket.OPEN);
    // console.log("bla: " + (ws.readyState === WebSocket.OPEN));
    // console.log("buf: " + buf);
    ws.send(buf);
  };
  mediaRecorder.start(1000/20); // 20 fps

  document.querySelector('#stop').addEventListener('click', function() { mediaRecorder.stop(); });
}

window.onload = function() {
  document.querySelector('#start').addEventListener('click', play);
}
