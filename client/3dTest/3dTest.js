const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xffffff );

const aspectRatio = window.innerWidth / window.innerHeight

const camera = new THREE.PerspectiveCamera(
    30,
    aspectRatio,
    0.1,
    2000
)

camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true})
renderer.setSize(window.innerWidth -20, window.innerHeight -20)

let controls = new THREE.PointerLockControls(camera, document.body)

document.getElementById('3dRoom').appendChild(renderer.domElement)

window.addEventListener( 'click', function () {
    if (document.getElementById('3dRoom').style.display == 'block') {
        controls.lock();
    }

} );

function render3DRoom(gameStatus) {
    scene.clear()

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
    dirLight.position.set(100, -300, 400)
    scene.add(dirLight)

    const table = ModelTable()
    scene.add(table)

    const card = ModelCard(gameStatus.lastPlayedCard.color, gameStatus.lastPlayedCard.value)
    scene.add(card)

    for (let i = 0; i < gameStatus.playerList.length; i++) {
        let currentPlayer = gameStatus.playerList[i]
        let dir = 2 * Math.PI / gameStatus.playerList.length * i
        let tempX = Math.cos(dir) * 200
        let tempY = Math.sin(dir) * 200
        let own = false
        if (currentPlayer.id == gameStatus.id) own = true
        let cards = []
        if (own) cards = gameStatus.cards
        if (!own) {
            for (let a = 0; a < currentPlayer.numberOfCards; a++) {
                cards.push({color: 'Grey', value: ''})
            }
        }
        const player = ModelPlayer(own, cards)
        player.position.set(tempX, 0, tempY)
        player.rotation.y = 2 * Math.PI - dir
        scene.add(player)
        if (own) camera.position.set(tempX, 75, tempY)
    }

    camera.lookAt(0, 0, 0)
    
}

setInterval(function(){
    let worldDir = new THREE.Vector3
    camera.rotation.toVector3(worldDir)
    if (worldDir.y < 1) console.log(Math.PI - worldDir.z - Math.PI / 2)

    renderer.render(scene, camera)
    
},1000/50)

