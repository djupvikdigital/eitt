const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xffffff );

const table = ModelTable()
scene.add(table)

const card = ModelCard('Green', '8')
scene.add(card)

const aspectRatio = window.innerWidth / window.innerHeight

const camera = new THREE.PerspectiveCamera(
    30,
    aspectRatio,
    0.1,
    2000
)

let numPlayers = 5
let circleLength = 200

function calcPointInCircle(numPlayers, circleLength) {
    for (let i = 0; i < numPlayers; i++) {
        let dir = 2 * Math.PI / numPlayers * i
        let tempX = Math.cos(dir) * circleLength
        let tempY = Math.sin(dir) * circleLength
        let own = false
        if (i == 0) own = true
        const player = ModelPlayer(own)
        player.position.set(tempX, 0, tempY)
        player.rotation.y = 2 * Math.PI - dir
        scene.add(player)
        if (i == 0) camera.position.set(tempX, 75, tempY)
    }
}

calcPointInCircle(numPlayers, circleLength)

camera.lookAt(0, 0, 0)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
dirLight.position.set(100, -300, 400)
scene.add(dirLight)

const renderer = new THREE.WebGLRenderer({ antialias: true})
renderer.setSize(window.innerWidth -20, window.innerHeight -20)

let controls = new THREE.PointerLockControls(camera, document.body)

document.body.appendChild(renderer.domElement)

window.addEventListener( 'click', function () {

    controls.lock();

} );

console.log(myCards)

// -1.04 -0.26 0.52 1.30

setInterval(function(){
    let worldDir = new THREE.Vector3
    camera.rotation.toVector3(worldDir)
    if (worldDir.y < 1) console.log(Math.PI - worldDir.z - Math.PI / 2)

    renderer.render(scene, camera)
    
},1000/50)

