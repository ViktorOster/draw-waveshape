var audioCtx = new AudioContext();


var canvas = document.getElementById("canvas");
var canvas2 = document.getElementById("canvas2");
var canvasCtx = canvas.getContext("2d");
var canvas2Ctx = canvas2.getContext("2d");
var canvas2Height = canvas2.height;
var canvas2Width = canvas2.width;

canvas2Ctx.fillStyle = "white";
canvas2Ctx.fillRect(0, 0, canvas.width, canvas.height);
canvas2Ctx.lineWidth = 2;
canvas2Ctx.strokeStyle = "red";
var samplesInOneOscillation = 100;
var mouseX, mouseY;

canvas2.addEventListener("mousemove", function(evt) {
  mouseX = evt.pageX - this.offsetLeft; 
  mouseY = evt.pageY - this.offsetTop; 
});

canvas2.addEventListener("click", function(evt) {
  addPointOnCanvas();
});
var samplePoints = [];
for(var i=0; i<samplesInOneOscillation; i++) {
  samplePoints[i] = 0; 
}
samplePoints[0] = 0.1;
samplePoints[samplePoints.length-1] = 0.1;
var userPoints = [];

function addPointOnCanvas() {
  //transform mouse Y from 0 - 100 to 1 to -1
  var sampleY = mouseY/50;
  sampleY = (sampleY-1);
  //add amplitude at time
  samplePoints[mouseX] = sampleY;
  userPoints.push(sampleY);
  // console.log(samplePoints);
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
  //console.log(samplePoints);
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
// console.log(samplePoints);
visualizeSamplesAsPoints();

function visualizeSamplesAsPoints() {
  canvas2Ctx.clearRect(0, 0, canvas2Width, canvas2Height);
  canvas2Ctx.fillStyle = "white";
  canvas2Ctx.fillRect(0, 0, canvas2Width, canvas2Height);
  for(var x=0; x < samplePoints.length; x++){
    var y = samplePoints[x];
    canvas2Ctx.fillStyle = "black";
    canvas2Ctx.fillRect(x, (y * canvas2Height/2) + canvas2Height/2, 2, 2 );
  }
}

function visualizeDrawing() {
  canvas2Ctx.clearRect(0, 0, canvas2Width, canvas2Height);
  canvas2Ctx.fillStyle = "white";
  canvas2Ctx.fillRect(0, 0, canvas2Width, canvas2Height);
  canvas2Ctx.fillStyle = "black";
  
  var draw = function() {
    var arrDrawY = [];
    var arrDrawX = [];
    canvas2Ctx.beginPath();

    for(var x=0; x < samplePoints.length; x++){
      
      var y = samplePoints[x];
      if(y != 0.0){
        arrDrawY.push(y);
        arrDrawX.push(x);
      }
      for(var j=0; j < arrDrawX.length; j++){
        canvas2Ctx.moveTo(arrDrawX[j], (arrDrawY[j] * canvas2Height/2) + canvas2Height/2 );
        canvas2Ctx.lineTo(arrDrawX[j+1], (arrDrawY[j+1] * canvas2Height/2) + canvas2Height/2);
        canvas2Ctx.stroke();
      }
    } 
  }
  
   draw();
}

function sineWaveAt(sampleNumber, tone) {
    var sampleFreq = audioCtx.sampleRate / tone
    var equation = Math.PI*2
    // var equation = 5;
    return Math.sin(sampleNumber / (sampleFreq / (equation)) );
}
//one oscillation at 441hz with 44100 samples = 0.00243902439024
var arr = [], volume = 1, seconds = 0.5, tone = 441

// for (var i = 0; i < audioCtx.sampleRate * seconds; i++) {
//   arr[i] = sineWaveAt(i, tone) * volume
//   //prints every sample
//   // console.log(i, arr[i]);
// }
for (var i = 0; i < audioCtx.sampleRate * seconds; i++) {
  arr[i] = sineWaveAt(i, tone) * volume
  //prints every sample
  // console.log(i, arr[i]);
}
var fullSoundArray = [];
for (var i = 0; i < audioCtx.sampleRate * seconds; i++) {
  arr[i] = sineWaveAt(i, tone) * volume
  //prints every sample
  // console.log(i, arr[i]);
}

visualize();

function visualize() {
  var WIDTH = canvas.width;
  var HEIGHT = canvas.height;

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  canvasCtx.fillStyle = "white";
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  
  var draw = function() {

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "red";

    canvasCtx.beginPath();

    // for(var i=0; i < 100; i++){
    //   var y = (arrY[i] * HEIGHT) / 2;
    //   var x = arrX[i]
    //   canvasCtx.moveTo(arrX[i], (arrY[i] * HEIGHT) + HEIGHT/2  );
    //   canvasCtx.lineTo(arrX[i+1], (arrY[i+1] * HEIGHT) + HEIGHT/2);
    //   canvasCtx.stroke();
    // }  
    
    for(var i=0; i < 100; i++){
      var x = i;
      canvasCtx.moveTo(x, (arr[i] * HEIGHT/2) + HEIGHT/2  );
      canvasCtx.lineTo(x+1, (arr[i+1] * HEIGHT/2) + HEIGHT/2);
      canvasCtx.stroke();
      // console.log("x:", x, "y:", (arr[i] * HEIGHT/2) + HEIGHT/2, "y2", arr[i]);
    } 
  };

  draw();
}
var source = audioCtx.createBufferSource();
function playSound(arr) {
    var buf = new Float32Array(arr.length)
    for (var i = 0; i < arr.length; i++) buf[i] = arr[i]
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
// function playCustomSound(toneLengthInMs) {
//   var customWaveFormLengthInMs = 2.43902439024;
//   var nrWaveOscillations = toneLengthInMs/customWaveFormLengthInMs;
//   var arrayOfSound = [];
//   //fill the array with oscillations of custom waveform until it is of the length provided in ms
//   for(var i = 0; i < nrWaveOscillations; i++) {
//     for(var j = 0; j < samplePoints.length; j++){
//       arrayOfSound[(nrWaveOscillations * i)+j] = samplePoints[j];
//     }
//   }
//   console.log(arr);
//   console.log(arrayOfSound);
//   var buf = new Float32Array(arrayOfSound.length)
//   for (var i = 0; i < arrayOfSound.length; i++) buf[i] = arrayOfSound[i]
  
//   var buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate)
//   buffer.copyToChannel(buf, 0)
//   source.buffer = buffer;
//   source.connect(audioCtx.destination);
//   source.start(0);
// }

//playSound(arr);
var initButton = document.getElementById("init");
initButton.addEventListener("click", function() {
  // playCustomSound(5000);
  // console.log(arr);
  // console.log(samplePoints);
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

