const audioCtx = new AudioContext();

const canvas2 = document.getElementById("canvas2");
const canvas2Ctx = canvas2.getContext("2d");
const canvasOscilloscope = document.getElementById("canvas-oscilloscope");
const canvasOscilloscopeCtx = canvasOscilloscope.getContext("2d");

canvas2Ctx.fillStyle = "black";
canvas2Ctx.fillRect(0, 0, canvas2.width, canvas2.height);
let canvasLineColor = "red";
canvas2Ctx.strokeStyle = canvasLineColor;
canvasOscilloscopeCtx.strokeStyle = canvasLineColor;
let canvasPointColor = "#999";
let canvasGridColor = "#e3e3e3";
// Create gradient
let canvasGradient = canvas2Ctx.createRadialGradient(150.900, 152.100, 0.000, 153.000, 150.000, 150.000);
// Add colors
canvasGradient.addColorStop(0.000, 'rgba(136, 228, 246, 1.000)');
canvasGradient.addColorStop(0.748, 'rgba(168, 235, 247, 1.000)');
canvasGradient.addColorStop(1.000, 'rgba(179, 237, 249, 1.000)');
let canvasBackgroundColor = canvasGradient;
canvasBackgroundColor = "#E7ECEB";

let tone = 441;
let sampleFreq = audioCtx.sampleRate / tone;
let samplesInOneOscillation = sampleFreq; //determines pitch, 100 = 441hz
const samplesOnGraph = 109;
let oldSamplesInOneOscillation = samplesInOneOscillation;
let samplePoints = [];
let userPoints = [];
let userPointsOnGraph = [];
initSamplePoints();

let mouseX, mouseY;
let canvasSizeOffsetX = canvas2.width * 0.01;
let canvasSizeOffsetY = canvas2.height * 0.01;

let canvasOffsetLeft = canvas2.offsetLeft;
let canvasOffsetTop = canvas2.offsetTop;

canvas2.addEventListener("mousemove", (evt) => {
  mouseX = (evt.pageX - canvasOffsetLeft);
  mouseY = (evt.pageY - canvasOffsetTop);
});

canvas2.addEventListener("click", (evt) => {
  //if some key is pressed (some source exists) , stop all sources
  if (Object.keys(sources).length !== 0) {
    for (let k in sources) {
      sources[k].source.stop(0);
    }
    sources = [];
  }
  addPoint(mouseX, mouseY);

});
let samplePointsToPlay = [];

function initSamplePoints() {
  samplePoints = [];
  for (let i = 0; i < samplesOnGraph; i++) {
    samplePoints[i] = 0;
  }
}
function setTone(freq) {
  let tone = freq;
  sampleFreq = audioCtx.sampleRate / tone;
  samplesInOneOscillation = sampleFreq; //determines pitch, 100 = 441hz
  samplePointsToPlay = [];
  for (let i = 0; i < samplesInOneOscillation; i++) {
    samplePointsToPlay[i] = 0;
  }
  //rebuild the waveform at new tone if user added points
  let oldUserPoints = userPoints;
  userPoints = [];
  if (oldUserPoints.length > 0) {
    for (let i = 0; i < oldUserPoints.length; i++) {
      addOldPoint(oldUserPoints[i].x, oldUserPoints[i].y);
    }
  }
  oldSamplesInOneOscillation = samplesInOneOscillation;
}
//for re sampling wave at different pitch
//same as below but with different x scaling and without y scaling since y points are scaled
//adds the user point to a stretched sample array of correct length(pitch) to play
function addOldPoint(posX, posY) {
  let sampleY = posY;
  //offset X by tone ratio change
  let sampleX = Math.round(posX * (samplesInOneOscillation / oldSamplesInOneOscillation));
  //add amplitude at time
  samplePointsToPlay[sampleX] = sampleY;
  userPoints.push({ x: sampleX, y: sampleY });
  getInterpolationRegion(samplePointsToPlay);
}

function addPoint(posX, posY) {
  //transform mouse Y from 0 - 100 to 1 to -1
  //using canvas offset value to get position as if canvas was of size 100x100
  let sampleY = ((posY / (canvas2.offsetHeight * 0.01)) / 50);
  sampleY = (sampleY - 1);
  let sampleX = Math.round((posX / (canvas2.offsetWidth * 0.01)) * (samplesOnGraph * 0.01));
  //add amplitude at time
  samplePoints[sampleX] = sampleY;
  userPoints.push({ x: sampleX, y: sampleY });
  userPointsOnGraph.push({ x: sampleX, y: sampleY });
  getInterpolationRegion(samplePoints);
  visualizeSamplesAsPoints();
}
function getInterpolationRegion(arrr) {
  let interpolationStartIndex = 0;
  let interpolationEndIndex = 0;
  for (let x = 0; x < arrr.length; x++) {
    let y = arrr[x];
    //check if y value is in user points
    let exists = Object.keys(userPoints).some(function (k) {
      return userPoints[k].y === y;
    });
    //interpolate between user points
    if (exists) {
      //set the end of this interpolation to this index
      interpolationEndIndex = x;
      //interpolate between added samples
      linearInterpolation(interpolationStartIndex, interpolationEndIndex, arrr);
      //set the start of next interpolation to this index
      interpolationStartIndex = x;
    }
  }
}
function linearInterpolation(start, end, arrr) {
  //the region in the array to interpolate
  let length = (end - start);
  let y0 = arrr[start];
  let x0 = 0;
  let y1 = arrr[end];
  let x1 = length;
  let x = 1;
  for (let i = 1; i < length; i++) {
    x = i;
    arrr[start + i] = (y0 * (x1 - x) + y1 * (x - x0)) / x1 - x0; //linear interpolation function
  }
}

let clearCanvasButton = document.getElementById("clear-canvas");
clearCanvasButton.addEventListener("click", () => {
  samplePoints = [];
  samplePointsToPlay = [];
  userPoints = [];
  userPointsOnGraph = [];
  initSamplePoints();
  setTone(tone);
  visualizeSamplesAsPoints();
});

visualizeSamplesAsPoints();

function visualizeSamplesAsPoints() {
  canvas2Ctx.clearRect(0, 0, canvas2.width, canvas2.height);
  canvas2Ctx.fillStyle = canvasBackgroundColor;
  canvas2Ctx.fillRect(0, 0, canvas2.width, canvas2.height);

  canvas2Ctx.fillStyle = canvasGridColor;
  canvas2Ctx.fillRect(canvas2.width / 2 - (canvas2.width / 200), 0, canvas2.width / 100, canvas2.height);
  canvas2Ctx.fillRect(0, canvas2.height / 2 - (canvas2.height / 200), canvas2.width, canvas2.height / 100);

  canvas2Ctx.lineWidth = canvas2.width / 80;
  canvas2Ctx.beginPath();
  for (let x = 0; x < samplePoints.length; x++) {
    let y = samplePoints[x];
    //with stretching to fit tone (waveform wont shrink/expand on canvas when changing hz)
    canvas2Ctx.moveTo((x * 100 / samplesOnGraph) * canvasSizeOffsetX, (samplePoints[x] * canvas2.height / 2) + canvas2.height / 2);
    canvas2Ctx.lineTo(((x * 100 / samplesOnGraph) * canvasSizeOffsetX) + canvasSizeOffsetX, (samplePoints[x + 1] * canvas2.height / 2) + canvas2.height / 2);
    canvas2Ctx.stroke();
  }
  canvas2Ctx.fillStyle = canvasPointColor;
  let pointWidth = canvas2.width / 40;
  for (let i = 0; i < userPointsOnGraph.length; i++) {
    canvas2Ctx.fillRect((((userPointsOnGraph[i].x * 100 / samplesOnGraph) * canvasSizeOffsetX) + canvasSizeOffsetX) - (pointWidth / 1.3), ((userPointsOnGraph[i].y * canvas2.height / 2) + canvas2.height / 2) - (pointWidth / 2), pointWidth, pointWidth);
  }
}
//all the sounds playing
let sources = [];
//handle keyboard
let keyboardKeys = document.getElementsByClassName("keyboard-key");
document.addEventListener('keypress', function (event) {
  for (let i = 0; i < keyboardKeys.length; i++) {
    if (keyboardKeys[i].id.toLowerCase() === event.key.toLowerCase()) {
      playSourceAtPitch(keyboardKeys[i]);
    }
  }
});

document.addEventListener('keyup', function (event) {
  for (let i = 0; i < keyboardKeys.length; i++) {
    if (keyboardKeys[i].id.toLowerCase() === event.key.toLowerCase()) {
      stopSourceAtKey(keyboardKeys[i]);
    }
  }
});


let touched1Keys = [];
let touched2Keys = [];
let touched3Keys = [];

//DRY this....
window.addEventListener("touchstart", function (evt) {
  if (evt.touches[0].identifier === 0) {
    let touchLocationX = evt.touches[0].clientX;
    let touchLocationY = evt.touches[0].clientY;
    playKeyWithTouch1(touchLocationX, touchLocationY);
    //TODO: clean up and DRY this logic, make it work for N touches
  }
  if (evt.touches[1] && evt.touches[1].identifier === 1) {
    let touchLocationX = evt.touches[1].clientX;
    let touchLocationY = evt.touches[1].clientY;
    playKeyWithTouch2(touchLocationX, touchLocationY);
  }
  if (evt.touches[2] && evt.touches[2].identifier === 2) {
    let touchLocationX = evt.touches[2].clientX;
    let touchLocationY = evt.touches[2].clientY;
    playKeyWithTouch3(touchLocationX, touchLocationY);
  }
});

//play the sound of the key at the location of the touch
window.addEventListener("touchmove", function (evt) {
  if (evt.touches[0].identifier === 0) {
    let touchLocationX = evt.touches[0].clientX;
    let touchLocationY = evt.touches[0].clientY;
    playKeyWithTouch1(touchLocationX, touchLocationY);
    //stop playing if touch moves outside of button
    //TODO: clean up and DRY this logic, make it work for N touches
    for (let i in touched1Keys) {
      if (touched1Keys[i] !== "") {
        if (touchLocationX < touched1Keys[i].getBoundingClientRect().left || touchLocationX > touched1Keys[i].getBoundingClientRect().right ||
          touchLocationY < touched1Keys[i].getBoundingClientRect().top || touchLocationY > touched1Keys[i].getBoundingClientRect().bottom) {
          stopSourceAtKey(keyboardKeys[i]);
          touched1Keys[i] = "";
        }
      }
    }
  }
  if (evt.touches[1] && evt.touches[1].identifier === 1) {
    let touchLocationX = evt.touches[1].clientX;
    let touchLocationY = evt.touches[1].clientY;
    playKeyWithTouch2(touchLocationX, touchLocationY);
    //stop playing if touch moves outside of button
    for (let i in touched2Keys) {
      if (touched2Keys[i] !== "") {
        if (touchLocationX < touched2Keys[i].getBoundingClientRect().left || touchLocationX > touched2Keys[i].getBoundingClientRect().right ||
          touchLocationY < touched2Keys[i].getBoundingClientRect().top || touchLocationY > touched2Keys[i].getBoundingClientRect().bottom) {
          stopSourceAtKey(keyboardKeys[i]);
          touched2Keys[i] = "";
        }
      }
    }
  }
  if (evt.touches[2] && evt.touches[2].identifier === 2) {
    let touchLocationX = evt.touches[2].clientX;
    let touchLocationY = evt.touches[2].clientY;
    playKeyWithTouch3(touchLocationX, touchLocationY);
    //stop playing if touch moves outside of button
    for (let i in touched3Keys) {
      if (touched3Keys[i] !== "") {
        if (touchLocationX < touched3Keys[i].getBoundingClientRect().left || touchLocationX > touched3Keys[i].getBoundingClientRect().right ||
          touchLocationY < touched3Keys[i].getBoundingClientRect().top || touchLocationY > touched3Keys[i].getBoundingClientRect().bottom) {
          stopSourceAtKey(keyboardKeys[i]);
          touched3Keys[i] = "";
        }
      }
    }
  }
});
window.addEventListener("touchend", function (evt) {
  if (evt.changedTouches[0].identifier === 0) {
    for (let i in touched1Keys) {
      if (touched1Keys[i] !== "") {
        stopSourceAtKey(keyboardKeys[i]);
        touched1Keys[i] = "";
      }
    }
  }
  if (evt.changedTouches[0].identifier === 1) {
    for (let i in touched2Keys) {
      if (touched2Keys[i] !== "") {
        stopSourceAtKey(keyboardKeys[i]);
        touched2Keys[i] = "";
      }
    }
  }
  if (evt.changedTouches[0].identifier === 2) {
    for (let i in touched3Keys) {
      if (touched3Keys[i] !== "") {
        stopSourceAtKey(keyboardKeys[i]);
        touched3Keys[i] = "";
      }
    }
  }
});

function playKeyWithTouch1(touchX, touchY) {
  for (let i in keyboardKeys) {
    //at this point, keyboardkeys array contains some non html element data
    if (typeof keyboardKeys[i] === "object") {
      if (touchX > keyboardKeys[i].getBoundingClientRect().left && touchX < keyboardKeys[i].getBoundingClientRect().right &&
        touchY > keyboardKeys[i].getBoundingClientRect().top && touchY < keyboardKeys[i].getBoundingClientRect().bottom) {
        playSourceAtPitch(keyboardKeys[i]);
        touched1Keys[i] = keyboardKeys[i];
      }
    }
  }
}

function playKeyWithTouch2(touchX, touchY) {
  for (let i in keyboardKeys) {
    //at this point, keyboardkeys array contains some non html element data
    if (typeof keyboardKeys[i] === "object") {
      if (touchX > keyboardKeys[i].getBoundingClientRect().left && touchX < keyboardKeys[i].getBoundingClientRect().right &&
        touchY > keyboardKeys[i].getBoundingClientRect().top && touchY < keyboardKeys[i].getBoundingClientRect().bottom) {
        playSourceAtPitch(keyboardKeys[i]);
        touched2Keys[i] = keyboardKeys[i];
      }
    }
  }
}

function playKeyWithTouch3(touchX, touchY) {
  for (let i in keyboardKeys) {
    //at this point, keyboardkeys array contains some non html element data
    if (typeof keyboardKeys[i] === "object") {
      if (touchX > keyboardKeys[i].getBoundingClientRect().left && touchX < keyboardKeys[i].getBoundingClientRect().right &&
        touchY > keyboardKeys[i].getBoundingClientRect().top && touchY < keyboardKeys[i].getBoundingClientRect().bottom) {
        playSourceAtPitch(keyboardKeys[i]);
        touched3Keys[i] = keyboardKeys[i];
      }
    }
  }
}

let octaveTextElement = document.getElementById("octave-text");
let masterOctave = 2;
let masterOctaveButtons = document.getElementsByClassName("octave-button");
let octaveMultiplicationValue = 1;

for (let i = 0; i < masterOctaveButtons.length; i++) {
  masterOctaveButtons[i].addEventListener('click', function (evt) {
    if (this.id === "octave-up" && masterOctave < 4) {
      stopAllSources();
      masterOctave++;

      //multiply value for keys
      for (let x in keyboardKeys) {
        keyboardKeys[x].value *= 2;
      }
    }
    else if (this.id === "octave-down" && masterOctave > 1) {
      stopAllSources();
      masterOctave--;
      //multiply value for keys
      for (let x in keyboardKeys) {
        keyboardKeys[x].value *= 0.5;
      }
    }
    octaveTextElement.textContent = masterOctave;
  });
}
function stopAllSources() {
  for (let k in sources) {
    sources[k].source.stop(0);
    delete sources[k];
  }
  sources = [];
}
//these keys are only displayed, real touch events occur on smaller keys
let keyboardKeysDisplay = document.getElementsByClassName("keyboard-key-display");

function playSourceAtPitch(elem) {
  let exists = Object.keys(sources).some(function (k) {
    return sources[k].keyVal === elem.id;
  });
  //if the note isn't already playing
  if (!exists) {
    setTone(elem.value);
    playSoundLooping(samplePointsToPlay, elem.id, elem.value, elem.getBoundingClientRect());
    //only add pressed class to actual black keys, not actual white keys
    if (elem.getAttribute("type") === "black") elem.className += " button-pressed";
    //add pressed class to display keys
    for (let x in keyboardKeysDisplay) {
      if (keyboardKeysDisplay[x].value === elem.id) {
        keyboardKeysDisplay[x].className += " button-pressed";
      }
    }
  }
}
//stops the source playing at the key on key up at key
function stopSourceAtKey(elem) {
  for (let k in sources) {
    if (sources[k].keyVal === elem.id) {
      sources[k].source.stop(0);
      delete sources[k];
    }
  }
  //remove pressed class from display keys
  for (let x in keyboardKeysDisplay) {
    if (keyboardKeysDisplay[x].value === elem.id) {
      keyboardKeysDisplay[x].classList.remove("button-pressed");
    }
  }
  //only remove pressed class from actual black keys, not actual white keys
  if (elem.getAttribute("type") === "black") elem.classList.remove("button-pressed");
  //elem.classList.remove("button-pressed");
}

function playSoundLooping(arr2, keyVal, freq, bRect) {
  let buf = new Float32Array(arr2.length)
  for (let i = 0; i < arr2.length; i++) buf[i] = arr2[i]
  let buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate)
  buffer.copyToChannel(buf, 0)
  let source = audioCtx.createBufferSource();
  sources.push({ keyVal: keyVal, frequency: freq, source: source, bRect: bRect });
  source.buffer = buffer;
  source.connect(gainNode);
  source.loop = true;
  source.start(0);

}
//all sources are connected to this node
let gainNode = audioCtx.createGain();
gainNode.gain.value = 1;

let masterGainNode = audioCtx.createGain();
gainNode.connect(masterGainNode);
let analyser = audioCtx.createAnalyser();
masterGainNode.connect(analyser);
analyser.connect(audioCtx.destination);


function updateVolume(vol) {
  masterGainNode.gain.value = vol;
  setDisplayInfoExtra("Volume: " + (vol * 100).toFixed(0));
}

//EFFECTS
//routing: sources -> gain node -> filter(optional) -> analyser -> convolver(optional) -> master gain -> output
//TODO: change to routing: sources -> gain node -> filter(optional) -> convolver(optional) -> master gain -> analyser -> output
let isReverbOn = false;
let isFilterOn = false;
let filterStatus = document.querySelector("#effects-filter-status");
let reverbStatus = document.querySelector("#effects-reverb-status");
let filterDropDown = document.querySelector("#filter-select");
let reverbDropDown = document.querySelector("#ir-select");

//filter effect
let toggleFilter = document.getElementById("toggle-filter");
toggleFilter.addEventListener("click", function () {
  if (!isFilterOn) {
    isFilterOn = true;
    gainNode.connect(biquadFilter);
    if (isReverbOn) biquadFilter.connect(convolver);
    else biquadFilter.connect(masterGainNode);
    gainNode.gain.value = 0.5;
    filterStatus.style.background = "#34ff2d";
    setDisplayInfo("Filter: " + filterDropDown.options[filterDropDown.selectedIndex].textContent);
  } else {
    isFilterOn = false;
    biquadFilter.disconnect();
    if (isReverbOn) gainNode.connect(convolver);
    else gainNode.connect(masterGainNode);
    gainNode.gain.value = 1;
    filterStatus.style.background = "red";
    setDisplayInfo("Filter: off");
    setDisplayInfoExtra("");
  }
});

let biquadFilter = audioCtx.createBiquadFilter();
biquadFilter.type = "lowpass";
biquadFilter.Q.value = 1;
// biquadFilter.gain.setValueAtTime(25, audioCtx.currentTime);

function updateFilterFrequency(freq) {
  if (isFilterOn) {
    biquadFilter.frequency.value = freq;
    //biquadFilter.frequency.setValueAtTime(valOffset, audioCtx.currentTime);
    setDisplayInfoExtra("Frequency: " + freq.toFixed(0));
  }
}
function filterChange(type) {
  biquadFilter.type = type;
  setDisplayInfo("Filter: " + filterDropDown.options[filterDropDown.selectedIndex].textContent);
}
//reverb effect
let convolver = audioCtx.createConvolver();
function base64ToArrayBuffer(base64) {
  let binaryString = window.atob(base64);
  let len = binaryString.length;
  let bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
let irDeepHallUrl = "https://cdn.glitch.com/89f940ce-ef08-4291-b87f-d15d892a941f%2FConic%20Long%20Echo%20Hall.wav?1548283935116";
//irChange(irDeepHallUrl);
let toggleReverb = document.getElementById("toggle-reverb");
toggleReverb.addEventListener("click", function () {
  if (!isReverbOn) {
    isReverbOn = true;
    if (isFilterOn) biquadFilter.connect(convolver);
    else gainNode.connect(convolver);
    convolver.connect(masterGainNode);
    irChange(irDeepHallUrl);
    reverbStatus.style.background = "#34ff2d";
    console.log(toggleReverb.value);
  } else {
    isReverbOn = false;
    if (isFilterOn) biquadFilter.connect(masterGainNode);
    else gainNode.connect(masterGainNode);
    convolver.disconnect();
    reverbStatus.style.background = "red";
    setDisplayInfo("Reverb: off");
  }

});
let displayInfo = document.querySelector("#display-info");
let displayInfoExtra = document.querySelector("#display-info-extra");
function setDisplayInfo(info) {
  displayInfo.textContent = info;
}
function setDisplayInfoExtra(info) {
  displayInfoExtra.textContent = info;
}
//get the impulse from glitch server
function irChange(url) {
  if (isReverbOn) {
    let irRRequest = new XMLHttpRequest();
    irRRequest.open("GET", url, true);
    irRRequest.responseType = "arraybuffer";
    irRRequest.onload = function () {
      audioCtx.decodeAudioData(irRRequest.response,
        function (buffer) { convolver.buffer = buffer; });
    }
    irRRequest.send();
    setDisplayInfo("Reverb: " + reverbDropDown.options[reverbDropDown.selectedIndex].textContent);

  }
}

drawOscilloscope();

//oscilloscope
function drawOscilloscope() {
  let WIDTH = canvasOscilloscope.width;
  let HEIGHT = canvasOscilloscope.height;

  analyser.fftSize = 2048;
  let bufferLength = analyser.fftSize;
  let dataArray = new Uint8Array(bufferLength);

  canvasOscilloscopeCtx.clearRect(0, 0, WIDTH, HEIGHT);

  let draw = function () {
    let drawVisual = requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    // canvasCtx.fillStyle = "rgb(200, 200, 200)";

    canvasOscilloscopeCtx.clearRect(0, 0, WIDTH, HEIGHT);

    canvasOscilloscopeCtx.fillStyle = canvasBackgroundColor;
    canvasOscilloscopeCtx.fillRect(0, 0, WIDTH, HEIGHT);
    canvasOscilloscopeCtx.fillStyle = canvasGridColor;
    canvasOscilloscopeCtx.fillRect(canvasOscilloscope.width / 2 - 2, 0, 4, canvasOscilloscope.height);
    canvasOscilloscopeCtx.fillRect(0, canvasOscilloscope.height / 2 - 2, canvasOscilloscope.width, 4);
    canvasOscilloscopeCtx.lineWidth = 2;
    // canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    canvasOscilloscopeCtx.beginPath();

    let sliceWidth = (WIDTH * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0;
      let y = (v * HEIGHT) / 2;

      if (i === 0) {
        canvasOscilloscopeCtx.moveTo(x, y);
      } else {
        canvasOscilloscopeCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasOscilloscopeCtx.lineTo(canvasOscilloscope.width, canvasOscilloscope.height / 2);
    canvasOscilloscopeCtx.stroke();
  };
  draw();

}
let synth = document.querySelector("#synth");
let rotatePrompt = document.querySelector("#rotate-prompt");
let fullscreenPrompt = document.querySelector("#fullscreen-prompt");
let isInFullscreen = false;

document.onload = function (e) {

}
window.onload = function (e) {
  //landscape mode
  if (screen.height > screen.width) {
    synth.style.display = "none";
    console.log("portrait mode");
    rotatePrompt.style.display = "block";
  } else {
    rotatePrompt.style.display = "none";
    console.log("landscape mode");
  }
}
window.screen.orientation.onchange = function () {
  if (this.type.startsWith('landscape')) {
    synth.style.display = "grid";
    rotatePrompt.style.display = "none";
    console.log("landscape mode");
    document.querySelector('#synth').webkitRequestFullscreen();
    isInFullscreen = true;
    synth.classList.toggle('is-fullscreen', isInFullscreen);
  } else {
    if (!isShowingInfo) {
      isInFullscreen = false;
      synth.classList.toggle('is-fullscreen', isInFullscreen);
      document.webkitExitFullscreen();
      synth.style.display = "none";
      rotatePrompt.style.display = "block";
    }
    console.log("portrait mode");
  }
  infoScreen.classList.remove("slide-in");
  infoScreen.classList.remove("slide-out");
  infoScreen.style.display = "none";
  isShowingInfo = false;

};
let fullscreenButton = document.querySelector("#fullscreen-button");
fullscreenButton.addEventListener("click", function () {
  if (!isInFullscreen) {
    document.querySelector('html').webkitRequestFullscreen();
    isInFullscreen = true;
    synth.classList.toggle('is-fullscreen', isInFullscreen);
  } else {
    document.webkitExitFullscreen();
    isInFullscreen = false;
    synth.classList.toggle('is-fullscreen', isInFullscreen);
  }
});
let isShowingInfo = false;
let infoButton = document.querySelector("#info-button");
let infoScreen = document.querySelector("#info-screen");
let backButton = document.querySelector("#back-button");
let overlay = document.querySelector("#overlay");

backButton.addEventListener("click", function () {
  infoScreen.classList.remove("slide-in");
  infoScreen.className += " slide-out";

  overlay.classList.remove("fade-in");
  overlay.className += " fade-out";
  synth.style.pointerEvents = "auto";
  setTimeout(function () {
    infoScreen.style.display = "none";
    overlay.style.display = "none";

  }, 500);

  isShowingInfo = false;
});

infoButton.addEventListener("click", function () {
  if (!isShowingInfo) {
    infoScreen.style.display = "inline";
    infoScreen.classList.remove("slide-out");
    infoScreen.className += " slide-in";

    synth.style.pointerEvents = "none";
    infoScreen.style.pointerEvents = "auto";
    overlay.style.display = "inline";
    overlay.classList.remove("fade-out");
    overlay.className += " fade-in";
    isShowingInfo = true;
  }
});

//knobs code
const knobs = document.querySelectorAll(".knob");
knobs.forEach(knob => {
  let defaultColor = knob.style.backgroundColor;
  knob.isClicked = false;
  if (knob.getAttribute("data-js") === "knob-vol") knob.type = "vol";
  if (knob.getAttribute("data-js") === "knob-freq") knob.type = "freq";
  knob.addEventListener("mousedown", (e) => {
    if (!knob.isClicked) {
      knob.isClicked = true;
      knob.style.backgroundColor = "yellow";
      window.addEventListener("mousemove", rotateKnob(knob));
      window.addEventListener("mouseup", () => {
        knob.isClicked = false;
        knob.style.backgroundColor = defaultColor;
        //this doesnt work, possibly due to closure
        window.removeEventListener("mousemove", rotateKnob(knob));
      })
    }

  })
})


function rotateKnob(knob) {
  return function (event) {
    let windowMouseX = event.clientX;
    let windowMouseY = event.clientY;

    let knobLeft = knob.getBoundingClientRect().left + knob.offsetWidth / 2;
    let knobTop = knob.getBoundingClientRect().top + knob.offsetHeight / 2;
    let angle = angleOf(windowMouseX, windowMouseY, knobLeft, knobTop);
    if (knob.isClicked) {
      knob.style.transform = "rotate(" + angle + "deg)";
      if (knob.type === "vol") {
        //volume from 0 to 1.0
        let volume = angle / 360;
        updateVolume(volume);
      }
      else if (knob.type === "freq") {
        //filter range from 20hz 7200hz
        let frequency = (angle * 2) * 10;
        updateFilterFrequency(frequency);
      }
    }

  }
}
function angleOf(x1, y1, x2, y2) {
  // NOTE: Remember that most math has the Y axis as positive above the X.
  // However, for screens we have Y as positive below. For this reason, 
  // the Y values are inverted to get the expected results.
  let deltaY = (y2 - y1);
  let deltaX = (x2 - x1);
  let result = radiansToDegrees(Math.atan2(deltaY, deltaX));
  return (result < 0) ? (360 + result) : result;
}

function radiansToDegrees(radians) {
  var pi = Math.PI;
  return radians * (180 / pi);
}


