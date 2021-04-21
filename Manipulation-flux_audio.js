// Initialisation du contexte audio
var audio = new Audio();
audio.crossOrigin = "anonymous";
audio.src = "http://jplayer.org/audio/mp3/RioMez-01-Sleep_together.mp3";
audio.controls = true;

var ctx, source, analyser, autreAnalyzer

canvas = document.getElementById("canvas")
canvasctx = canvas.getContext("2d")

var vueCourante = {
    originX: 0,
    originY: canvas.height,
    largeur: 1024,
    hauteur: 300,
}

document.getElementById("audio").appendChild(audio)

// Fonction qui se permet de créer l’ensemble des nœuds et liaisons nécessaires pour relier la source audio à la destination audio
function setupNodes(filtre) {
    if(ctx == null) {
		ctx = new AudioContext()
		source = ctx.createMediaElementSource(audio)
	}
	else {
		source.disconnect(autreAnalyzer)
		autreAnalyzer.disconnect(analyser)
		analyser.disconnect(ctx.destination)
	}
	
    analyser = ctx.createAnalyser()  // Création d'un nœud d’analyse audio au graphe audio
    destination = ctx.destination

    autreAnalyzer = ctx.createAnalyser()

    if(filtre == "gain") {
        autreAnalyzer = ctx.createGain()
		//gainNode.gain.value = 0.5;
        autreAnalyzer.gain.setValueAtTime(2, ctx.currentTime);
    }

    if(filtre == "biquad") {
        autreAnalyzer = ctx.createBiquadFilter()
        autreAnalyzer.type = "lowpass"
        autreAnalyzer.frequency.value = 2000;   
        autreAnalyzer.Q.value = 10;
	}
	
    if(filtre == "wave") {
        autreAnalyzer = ctx.createWaveShaper()
        curveArr = new Float32Array(1024)
        for(i = 0; i < 1024; i++) {   
            curveArr[i] = i/1024      
        }
        autreAnalyzer.curve = curveArr
    }

    if(filtre == "delay") {
        autreAnalyzer = ctx.createDelay(10)
        autreAnalyzer.delayTime.value = 4
    }
    
    source.connect(autreAnalyzer)
    autreAnalyzer.connect(analyser)
    analyser.connect(destination)   // source -> autreAnalyzer -> analyser -> destination
}

// fonction qui convertie une position 2D vers une position canvas
function positionPlan2DCanvas(vueCourante, canvas, xRepere, yRepere) {
    return {
        "x": vueCourante.originX + xRepere * (canvas.width / vueCourante.largeur),
        "y": vueCourante.originY - yRepere * (canvas.height / vueCourante.hauteur)
   }
}

// Fonction qui retourne une couleur en fonction du nombre passé en paramètre
function retourneCouleur(nombre) {
    return "rgb(" + Math.min((70 + nombre), 255) + "," + Math.max((255 - nombre) , 0) + ", " + 220 + ")"
}

//Fonction qui permet de dessiner un point en connaissant la position (x,y)
function dessinePoint(x, y) {
    canvasctx.fillStyle = retourneCouleur(y)
    positionCanvas = positionPlan2DCanvas(vueCourante, canvas, x, y)
    canvasctx.fillRect(positionCanvas.x - 1, positionCanvas.y - 1,2,2)
}

//Fonction qui permet de dessiner une barre de fréquence en connaissant la position (x,y)
function dessineBarreFrequence(x, y) {
    positionDebut = positionPlan2DCanvas(vueCourante, canvas, x, 0)
    positionFin = positionPlan2DCanvas(vueCourante, canvas, x, y)
    
    canvasctx.lineWidth=1.5;
    canvasctx.strokeStyle = retourneCouleur(y)
    canvasctx.beginPath()
    canvasctx.moveTo(positionDebut.x, positionDebut.y)
    canvasctx.lineTo(positionFin.x, positionFin.y)
    canvasctx.stroke()
}

// Fonction qui permet d'afficher le signal sinusoïdal du flux audio à intervalle régulier
function visualizeSinewave() {
    canvasctx.clearRect(0, 0, canvas.width, canvas.height);
    if(analyser != null) {
        arr = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteTimeDomainData(arr)
    
        for(i = 0; i < arr.length; i++) {
            dessinePoint(i, arr[i])
        }
        console.log(arr)
    }
}

// Fonction qui permet d'afficher les données de fréquences sous forme de diagramme en bâton à intervalle régulier
function visualizeFrequencyBar() {
    canvasctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if(analyser != null) {
        arr = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(arr)
        for(i = 0; i < arr.length; i++) {
            dessineBarreFrequence(i, arr[i])
        }
    }
}

//On appel setupNodes() une unique fois lors de la première lecture de l’élément audio
initialise = false
audio.onplay = function() {
    if(initialise == false) {
        setupNodes()
        initialise = true
    }
}

// Création des boutons gain, lowpass, wave, delay, reset

boutonGain = document.getElementById("gain")
boutonGain.addEventListener("click", function(){
		setupNodes("gain")
}, false)

boutonLowpass = document.getElementById("lowpass")
boutonLowpass.addEventListener("click", function(){
		setupNodes("biquad")
}, false)
	
boutonWave = document.getElementById("wave")
boutonWave.addEventListener("click", function(){
		setupNodes("wave")
}, false)
	
boutonDelay = document.getElementById("delay")
boutonDelay.addEventListener("click", function(){
		setupNodes("delay")
}, false)

boutonReset = document.getElementById("reset")
boutonReset.addEventListener("click", function(){
		setupNodes()
}, false)

//Création des boutons pour visualiser le domaine fréquentiel de l'audio et le domaine temporel (onde)
var timer=0
boutonFrequence = document.getElementById("Frequence")
boutonOnde = document.getElementById("Onde")

boutonFrequence.addEventListener("click", function(){
		clearInterval(timer)
		timer = setInterval(function() {
			visualizeFrequencyBar()
		}, 1000)
}, false)

boutonOnde.addEventListener("click", function(){
		clearInterval(timer)
		timer = setInterval(function() {
			visualizeSinewave()
		}, 1000)
}, false)

