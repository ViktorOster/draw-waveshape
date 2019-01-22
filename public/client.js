var audioCtx = new AudioContext();

// var canvas = document.getElementById("canvas");
var canvas2 = document.getElementById("canvas2");
// var canvasCtx = canvas.getContext("2d");
var canvas2Ctx = canvas2.getContext("2d");
var canvas2Height = canvas2.height;
var canvas2Width = canvas2.width;

canvas2Ctx.fillStyle = "white";
canvas2Ctx.fillRect(0, 0, canvas2.width, canvas2.height);
canvas2Ctx.lineWidth = 1;
canvas2Ctx.strokeStyle = "red";

var tone =  441;
var sampleFreq = audioCtx.sampleRate / tone;
var samplesInOneOscillation = sampleFreq; //determines pitch, 100 = 441hz
var oldSamplesInOneOscillation = samplesInOneOscillation;
var samplePoints = [];
var userPoints = [];
setTone(tone);

var inputFrequencyController = document.getElementById("input-frequency");
inputFrequencyController.addEventListener("input",  function(evt){
//   if(this.value > 800) {
//     alert("highest working tone is 800hz at the moment");
//     this.value = 800;
//   }
  
//   setTone(this.value);
});
var setToneButton = document.getElementById("set-tone");
setToneButton.addEventListener("click",  function(){
  if(inputFrequencyController.value > 800) {
    alert("highest working tone is 800hz at the moment");
    inputFrequencyController.value = 800;
  }
  
  setTone(inputFrequencyController.value);
});

var mouseX, mouseY;
var canvasSizeOffsetX = canvas2.width*0.01;
var canvasSizeOffsetY = canvas2.width*0.01;

canvas2.addEventListener("mousemove", function(evt) {
  mouseX = (evt.pageX - this.offsetLeft); 
  mouseY = (evt.pageY - this.offsetTop); 
  //console.log(mouseX, mouseY);
});

canvas2.addEventListener("click", function(evt) {
  addPoint(mouseX, mouseY);
});


function setTone(freq) {
  tone = freq
  sampleFreq = audioCtx.sampleRate / tone;
  samplesInOneOscillation = sampleFreq; //determines pitch, 100 = 441hz
  samplePoints = [];
  for(var i=0; i<samplesInOneOscillation; i++) {
    samplePoints[i] = 0; 
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
//same as below but without y scaling since points are scaled
function addOldPoint(posX, posY) {
  var sampleY = posY;
  //offset X by tone ratio change
  var sampleX = Math.round( posX * (samplesInOneOscillation/oldSamplesInOneOscillation) );
  //add amplitude at time
  samplePoints[sampleX] = sampleY;
  userPoints.push({x: sampleX, y: sampleY});
  //console.log(samplePoints);
  //console.log(userPoints);
  getInterpolationRegion();
  
}

function addPoint(posX, posY) {
  //transform mouse Y from 0 - 100 to 1 to -1
  //using canvas offset value to get position as if canvas was of size 100x100
  var sampleY = ((posY / canvasSizeOffsetY)/50);
  sampleY = (sampleY-1);
  var sampleX = Math.round( (posX/canvasSizeOffsetX) * (samplesInOneOscillation*0.01) );
  //add amplitude at time
  samplePoints[sampleX] = sampleY;
  userPoints.push({x: sampleX, y: sampleY});
  getInterpolationRegion();
}
function getInterpolationRegion() {
  var interpolationStartIndex = 0;
  var interpolationEndIndex = 0;
  for(var x=0; x < samplePoints.length; x++){
    var y = samplePoints[x];
    //check if y value is in user points
    var exists = Object.keys(userPoints).some(function(k) {
        return userPoints[k].y === y;
    });
    //interpolate between user points
    if(exists){
      //set the end of this interpolation to this index
      interpolationEndIndex = x;
      //interpolate between added samples
      linearInterpolation(interpolationStartIndex, interpolationEndIndex);
      //set the start of next interpolation to this index
      interpolationStartIndex = x;
    }
  }
  visualizeSamplesAsPoints();
}
function linearInterpolation(start, end) {
  //the region in the array to interpolate
  var length = (end-start);
  var y0 = samplePoints[start];
  var x0 = 0;
  var y1 = samplePoints[end];
  var x1 = length;
  var x = 1;
  for(var i = 1; i <length; i++) {
    x = i;
    samplePoints[start+i] = (y0*(x1-x) + y1*(x-x0))/ x1-x0; //linear interpolation from wikipedia
  }
}
visualizeSamplesAsPoints();

function visualizeSamplesAsPoints() {
  canvas2Ctx.clearRect(0, 0, canvas2Width, canvas2Height);
  canvas2Ctx.fillStyle = "white";
  canvas2Ctx.fillRect(0, 0, canvas2Width, canvas2Height);
  canvas2Ctx.fillStyle = "black";
  canvas2Ctx.beginPath();
  for(var x=0; x < samplePoints.length; x++){
    var y = samplePoints[x];
    // canvas2Ctx.fillRect(x * canvasSizeOffset, (samplePoints[x] * canvas2Height/2) + canvas2Height/2, 2, 2 );
    
    //with stretching to fit tone (waveform wont shrink/expand on canvas when changing hz)
    canvas2Ctx.moveTo((x *100/samplesInOneOscillation ) * canvasSizeOffsetX, (samplePoints[x] * canvas2Height/2) + canvas2Height/2 );
    canvas2Ctx.lineTo( ( (x *100/samplesInOneOscillation ) *canvasSizeOffsetX)+ canvasSizeOffsetX, (samplePoints[x+1] * canvas2Height/2) + canvas2Height/2);
    
    //canvas2Ctx.moveTo((x *100/oldSamplesInOneOscillation ) * canvasSizeOffsetX, (samplePoints[x] * canvas2Height/2) + canvas2Height/2 );
    //canvas2Ctx.lineTo( ( (x *100/oldSamplesInOneOscillation ) *canvasSizeOffsetX)+ canvasSizeOffsetX, (samplePoints[x+1] * canvas2Height/2) + canvas2Height/2);
    canvas2Ctx.stroke();
  }
}

// function sineWaveAt(sampleNumber, tone) {
//     var sampleFreq = audioCtx.sampleRate / tone
//     var equation = Math.PI*2
//     // var equation = 5;
//     return Math.sin(sampleNumber / (sampleFreq / (equation)) );
// }
//one oscillation at 441hz with 44100 samples = 0.00243902439024
// var arr = [], volume = 1, seconds = 0.5, tone = 441

// for (var i = 0; i < audioCtx.sampleRate * seconds; i++) {
//   arr[i] = sineWaveAt(i, tone) * volume
// }
var secondsToPlayAudio = 1;
var timeController = document.getElementById("input-seconds");
timeController.addEventListener()

var fullSoundArray = [];

function buildFullSoundArray() {
  for (var i = 0; i < (audioCtx.sampleRate * secondsToPlayAudio)/samplePoints.length; i++) {
   for (var j = 0; j < samplePoints.length; j++) {
     fullSoundArray[(samplePoints.length*i)+j] = samplePoints[j];
    }
  }
}

function playSound(arr2) {
    var buf = new Float32Array(arr2.length)
    for (var i = 0; i < arr2.length; i++) buf[i] = arr2[i]
    var buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate)
    buffer.copyToChannel(buf, 0)
    var source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
}

//playSound(arr);
var initButton = document.getElementById("init");
initButton.addEventListener("click", function() {
  buildFullSoundArray();
  playSound(fullSoundArray);
  //playSound(arr);
  //console.log(arr);
});

// var initButton = document.getElementById("init");
// initButton.addEventListener("click", function() {
//   if(!isInitialized) {
//      isInitialized = true; 
//     source.start(0);
//   }
//   if(!isPlaying) {
//     isPlaying = true;
//     playSound(arr);
//   } else {
//     isPlaying = false;
//     source.disconnect(); 
//   }
// });

