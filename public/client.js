var audioCtx = new AudioContext();

var canvas2 = document.getElementById("canvas2");
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
//same as below but with different x scaling and without y scaling since y points are scaled
function addOldPoint(posX, posY) {
  var sampleY = posY;
  //offset X by tone ratio change
  var sampleX = Math.round( posX * (samplesInOneOscillation/oldSamplesInOneOscillation) );
  //add amplitude at time
  samplePoints[sampleX] = sampleY;
  userPoints.push({x: sampleX, y: sampleY});
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
    samplePoints[start+i] = (y0*(x1-x) + y1*(x-x0))/ x1-x0; //linear interpolation function
  }
}

var clearCanvasButton = document.getElementById("clear-canvas");
clearCanvasButton.addEventListener("click", function() {
  samplePoints = [];
  userPoints = [];
  setTone(tone);
  visualizeSamplesAsPoints();
});

visualizeSamplesAsPoints();

function visualizeSamplesAsPoints() {
  canvas2Ctx.clearRect(0, 0, canvas2Width, canvas2Height);
  canvas2Ctx.fillStyle = "white";
  canvas2Ctx.fillRect(0, 0, canvas2Width, canvas2Height);
  canvas2Ctx.fillStyle = "black";
  canvas2Ctx.beginPath();
  for(var x=0; x < samplePoints.length; x++){
    var y = samplePoints[x];

    //with stretching to fit tone (waveform wont shrink/expand on canvas when changing hz)
    canvas2Ctx.moveTo((x *100/samplesInOneOscillation ) * canvasSizeOffsetX, (samplePoints[x] * canvas2Height/2) + canvas2Height/2 );
    canvas2Ctx.lineTo( ( (x *100/samplesInOneOscillation ) *canvasSizeOffsetX)+ canvasSizeOffsetX, (samplePoints[x+1] * canvas2Height/2) + canvas2Height/2);
    //without stretching, needs to repeat drawing on x
    //canvas2Ctx.moveTo((x *100/oldSamplesInOneOscillation ) * canvasSizeOffsetX, (samplePoints[x] * canvas2Height/2) + canvas2Height/2 );
    //canvas2Ctx.lineTo( ( (x *100/oldSamplesInOneOscillation ) *canvasSizeOffsetX)+ canvasSizeOffsetX, (samplePoints[x+1] * canvas2Height/2) + canvas2Height/2);
    canvas2Ctx.stroke();
  }
  canvas2Ctx.fillStyle = "gray";
  for(var i=0; i < userPoints.length; i++){
    canvas2Ctx.fillRect( ( ((userPoints[i].x *100/samplesInOneOscillation ) *canvasSizeOffsetX)+ canvasSizeOffsetX)-6, ((userPoints[i].y * canvas2Height/2) + canvas2Height/2)-3, 6, 6);
  }
}
var keys = {};
window.onkeyup = function(e) { keys[e.keyCode] = false; }
window.onkeydown = function(e) { keys[e.keyCode] = true; }

function checkIfHeld(kcode) {
  return keys[kcode];
}

function waitfor(test, expectedValue, msec, count, source, callback) {
    // Check if condition met. If not, re-check later (msec).
    while (test() !== expectedValue) {
        count++;
        setTimeout(function() {
            waitfor(test, expectedValue, msec, count, source, callback);
        }, msec);
        return;
    }
    // Condition finally met. callback() can be executed.
    console.log(source + ': ' + test() + ', expected: ' + expectedValue + ', ' + count + ' loops.');
    callback();
}

var keyIsHeld = false;
document.addEventListener('keydown', function(event){
  if(event.keyCode == 32){
    //start looping audio buffer
    if(!keyIsHeld){
      keyIsHeld = true;
      var buf = new Float32Array(samplePoints.length)
      for (var i = 0; i < samplePoints.length; i++) buf[i] = samplePoints[i]
      var buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate)
      buffer.copyToChannel(buf, 0)
      var source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.loop = true;
      source.start(0);
      
      function waitFor(conditionFunction) {

        const poll = resolve => {
          if(conditionFunction()) resolve();
          else setTimeout(_ => poll(resolve), 100);
        }

        return new Promise(poll);
      }
      waitFor(_ => flag === true)
        .then(_ => console.log('the wait is over!'));
 
    }
  }
  
} );


// document.addEventListener('keyup', function(event){
//   if(event.keyCode == 32){
//     keyIsHeld = false;
//     handlePlayPause(false);
//   }
  
// } );

function handlePlayPause(play) {
  if(play) {
    
  }
  // var buf = new Float32Array(samplePoints.length)
  // for (var i = 0; i < samplePoints.length; i++) buf[i] = samplePoints[i]
  // var buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate)
  // buffer.copyToChannel(buf, 0)
  // var source = audioCtx.createBufferSource();
  // source.buffer = buffer;
  // source.connect(audioCtx.destination);
  // source.loop = true;
  // source.start(0);

}


function playSoundLooping(arr2) {
  var buf = new Float32Array(arr2.length)
  for (var i = 0; i < arr2.length; i++) buf[i] = arr2[i]
  var buffer = audioCtx.createBuffer(1, buf.length, audioCtx.sampleRate)
  buffer.copyToChannel(buf, 0)
  var source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.loop = true;
  source.start(0);

}


var initButton = document.getElementById("init");
initButton.addEventListener("click", function() {
    playSoundLooping(samplePoints);
});

