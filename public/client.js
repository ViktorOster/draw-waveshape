var audioCtx = new AudioContext();


var canvas = document.getElementById("canvas");
var canvasCtx = canvas.getContext("2d");
var sampleRateFake = 100;

function sineWaveAt(sampleNumber, tone) {
    var sampleFreq = audioCtx.sampleRate / tone
    var equation = Math.PI*2
    // var equation = 5;
    return Math.sin(sampleNumber / (sampleFreq / (equation)) );
}

var arr = [], volume = 1, seconds = 0.5, tone = 441

for (var i = 0; i < audioCtx.sampleRate * seconds; i++) {
    arr[i] = sineWaveAt(i, tone) * volume
}
console.log(arr);

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
var isPlaying = false;
var isInitialized = false;

playSound(arr);

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

