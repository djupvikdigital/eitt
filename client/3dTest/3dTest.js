const scene = new THREE.Scene();
scene.background = new THREE.Color('white');

const renderer = new THREE.WebGLRenderer({ antialias: true})

let innerWidth = window.innerWidth -20
let innerHeight = window.innerHeight -20

renderer.setSize(innerWidth, innerHeight)

let aspectRatio = window.innerWidth / window.innerHeight

const camera = new THREE.PerspectiveCamera(
    30,
    aspectRatio,
    0.1,
    2000
)

camera.lookAt(0, 0, 0)



let controls = new THREE.PointerLockControls(camera, document.body)

document.getElementById('3dRoom').appendChild(renderer.domElement)

window.addEventListener( 'click', function () {
    if (document.getElementById('3dRoom').style.display == 'block') {
        controls.lock();
    }

} );

let firstTime = true

function render3DRoom(gameStatus) {
    scene.clear()

    scene.add(camera)

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
        cardsRayCast = []
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

    if (firstTime) camera.lookAt(0, 0, 0)
    firstTime = false
    
}

let raycaster = new THREE.Raycaster();

let lookCounter = 0
let lookObject = -1


setInterval(function(){
    if (innerWidth != window.innerWidth -20 || innerHeight != window.innerHeight -20) {
        innerWidth = window.innerWidth -20
        innerHeight = window.innerHeight -20

        renderer.setSize(innerWidth, innerHeight)
        aspectRatio = window.innerWidth / window.innerHeight
        camera.aspect = aspectRatio
        camera.updateProjectionMatrix
    }

    raycaster.setFromCamera({x:0, y:0}, camera);
    const intersectedObjects = raycaster.intersectObjects(cardsRayCast);
    if (intersectedObjects.length) {
        if (lookObject > -1 && intersectedObjects[0].object.cardId == lookObject) {
            lookCounter++
        } else {
            lookObject = intersectedObjects[0].object.cardId
            lookCounter = 0
        }
    } else {
        lookObject = -1
        lookCounter = 0
    }

    if (lookCounter == 100) socket.emit('playCard', { index: lookObject });
    
    renderer.render(scene, camera)
    
},1000/50)

