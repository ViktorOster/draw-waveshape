var audioCtx = new AudioContext();

// initButton = document.getElementById("init");
// initButton.addEventListener("click", function() {
  
// });

var canvas = document.getElementById("canvas");
var canvasCtx = canvas.getContext("2d");

function sineWaveAt(sampleNumber, tone) {
    var sampleFreq = audioCtx.sampleRate / tone
    var equation = Math.PI*2
    // var equation = 5;
    return Math.sin(sampleNumber / (sampleFreq / (equation)) );
}

var arrY = [], volume = 0.2, seconds = 0.5, tone = 440
var arrX = [];
var coordinates = [];

for (var i = 0; i < audioCtx.sampleRate * seconds; i++) {
    arrY[i] = sineWaveAt(i, tone) * volume
    arrX[i] = i;
}
console.log(audioCtx.sampleRate * seconds);

var leng = audioCtx.sampleRate * seconds;
leng = 100;

for (var i = 0; i < leng; i++) {
    // arrY[i] = sineWaveAt(i, tone) * volume
    arrY[i] = sineWaveAt(i, tone) * 0.5;
    arrX[i] = i;
}
visualizeFourier();

function visualizeFourier() {
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
      var y = (arrY[i] * HEIGHT) / 2;
      var x = arrX[i]
      canvasCtx.moveTo(arrX[i], (arrY[i] * HEIGHT) + HEIGHT/2  );
      canvasCtx.lineTo(arrX[i+1], (arrY[i+1] * HEIGHT) + HEIGHT/2);
      canvasCtx.stroke();
    } 
  };

  draw();
}