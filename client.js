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
  const user = document.querySelector('#user').value;
  const password = document.querySelector('#password').value;
  const server = document.querySelector('#server').value;
  const port = document.querySelector('#port').value;
  const mount = document.querySelector('#mount').value;
  const url = `ws://${user}:${password}@${server}:${port}/${mount}`;

  const mediaRecorder = new MediaRecorder(webcam, {
    mimeType: 'video/webm',
    videoBitsPerSecond: 3000000
  });

  const connectMax = 10;
  let connectCount = 0;

  function connect() {
    function onopen(event) {
      console.log("Connected!");
      connectCount = 0;
    }

    function onerror(event) {
      console.log('WebSocket error: ', event);
      if (connectCount++ <= connectMax) {
        console.log('Reconnecting... (', connectCount, ')');
        connect();
      }
      else {
        console.log('Maximum connection tries reached, aborting.');
      }
    }

    mediaRecorder.stop();
    const ws = new Webcast.Socket({
      mediaRecorder,
      url: url,
      info: {},
      onopen: onopen,
      onerror: onerror
    });
    mediaRecorder.start(1000/20); // 20 fps
  }

  connect();

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
  // console.log("Previous slide");
  fetch(base_url() + "/prev").then((_) => refresh_slide());
}

async function next() {
  // console.log("Next slide");
  fetch(base_url() + "/next").then((_) => refresh_slide());
}

function on_key(e) {
  switch (e.keyCode) {
  case 37:
    // alert('left');
    prev();
    break;
  case 39:
    // alert('right');
    next();
    break;
  }
}

function upload_slides() {
  data = document.querySelector('#slides-file').files[0];
  document.querySelector('#upload-slides').innerHTML = "<p>Uploading...</p>";
  fetch(base_url() + "/upload", {method: "POST", body: data}).then((response) => response.text()).then((text) => document.querySelector('#upload-slides').innerHTML = '<p>Uploaded! ' + text + '</p>');
}

window.onload = function() {
  document.querySelector('#start').addEventListener('click', play);
  document.querySelector('#prev').addEventListener('click', prev);
  document.querySelector('#next').addEventListener('click', next);
  refresh_slide();
  document.addEventListener('keydown', on_key);
  document.querySelector('#upload-slides').addEventListener('submit', function(event) {event.preventDefault(); upload_slides()});
}
