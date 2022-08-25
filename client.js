async function play() {
  console.log("Playing...");
  // window.AudioContext = window.AudioContext || window.webkitAudioContext;

  // var audioContext = new AudioContext();

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
  const webcam = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  });

  // Display video
  video = document.querySelector("video");
  video.srcObject = webcam;

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
  const mediaRecorder = new MediaRecorder(webcam, {
    mimeType: 'video/webm',
    videoBitsPerSecond: 3000000
  });
  const ws = new Webcast.Socket({
    mediaRecorder,
    url: url,
    info: {}
  })
  mediaRecorder.start(1000/20); // 20 fps

  function stop() {
    mediaRecorder.stop();
    webcam.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }

  document.querySelector('#stop').addEventListener('click', stop);
}

function base_url() {
  return "http://"
    + document.querySelector('#server').value
    + ":"
    + document.querySelector('#port').value;
}

function refresh_slide () {
  document.querySelector('#slide').src = base_url() + "/slide?" + new Date().getTime();
}

async function prev() {
  fetch(base_url() + "/prev");
  refresh_slide();
}
async function next() {
  fetch(base_url() + "/next");
  refresh_slide();
}

window.onload = function() {
  document.querySelector('#start').addEventListener('click', play);
  document.querySelector('#prev').addEventListener('click', prev);
  document.querySelector('#next').addEventListener('click', next);
  refresh_slide();
}
