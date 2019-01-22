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
var samplesInOneOscillation = 100; //determines pitch, 100 = 441hz
var mouseX, mouseY;
var canvasSizeOffsetX = canvas2.width*0.01;
var canvasSizeOffsetY = canvas2.width*0.01;

canvas2.addEventListener("mousemove", function(evt) {
  mouseX = (evt.pageX - this.offsetLeft); 
  mouseY = (evt.pageY - this.offsetTop); 
  //console.log(mouseX, mouseY);
});

canvas2.addEventListener("click", function(evt) {
  addPointOnCanvas();
});
var samplePoints = [];
for(var i=0; i<samplesInOneOscillation; i++) {
  samplePoints[i] = 0; 
}
var userPoints = [];

function addPointOnCanvas() {
  //transform mouse Y from 0 - 100 to 1 to -1
  //using canvas offset value to get position as if canvas was of size 100x100
  var sampleY = ((mouseY / canvasSizeOffsetY)/50);
  sampleY = (sampleY-1);
  //add amplitude at time
  samplePoints[Math.round(mouseX/canvasSizeOffsetX)] = sampleY;
  userPoints.push(sampleY);
  getInterpolationRegion();
  visualizeSamplesAsPoints();
}
function getInterpolationRegion() {
  var interpolationStartIndex = 0;
  var interpolationEndIndex = 0;
  for(var x=0; x < samplePoints.length; x++){
    var y = samplePoints[x];
    //interpolate between user points
    if(userPoints.includes(y)){
      //set the end of this interpolation to this index
      interpolationEndIndex = x;
      //interpolate between added samples
      linearInterpolation(interpolationStartIndex, interpolationEndIndex);
      //set the start of next interpolation to this index
      interpolationStartIndex = x;
    }
 
  }
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
    canvas2Ctx.moveTo(x * canvasSizeOffsetX, (samplePoints[x] * canvas2Height/2) + canvas2Height/2 );
    canvas2Ctx.lineTo((x*canvasSizeOffsetX)+ canvasSizeOffsetX, (samplePoints[x+1] * canvas2Height/2) + canvas2Height/2);
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

var fullSoundArray = [];

function buildFullSoundArray() {
  for (var i = 0; i < (audioCtx.sampleRate * secondsToPlayAudio)/samplePoints.length; i++) {
   for (var j = 0; j < samplePoints.length; j++) {
     fullSoundArray[(samplePoints.length*i)+j] = samplePoints[j];
    }
  }
}

var source = audioCtx.createBufferSource();
function playSound(arr2) {
    var buf = new Float32Array(arr2.length)
    for (var i = 0; i < arr2.length; i++) buf[i] = arr2[i]
    var buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate)
    buffer.copyToChannel(buf, 0)
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
}
function playCustomSound(arr) {
    var buf = new Float32Array(arr.length)
    for (var i = 0; i < arr.length; i++) buf[i] = arr[i]
    var buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate)
    buffer.copyToChannel(buf, 0)
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

