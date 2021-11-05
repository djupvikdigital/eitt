const scene = new THREE.Scene();
scene.background = new THREE.Color('white');

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: threeDCanvas})

let canvas = document.getElementById('threeDCanvas')

let innerWidth = window.innerWidth -20
let innerHeight = window.innerHeight -20

renderer.setSize(innerWidth, innerHeight)

let aspectRatio = window.innerWidth / window.innerHeight

const camera = new THREE.PerspectiveCamera(
    60,
    aspectRatio,
    0.1,
    2000
)

camera.lookAt(0, 0, 0)



let controls = new THREE.PointerLockControls(camera, document.body)

window.addEventListener( 'click', function () {
    if (document.getElementById('3dRoom').style.display == 'block') {
        controls.lock();
    }

} );

canvas.addEventListener('touchstart', dragStart, false)
canvas.addEventListener('touchend', dragEnd, false)
canvas.addEventListener('touchmove', drag, false)

let touchExist = -1
let touchX = 0
let touchY = 0

const _PI_2 = Math.PI / 2;

function dragStart(e) {
    e.preventDefault()
    if (e.touches.length == 1) {
        touchX = e.touches[0].clientX
        touchY = e.touches[0].clientY
        touchExist = e.touches[0].identifier
    }
}

function dragEnd(e) {
    if (e.touches.length > 0) {
        let doesTouchExist = false
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier == touchExist) doesTouchExist = true
        }
        if (!doesTouchExist) {
            touchX = e.touches[0].clientX
            touchY = e.touches[0].clientY
            touchExist = e.touches[0].identifier
        }
    } else {
        touchExist = -1
        touchX = 0
        touchY = 0
    }
}

function drag(e) {
    e.preventDefault()
    for (let i = 0; i < e.touches.length; i++) {
        let touch = e.touches[i]
        if (touch.identifier == touchExist) {
            const movementX = touch.clientX - touchX
            const movementY = touch.clientY - touchY

            let _euler = new THREE.Euler( 0, 0, 0, 'YXZ' );

            _euler.setFromQuaternion( camera.quaternion );

            _euler.y += movementX * 0.002;
            _euler.x += movementY * 0.002;
            _euler.x = Math.max( _PI_2 - Math.PI, Math.min( _PI_2, _euler.x ) );
            camera.quaternion.setFromEuler( _euler );
            touchX = touch.clientX
            touchY = touch.clientY
        }
    }
}

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

    cardsRayCast = []

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

    if (firstTime) camera.lookAt(0, 0, 0)
    firstTime = false
    
}

let raycaster = new THREE.Raycaster();

let lookCounter = 0
let lookObject = -1

let lookCounterChooser = 0
let lookObjectChooser = ''

let chooserArr = []
let chooserCardIndex = -1

function show3DColorP(cardIndex) {
    let card = cardsRayCast[cardIndex]
    for (let i = 0; i < chooserArr.length; i++) {
        let chooser = chooserArr[i]
        chooser.visible = false
    }
    chooserArr = []
    for (let i = 0; i < card.children.length; i++) {
        let chooser = card.children[i]
        chooser.visible = true
        chooserArr.push(chooser)
    }
}


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
    let intersectedObjects = raycaster.intersectObjects(cardsRayCast);
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

    if (chooserArr.length) {
        intersectedObjects = raycaster.intersectObjects(chooserArr);
        if (intersectedObjects.length) {
            if (lookObjectChooser != '' && intersectedObjects[0].object.chooserColor == lookObjectChooser) {
                lookCounterChooser++
            } else {
                lookObjectChooser = intersectedObjects[0].object.chooserColor
                lookCounterChooser = 0
                console.log(lookObjectChooser)
            }
        } else {
            lookObjectChooser = ''
            lookCounterChooser = 0
        }
    }

    if (lookCounter == 100) {
        if (gameStatus.cards[lookObject].color != 'black') {
            socket.emit('playCard', { index: lookObject });
            chooserArr = []
            lookCounter = 0
            lookObject = -1
    
            lookCounterChooser = 0
            lookObjectChooser = ''
        } else {
            show3DColorP(lookObject)
            chooserCardIndex = lookObject
        }
    }
    
    if (lookCounterChooser == 100) {
        socket.emit('playCard', { index: chooserCardIndex , color: lookObjectChooser});
        console.log('card index: ' + chooserCardIndex + ' color: ' + lookObjectChooser)
        for (let i = 0; i < chooserArr.length; i++) {
            let chooser = chooserArr[i]
            chooser.visible = false
        }
        chooserArr = []
        lookCounter = 0
        lookObject = -1

        lookCounterChooser = 0
        lookObjectChooser = ''
    }

    renderer.render(scene, camera)
    
},1000/50)

