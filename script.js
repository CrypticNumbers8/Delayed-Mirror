const cameraVideo = document.getElementById('cameraVideo');
const delayedCanvas = document.getElementById('delayedCanvas');
const delayInput = document.getElementById('delay');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const recordingIndicator = document.getElementById('recordingIndicator');
const recordedTime = document.getElementById('recordedTime');
const downloadButton = document.getElementById('downloadButton');

let delay = parseInt(delayInput.value, 10);
let isCapturing = false;
let framesBuffer = [];
let mediaRecorder;
let recordedChunks = [];
let startTime;

function updateDelay() {
  delay = parseInt(delayInput.value, 10);
}

delayInput.addEventListener('change', updateDelay);

function captureFrame() {
  const frame = document.createElement('canvas');
  frame.width = delayedCanvas.width;
  frame.height = delayedCanvas.height;
  const ctx = frame.getContext('2d');
  ctx.drawImage(cameraVideo, 0, 0, delayedCanvas.width, delayedCanvas.height);
  framesBuffer.push(frame);
}

// function displayDelayedFrame() {
//   const ctx = delayedCanvas.getContext('2d');
//   const frame = framesBuffer.shift();
//   if (frame) {
//     ctx.clearRect(0, 0, delayedCanvas.width, delayedCanvas.height);
//     ctx.drawImage(frame, 0, 0, delayedCanvas.width, delayedCanvas.height);
//   }

//   const recordedSeconds = Math.floor((Date.now() - startTime) / 1000);
//   recordedTime.textContent = `Recording: ${recordedSeconds}s`;

//   if (recordedSeconds > 9) {
//     restartMessage.style.display = 'inline';
//   } else {
//     restartMessage.style.display = 'none';
//   }

//   if (isCapturing) {
//     setTimeout(() => {
//       requestAnimationFrame(displayDelayedFrame);
//     }, 22); // Delay of 4 seconds
//   }
// }

function displayDelayedFrame() {
  const ctx = delayedCanvas.getContext('2d');
  const frame = framesBuffer.shift();
  if (frame) {
    ctx.clearRect(0, 0, delayedCanvas.width, delayedCanvas.height);
    ctx.drawImage(frame, 0, 0, delayedCanvas.width, delayedCanvas.height);
  }

  const recordedSeconds = Math.floor((Date.now() - startTime) / 1000);
  recordedTime.textContent = `Recording: ${recordedSeconds}s`;

  if (recordedSeconds > 90) {
    restartMessage.style.display = 'inline';
  } else {
    restartMessage.style.display = 'none';
  }

  if (isCapturing) {
    setTimeout(() => {
      requestAnimationFrame(displayDelayedFrame);
    }, delay * 6.25);
  }
}

function startCapture() {
  isCapturing = true;
  framesBuffer = [];
  startButton.disabled = true;
  stopButton.disabled = false;
  downloadButton.disabled = true;
  startTime = Date.now();
  recordedTime.textContent = 'Recording...';

  mediaRecorder = new MediaRecorder(cameraVideo.srcObject);
  mediaRecorder.ondataavailable = (event) => {
    recordedChunks.push(event.data);
  };
  mediaRecorder.onstop = () => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    downloadButton.href = url;
    downloadButton.download = `my_delayed_recording_${timestamp}.webm`;
    downloadButton.disabled = false;
    startButton.classList.remove('recording');
    recordingIndicator.style.display = 'none';
    recordedTime.textContent = `Recording Stopped: ${Math.floor(
      (Date.now() - startTime) / 1000
    )}s`;
  };

  mediaRecorder.start();
  captureLoop();
  requestAnimationFrame(displayDelayedFrame);

  startButton.classList.add('recording');
  recordingIndicator.style.display = 'block';
}

function stopCapture() {
  isCapturing = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  mediaRecorder.stop();

  const recordedSeconds = Math.floor((Date.now() - startTime) / 1000);
  if (recordedSeconds > 0) {
    downloadButton.style.display = 'inline-block';
  } else {
    downloadButton.style.display = 'none';
  }
}

function captureLoop() {
  if (isCapturing) {
    captureFrame();
    setTimeout(captureLoop, 1000 / 30); // Capture at 30 fps
  }
}

startButton.addEventListener('click', startCapture);
stopButton.addEventListener('click', stopCapture);

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    cameraVideo.srcObject = stream;
  })
  .catch((error) => {
    console.error('Error accessing webcam:', error);
  });

downloadButton.addEventListener('click', () => {
  const blob = new Blob(recordedChunks, { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `delayed_recording_${timestamp}.mp4`;
  a.style.display = 'none';
  document.body.appendChild(a);

  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
});

let spacebarPressed = false;

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !spacebarPressed) {
    spacebarPressed = true;
    startCapture();
  } else if (event.code === 'Space' && spacebarPressed) {
    spacebarPressed = false;
    stopCapture();
  }
});
