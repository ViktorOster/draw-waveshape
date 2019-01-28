var audioCtx = new AudioContext();

var canvas2 = document.getElementById("canvas2");
var canvas2Ctx = canvas2.getContext("2d");
var canvasOscilloscope = document.getElementById("canvas-oscilloscope");
var canvasOscilloscopeCtx = canvasOscilloscope.getContext("2d");

canvas2Ctx.fillStyle = "black";
canvas2Ctx.fillRect(0, 0, canvas2.width, canvas2.height);
var canvasLineColor = "red";
canvas2Ctx.strokeStyle = canvasLineColor;
canvasOscilloscopeCtx.strokeStyle = canvasLineColor;
var canvasPointColor = "white";
var canvasGridColor = "rgba(136, 228, 246, .13)";
// Create gradient
var canvasGradient = canvas2Ctx.createRadialGradient(150.900, 152.100, 0.000, 153.000, 150.000, 150.000);
// Add colors
canvasGradient.addColorStop(0.000, 'rgba(136, 228, 246, 1.000)');
canvasGradient.addColorStop(0.748, 'rgba(168, 235, 247, 1.000)');
canvasGradient.addColorStop(1.000, 'rgba(179, 237, 249, 1.000)');
var canvasBackgroundColor = canvasGradient;
canvasBackgroundColor = "black";

var tone = 441;
var sampleFreq = audioCtx.sampleRate / tone;
var samplesInOneOscillation = sampleFreq; //determines pitch, 100 = 441hz
const samplesOnGraph = 109;
var oldSamplesInOneOscillation = samplesInOneOscillation;
var samplePoints = [];
var userPoints = [];
var userPointsOnGraph = [];
initSamplePoints();

var mouseX, mouseY;
var canvasSizeOffsetX = canvas2.width*0.01;
var canvasSizeOffsetY = canvas2.height*0.01;

var canvasOffsetLeft = canvas2.offsetLeft;
var canvasOffsetTop = canvas2.offsetTop;

canvas2.addEventListener("mousemove", function(evt) {
  mouseX = (evt.pageX - canvasOffsetLeft); 
  mouseY = (evt.pageY - canvasOffsetTop); 
  
  //console.log(mouseX, mouseY);
});

canvas2.addEventListener("click", function(evt) {
  //if some key is pressed (some source exists) , stop all sources
  if(Object.keys(sources).length !== 0) {
    for(var k in sources) {
      sources[k].source.stop(0);
    }
    sources = [];
  }
  addPoint(mouseX, mouseY);

});
var samplePointsToPlay = [];

function initSamplePoints() {
  // sampleFreq = audioCtx.sampleRate / tone;
  // samplesInOneOscillation = sampleFreq; //determines pitch, 100 = 441hz
  // samplePointsToPlay = [];
  samplePoints = [];
  // userPoints = [];
  // userPointsOnGraph = [];
  for(var i=0; i<samplesOnGraph; i++) {
    samplePoints[i] = 0; 
  }
}
function setTone(freq) {
  var tone = freq;
  sampleFreq = audioCtx.sampleRate / tone;
  samplesInOneOscillation = sampleFreq; //determines pitch, 100 = 441hz
  samplePointsToPlay = [];
  for(var i=0; i<samplesInOneOscillation; i++) {
    samplePointsToPlay[i] = 0; 
  }
  //rebuild the waveform at new tone if user added points
  var oldUserPoints = userPoints;
  userPoints = [];
  if(oldUserPoints.length > 0){
    for(var i = 0; i<oldUserPoints.length; i++) {
      addOldPoint(oldUserPoints[i].x, oldUserPoints[i].y);
    }
  }
  oldSamplesInOneOscillation = samplesInOneOscillation;
}
//for re sampling wave at different pitch
//same as below but with different x scaling and without y scaling since y points are scaled
//adds the user point to a stretched sample array of correct length(pitch) to play
function addOldPoint(posX, posY) {
  var sampleY = posY;
  //offset X by tone ratio change
  var sampleX = Math.round( posX * (samplesInOneOscillation/oldSamplesInOneOscillation) );
  //add amplitude at time
  samplePointsToPlay[sampleX] = sampleY;
  userPoints.push({x: sampleX, y: sampleY});
  getInterpolationRegion(samplePointsToPlay);
}

function addPoint(posX, posY) {
  //transform mouse Y from 0 - 100 to 1 to -1
  //using canvas offset value to get position as if canvas was of size 100x100
  var sampleY = ((posY / (canvas2.offsetHeight*0.01))/50);
  sampleY = (sampleY-1);
  var sampleX = Math.round( (posX/(canvas2.offsetWidth*0.01)) * (samplesOnGraph*0.01) );
  //add amplitude at time
  samplePoints[sampleX] = sampleY;
  userPoints.push({x: sampleX, y: sampleY});
  userPointsOnGraph.push({x: sampleX, y: sampleY});
  getInterpolationRegion(samplePoints);
  visualizeSamplesAsPoints();
}
function getInterpolationRegion(arrr) {
  var interpolationStartIndex = 0;
  var interpolationEndIndex = 0;
  for(var x=0; x < arrr.length; x++){
    var y = arrr[x];
    //check if y value is in user points
    var exists = Object.keys(userPoints).some(function(k) {
        return userPoints[k].y === y;
    });
    //interpolate between user points
    if(exists){
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
  var length = (end-start);
  var y0 = arrr[start];
  var x0 = 0;
  var y1 = arrr[end];
  var x1 = length;
  var x = 1;
  for(var i = 1; i <length; i++) {
    x = i;
    arrr[start+i] = (y0*(x1-x) + y1*(x-x0))/ x1-x0; //linear interpolation function
  }
}

var clearCanvasButton = document.getElementById("clear-canvas");
clearCanvasButton.addEventListener("click", function() {
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
  canvas2Ctx .fillStyle = canvasBackgroundColor;
  canvas2Ctx .fillRect(0, 0, canvas2.width, canvas2.height);

  canvas2Ctx.fillStyle = canvasGridColor;
  canvas2Ctx.fillRect(canvas2.width/2-(canvas2.width/200), 0, canvas2.width/100, canvas2.height);
  canvas2Ctx.fillRect(0, canvas2.height/2-(canvas2.height/200), canvas2.width, canvas2.height/100);
  
  canvas2Ctx.lineWidth = canvas2.width/80;
  canvas2Ctx.beginPath();
  for(var x=0; x < samplePoints.length; x++){
    var y = samplePoints[x];
    //with stretching to fit tone (waveform wont shrink/expand on canvas when changing hz)
    canvas2Ctx.moveTo((x *100/samplesOnGraph ) * canvasSizeOffsetX, (samplePoints[x] * canvas2.height/2) + canvas2.height/2 );
    canvas2Ctx.lineTo( ( (x *100/samplesOnGraph ) *canvasSizeOffsetX)+ canvasSizeOffsetX, (samplePoints[x+1] * canvas2.height/2) + canvas2.height/2);
    canvas2Ctx.stroke();
  }
  canvas2Ctx.fillStyle = canvasPointColor;
  var pointWidth = canvas2.width/40;
  for(var i=0; i < userPointsOnGraph.length; i++){
    canvas2Ctx.fillRect( ( ((userPointsOnGraph[i].x *100/samplesOnGraph ) *canvasSizeOffsetX)+ canvasSizeOffsetX)-(pointWidth/1.3), ((userPointsOnGraph[i].y * canvas2.height/2) + canvas2.height/2)-(pointWidth/2), pointWidth, pointWidth);
  }
}
//all the sounds playing
var sources = [];
//handle keyboard
var keyboardKeys = document.getElementsByClassName("keyboard-key");
document.addEventListener('keypress', function(event){
  for(var i=0; i<keyboardKeys.length; i++){
   if(keyboardKeys[i].id.toLowerCase() === event.key.toLowerCase()){
     playSourceAtPitch(keyboardKeys[i]);
   }
  }
});

document.addEventListener('keyup', function(event){
  for(var i=0; i<keyboardKeys.length; i++){
   if(keyboardKeys[i].id.toLowerCase() === event.key.toLowerCase()){
     stopSourceAtKey(keyboardKeys[i]);
   }
  }
});


var touched1Keys = [];
var touched2Keys = [];
var touched3Keys = [];

//TODO: make touch objects and use them in functions

//DRY this....
window.addEventListener("touchstart", function(evt) {
  if(evt.touches[0].identifier === 0) {
    var touchLocationX = evt.touches[0].clientX;
    var touchLocationY = evt.touches[0].clientY;
    playKeyWithTouch1(touchLocationX, touchLocationY);
    //TODO: clean up and DRY this logic, make it work for N touches
  }
  if(evt.touches[1] && evt.touches[1].identifier === 1) {
    var touchLocationX = evt.touches[1].clientX;
    var touchLocationY = evt.touches[1].clientY;
    playKeyWithTouch2(touchLocationX, touchLocationY);
  }
  if(evt.touches[2] && evt.touches[2].identifier === 2) {
    var touchLocationX = evt.touches[2].clientX;
    var touchLocationY = evt.touches[2].clientY;
    playKeyWithTouch3(touchLocationX, touchLocationY);
  }
});

//play the sound of the key at the location of the touch
window.addEventListener("touchmove", function(evt) {
  if(evt.touches[0].identifier === 0) {
    var touchLocationX = evt.touches[0].clientX;
    var touchLocationY = evt.touches[0].clientY;
    playKeyWithTouch1(touchLocationX, touchLocationY);
    //stop playing if touch moves outside of button
    //TODO: clean up and DRY this logic, make it work for N touches
    for(var i in touched1Keys) {
      if(touched1Keys[i] !== ""){
        if(touchLocationX < touched1Keys[i].getBoundingClientRect().left || touchLocationX > touched1Keys[i].getBoundingClientRect().right ||
        touchLocationY < touched1Keys[i].getBoundingClientRect().top || touchLocationY > touched1Keys[i].getBoundingClientRect().bottom) {
          stopSourceAtKey(keyboardKeys[i]);
          touched1Keys[i] = "";
        }
      }
    }
  }
  if(evt.touches[1] && evt.touches[1].identifier === 1) {
    var touchLocationX = evt.touches[1].clientX;
    var touchLocationY = evt.touches[1].clientY;
    playKeyWithTouch2(touchLocationX, touchLocationY);
    //stop playing if touch moves outside of button
    for(var i in touched2Keys) {
      if(touched2Keys[i] !== ""){
        if(touchLocationX < touched2Keys[i].getBoundingClientRect().left || touchLocationX > touched2Keys[i].getBoundingClientRect().right ||
        touchLocationY < touched2Keys[i].getBoundingClientRect().top || touchLocationY > touched2Keys[i].getBoundingClientRect().bottom) {
          stopSourceAtKey(keyboardKeys[i]);
          touched2Keys[i] = "";
        }
      }
    }
  }
  if(evt.touches[2] && evt.touches[2].identifier === 2) {
    var touchLocationX = evt.touches[2].clientX;
    var touchLocationY = evt.touches[2].clientY;
    playKeyWithTouch3(touchLocationX, touchLocationY);
    //stop playing if touch moves outside of button
    for(var i in touched3Keys) {
      if(touched3Keys[i] !== ""){
        if(touchLocationX < touched3Keys[i].getBoundingClientRect().left || touchLocationX > touched3Keys[i].getBoundingClientRect().right ||
        touchLocationY < touched3Keys[i].getBoundingClientRect().top || touchLocationY > touched3Keys[i].getBoundingClientRect().bottom) {
          stopSourceAtKey(keyboardKeys[i]);
          touched3Keys[i] = "";
        }
      }
    }
  }
});
window.addEventListener("touchend", function(evt) {
  if(evt.changedTouches[0].identifier === 0) {
    for(var i in touched1Keys) {
      if(touched1Keys[i] !== ""){
        stopSourceAtKey(keyboardKeys[i]);
        touched1Keys[i] = "";
      }
    }
  }
  if(evt.changedTouches[0].identifier === 1) {
    for(var i in touched2Keys) {
      if(touched2Keys[i] !== ""){
        stopSourceAtKey(keyboardKeys[i]);
        touched2Keys[i] = "";
      }
    }
  }
  if(evt.changedTouches[0].identifier === 2) {
    for(var i in touched3Keys) {
      if(touched3Keys[i] !== ""){
        stopSourceAtKey(keyboardKeys[i]);
        touched3Keys[i] = "";
      }
    }
  }
});

function playKeyWithTouch1(touchX, touchY) {
  for(var i in keyboardKeys) { 
    //at this point, keyboardkeys array contains some non html element data
    if(typeof keyboardKeys[i] === "object"){
      if(touchX > keyboardKeys[i].getBoundingClientRect().left && touchX < keyboardKeys[i].getBoundingClientRect().right &&
      touchY > keyboardKeys[i].getBoundingClientRect().top && touchY < keyboardKeys[i].getBoundingClientRect().bottom) {
        playSourceAtPitch(keyboardKeys[i]);
        touched1Keys[i] = keyboardKeys[i];
      }
    }
  }
}

function playKeyWithTouch2(touchX, touchY) {
  for(var i in keyboardKeys) { 
    //at this point, keyboardkeys array contains some non html element data
    if(typeof keyboardKeys[i] === "object"){
      if(touchX > keyboardKeys[i].getBoundingClientRect().left && touchX < keyboardKeys[i].getBoundingClientRect().right &&
      touchY > keyboardKeys[i].getBoundingClientRect().top && touchY < keyboardKeys[i].getBoundingClientRect().bottom) {
        playSourceAtPitch(keyboardKeys[i]);
        touched2Keys[i] = keyboardKeys[i];
      }
    }
  }
}

function playKeyWithTouch3(touchX, touchY) {
  for(var i in keyboardKeys) { 
    //at this point, keyboardkeys array contains some non html element data
    if(typeof keyboardKeys[i] === "object"){
      if(touchX > keyboardKeys[i].getBoundingClientRect().left && touchX < keyboardKeys[i].getBoundingClientRect().right &&
      touchY > keyboardKeys[i].getBoundingClientRect().top && touchY < keyboardKeys[i].getBoundingClientRect().bottom) {
        playSourceAtPitch(keyboardKeys[i]);
        touched3Keys[i] = keyboardKeys[i];
      }
    }
  }
}

var octaveTextElement = document.getElementById("octave-text");
var masterOctave = 2; 
var masterOctaveButtons = document.getElementsByClassName("octave-button");
var octaveMultiplicationValue = 1;

for(var i = 0; i< masterOctaveButtons.length; i++) { 
  masterOctaveButtons[i].addEventListener('click', function(evt) {
    if(this.id === "octave-up" && masterOctave <4) {
      stopAllSources();
      masterOctave++;

      //multiply value for keys
      for(var x in keyboardKeys) {
        keyboardKeys[x].value *= 2;
      }
    }
    else if(this.id === "octave-down" && masterOctave >1){
      stopAllSources();
      masterOctave--;
      //multiply value for keys
      for(var x in keyboardKeys) {
        keyboardKeys[x].value *= 0.5;
      }
    }   
    octaveTextElement.textContent = masterOctave;
  });
}
function stopAllSources(){
  for(var k in sources) {
    sources[k].source.stop(0);
    delete sources[k];
  }
  sources = [];
}
//these keys are only displayed, real touch events occur on smaller keys
var keyboardKeysDisplay = document.getElementsByClassName("keyboard-key-display");

function playSourceAtPitch(elem) {
  var exists = Object.keys(sources).some(function(k) {
    return sources[k].keyVal === elem.id;
  });
  //if the note isn't already playing
  if(!exists){
    setTone(elem.value); 
    playSoundLooping(samplePointsToPlay, elem.id, elem.value, elem.getBoundingClientRect());
    //only add pressed class to actual black keys, not actual white keys
    if(elem.getAttribute("type") ==="black") elem.className += " button-pressed";
    //add pressed class to display keys
    for(var x in keyboardKeysDisplay) {
      if(keyboardKeysDisplay[x].value === elem.id) {
        keyboardKeysDisplay[x].className += " button-pressed";
      }
    }
  }
  // window.setTimeout(function () {
  //  elem.classList.remove("button-pressed");
  // }, 100);
}
//stops the source playing at the key on key up at key
function stopSourceAtKey(elem) {
  for(var k in sources) {
    if(sources[k].keyVal === elem.id) {
      sources[k].source.stop(0);
      delete sources[k];
    }
  }
  //remove pressed class from display keys
  for(var x in keyboardKeysDisplay) {
    if(keyboardKeysDisplay[x].value === elem.id) {
      keyboardKeysDisplay[x].classList.remove("button-pressed");
    }
  }
  //only remove pressed class from actual black keys, not actual white keys
  if(elem.getAttribute("type") ==="black") elem.classList.remove("button-pressed");
  //elem.classList.remove("button-pressed");
}

function playSoundLooping(arr2, keyVal, freq, bRect) {
  var buf = new Float32Array(arr2.length)
  for (var i = 0; i < arr2.length; i++) buf[i] = arr2[i]
  var buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate)
  buffer.copyToChannel(buf, 0)
  var source = audioCtx.createBufferSource();
  sources.push({keyVal: keyVal, frequency: freq, source: source, bRect: bRect});
  source.buffer = buffer;
  source.connect(gainNode);
  source.loop = true;
  source.start(0);

}
//all sources are connected to this node
var gainNode = audioCtx.createGain();
gainNode.gain.value = 1;
var masterGainNode = audioCtx.createGain();
masterGainNode.connect(audioCtx.destination);

// var masterGainController = document.getElementById("master-gain");
// masterGainController.addEventListener("input", function(evt) {
//   masterGainNode.gain.value = this.value;
// });

function updateVolume(e) {
  masterGainNode.gain.value = (e*0.01).toFixed(2);
  setDisplayInfoExtra("Master volume: " + e);
}

//EFFECTS
//routing: sources -> gain node -> filter(optional) -> analyser -> convolver(optional) -> master gain -> output
//TODO: change to routing: sources -> gain node -> filter(optional) -> convolver(optional) -> master gain -> analyser -> output
var isReverbOn = false;
var isFilterOn = false;
var filterStatus = document.querySelector("#effects-filter-status");
var reverbStatus = document.querySelector("#effects-reverb-status");
var filterDropDown = document.querySelector("#filter-select");
var reverbDropDown = document.querySelector("#ir-select");

//filter effect
var toggleFilter = document.getElementById("toggle-filter");
toggleFilter.addEventListener("click", function() {
  if(!isFilterOn) {
    isFilterOn = true; 
    gainNode.connect(biquadFilter);
    biquadFilter.connect(analyser);
    gainNode.gain.value = 0.5;
    filterStatus.textContent = "on";
    filterStatus.style.background = "#34ff2d";
    setDisplayInfo("Filter: " + filterDropDown.options[filterDropDown.selectedIndex].textContent);
  } else {
    isFilterOn = false;
    biquadFilter.disconnect();
    gainNode.connect(analyser);
    if(isReverbOn) analyser.connect(convolver);
    else analyser.connect(masterGainNode);
    gainNode.gain.value = 1;
    filterStatus.textContent = "off";
    filterStatus.style.background = "red";
    setDisplayInfo("Filter: off");
    setDisplayInfoExtra("");
  }
});

var biquadFilter = audioCtx.createBiquadFilter();
biquadFilter.type = "lowpass";
biquadFilter.Q.value = 1;
// biquadFilter.gain.setValueAtTime(25, audioCtx.currentTime);

function updateFilterFrequency(e) {
  if(isFilterOn) {
    var valOffset = e*40;
    biquadFilter.frequency.value = valOffset;
    //biquadFilter.frequency.setValueAtTime(valOffset, audioCtx.currentTime);
    setDisplayInfoExtra("Filter freq: " + valOffset);
  }
}
function filterChange(type) {
  biquadFilter.type = type;
  setDisplayInfo("Filter: " + filterDropDown.options[filterDropDown.selectedIndex].textContent);
}
//reverb effect
var convolver = audioCtx.createConvolver();
function base64ToArrayBuffer(base64) {
  var binaryString = window.atob(base64);
  var len = binaryString.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++)        {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
var irDeepHallUrl = "https://cdn.glitch.com/89f940ce-ef08-4291-b87f-d15d892a941f%2FConic%20Long%20Echo%20Hall.wav?1548283935116";
//irChange(irDeepHallUrl);
var toggleReverb = document.getElementById("toggle-reverb");
toggleReverb.addEventListener("click", function() {
  if(!isReverbOn) {
    isReverbOn = true; 
    analyser.connect(convolver);
    convolver.connect(masterGainNode);
    irChange(irDeepHallUrl);
    reverbStatus.textContent = "on";
    reverbStatus.style.background = "#34ff2d";
    console.log(toggleReverb.value);
  } else {
    isReverbOn = false;
    analyser.connect(masterGainNode);
    convolver.disconnect();
    reverbStatus.textContent = "off";
    reverbStatus.style.background = "red";
    setDisplayInfo("Reverb: off");
  }
  
});
var displayInfo = document.querySelector("#display-info");
var displayInfoExtra = document.querySelector("#display-info-extra");
function setDisplayInfo(info) {
  displayInfo.textContent = info;
}
function setDisplayInfoExtra(info) {
  displayInfoExtra.textContent = info;
}
//get the impulse from glitch server
function irChange(url) {
  if(isReverbOn){
    var irRRequest = new XMLHttpRequest();
    irRRequest.open("GET", url, true);
    irRRequest.responseType = "arraybuffer";
    irRRequest.onload = function() {
        audioCtx.decodeAudioData( irRRequest.response, 
            function(buffer) { convolver.buffer = buffer; } );
    }
    irRRequest.send();
    setDisplayInfo("Reverb: " + reverbDropDown.options[reverbDropDown.selectedIndex].textContent);
    
  }
}

var analyser = audioCtx.createAnalyser();
gainNode.connect(analyser);
analyser.connect(masterGainNode);

drawOscilloscope();

//oscilloscope
function drawOscilloscope() {
  var WIDTH = canvasOscilloscope.width;
  var HEIGHT = canvasOscilloscope.height;

  analyser.fftSize = 2048;
  var bufferLength = analyser.fftSize;
  var dataArray = new Uint8Array(bufferLength);

  canvasOscilloscopeCtx.clearRect(0, 0, WIDTH, HEIGHT);

  var draw = function() {
    var drawVisual = requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    // canvasCtx.fillStyle = "rgb(200, 200, 200)";

    canvasOscilloscopeCtx.clearRect(0, 0, WIDTH, HEIGHT);

    canvasOscilloscopeCtx.fillStyle = canvasBackgroundColor;
    canvasOscilloscopeCtx.fillRect(0, 0, WIDTH, HEIGHT);
    canvasOscilloscopeCtx.fillStyle = canvasGridColor;
    canvasOscilloscopeCtx.fillRect(canvasOscilloscope.width/2-2, 0, 4, canvasOscilloscope.height);
    canvasOscilloscopeCtx.fillRect(0, canvasOscilloscope.height/2-2, canvasOscilloscope.width, 4);
    canvasOscilloscopeCtx.lineWidth = 2;
    // canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    canvasOscilloscopeCtx.beginPath();

    var sliceWidth = (WIDTH * 1.0) / bufferLength;
    var x = 0;

    for (var i = 0; i < bufferLength; i++) {
      var v = dataArray[i] / 128.0;
      var y = (v * HEIGHT) / 2;

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
var synth = document.querySelector("#synth");
var rotatePrompt = document.querySelector("#rotate-prompt");
var fullscreenPrompt = document.querySelector("#fullscreen-prompt");
var isInFullscreen = false;

document.onload = function(e) {
  
}
window.onload = function(e){ 
  //landscape mode
  if(screen.height > screen.width) {
    synth.style.display = "none";
    console.log("portrait mode");
    rotatePrompt.style.display = "block";
  } else {
    rotatePrompt.style.display = "none";
    console.log("landscape mode");
  }
}

window.screen.orientation.onchange = function() {
  if (this.type.startsWith('landscape')) {
    synth.style.display = "grid";
    rotatePrompt.style.display = "none";
    console.log("landscape mode");
    document.querySelector('#synth').webkitRequestFullscreen();
    isInFullscreen = true;
    synth.classList.toggle('is-fullscreen', isInFullscreen);
  } else {
    if(!isShowingInfo) {
      isInFullscreen = false;
      synth.classList.toggle('is-fullscreen', isInFullscreen);
      document.webkitExitFullscreen();
      synth.style.display = "none";
      rotatePrompt.style.display = "block";
    }
    console.log("portrait mode");
  }
  // infoScreen.classList.remove("slide-in");
  // infoScreen.classList.remove("slide-out");
  // infoScreen.style.display = "none";
  // isShowingInfo = false; 
  
};
var fullscreenButton = document.querySelector("#fullscreen-button");
fullscreenButton.addEventListener("click", function() {
  if(!isInFullscreen ) {
    document.querySelector('html').webkitRequestFullscreen();
    isInFullscreen = true;
    synth.classList.toggle('is-fullscreen', isInFullscreen);
  } else {
    document.webkitExitFullscreen();
    isInFullscreen = false; 
    synth.classList.toggle('is-fullscreen', isInFullscreen);
  }
});
var isShowingInfo = false;
var infoButton = document.querySelector("#info-button");
var infoScreen = document.querySelector("#info-screen");
var backButton = document.querySelector("#back-button");

backButton.addEventListener("click", function() {
  infoScreen.classList.remove("slide-in");
  infoScreen.className += " slide-out";
  
  synth.classList.remove("fade-out");
  synth.className += " fade-in";
  isShowingInfo = false; 
});

infoButton.addEventListener("click", function() {
  if(!isShowingInfo) {
    infoScreen.style.display ="
    infoScreen.classList.remove("slide-out");
    infoScreen.className += " slide-in";
    
    synth.classList.remove("fade-in");
    synth.className += " fade-out";
    isShowingInfo = true;
  } 
});




