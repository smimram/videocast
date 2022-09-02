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
  const webcams = document.getElementById('webcams');
  webcams.disabled = true;
  const webcamId = webcams.value;
  const webcam = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100,
    },
    video: {
      deviceId: webcamId,
    }
  });

  // Display video
  video = document.getElementById('video');
  video.srcObject = webcam;

  // Record video
  const user = document.getElementById('user').value;
  const password = document.getElementById('password').value;
  const server = document.getElementById('server').value;
  const port = document.getElementById('port').value;
  const mount = document.getElementById('mount').value;
  const url = `ws://${user}:${password}@${server}:${port}/${mount}`;

  const bps = document.getElementById('kbps').value * 1000;
  const mediaRecorder = new MediaRecorder(webcam, {
    mimeType: 'video/webm',
    videoBitsPerSecond: bps
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
        console.log(`Reconnecting... (${connectCount})`);
        connect();
      }
      else {
        console.log('Maximum connection tries reached, aborting.');
      }
    }

    if (mediaRecorder.state != "inactive") { mediaRecorder.stop() }
    const ws = new Webcast.Socket({
      mediaRecorder,
      url: url,
      info: {},
      onopen: onopen,
      onerror: onerror
    });
    const fps = document.getElementById('fps').value;
    mediaRecorder.start(1000/fps);
  }

  connect();

  function stop() {
    webcams.disabled = false;
    mediaRecorder.stop();
    webcam.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }

  document.getElementById('stop').addEventListener('click', stop);
}

function base_url() {
  const server = document.getElementById('server').value;
  const port = document.getElementById('port').value;
  return `http://${server}:${port}`;
}

function refresh_slide () {
  document.getElementById('slide').src = base_url() + "/slide?" + new Date().getTime();
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
  data = document.getElementById('slides-file').files[0];
  document.getElementById('upload-slides').innerHTML = "<p>Uploading...</p>";
  fetch(base_url() + "/upload", {method: "POST", body: data}).then((response) => response.text()).then((text) => document.querySelector('#upload-slides').innerHTML = '<p>Uploaded! ' + text + '</p>');
}

function enumerateWebcams() {
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    const select = document.getElementById('webcams');
    let count = 0;
    devices.forEach(device => {
      if (device.kind === 'videoinput') {
        const option = document.createElement('option');
        option.value = device.deviceId;
        const label = device.label || `Camera ${count++}`;
        const textNode = document.createTextNode(label);
        option.appendChild(textNode);
        select.appendChild(option);
      }
    });
  });
}

function send_message() {
  nick = document.getElementById('chat-nick').value;
  message = document.getElementById('chat-message').value;
  if (message != '') {
    document.getElementById('chat-message').value = '';
    url = base_url() + "/chat/message";
    data = `<${nick}> ${message}`;
    console.log("Message: " + data);
    document.getElementById('chat').value += '\n' + data;
    fetch(url, {method: "POST", body: data})
  }
}

function watch_chat() {
  if (document.getElementById('chat-update').checked)
    fetch(base_url() + "/chat/get").then((response) => response.text()).then((text) => document.getElementById('chat').value = text);
  setTimeout(watch_chat, 1000);
}

window.onload = function() {
  document.getElementById('start').addEventListener('click', play);
  document.getElementById('prev').addEventListener('click', prev);
  document.getElementById('next').addEventListener('click', next);
  refresh_slide();
  document.addEventListener('keydown', on_key);
  document.getElementById('upload-slides').addEventListener('submit', function(event) {event.preventDefault(); upload_slides()});
  enumerateWebcams();
  watch_chat();
  document.getElementById('chat-message').addEventListener('keydown', function(event) {if(event.key === 'Enter') send_message()});
}
