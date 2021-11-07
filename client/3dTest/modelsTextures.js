let cardsRayCast = []

function getCardTexture(width, height, color, value) {
    const canvas = document.createElement("canvas")
    const resWidth = width * 8
    const resHeight = height * 8
    canvas.width = resWidth
    canvas.height = resHeight
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = color
    ctx.fillRect(0, 0, resWidth, resHeight)

    ctx.fillStyle = 'White'
    ctx.beginPath();
    ctx.arc(resWidth/2, resHeight/2, resWidth/2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'Black'
    ctx.font = '100px serif';
    ctx.fillText(value, resWidth/2 - resWidth / 6 * value.length, resHeight/1.7)


    return new THREE.CanvasTexture(canvas)
}

function getButtonTexture(width, height, text) {
    const canvas = document.createElement("canvas")
    const resWidth = width * 8
    const resHeight = height * 8
    canvas.width = resWidth
    canvas.height = resHeight
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = 'lightgrey'
    ctx.fillRect(0, 0, resWidth, resHeight)

    ctx.fillStyle = 'Black'
    ctx.font = '100px serif';
    ctx.fillText(text, resWidth/2 - resWidth / 10 * text.length, resHeight/1.3)

    return new THREE.CanvasTexture(canvas)
}

function ModelCard(color, value) {
    const width = 20
    const height = 50

    const cardTexture = getCardTexture(width, height, color, value)

    const card = new THREE.Mesh(
        new THREE.BoxGeometry(width, 2, height), [
        new THREE.MeshLambertMaterial({color: 0x9fb4c7}),
        new THREE.MeshLambertMaterial({color: 0x9fb4c7}),
        new THREE.MeshLambertMaterial({map: cardTexture}),
        new THREE.MeshLambertMaterial({color: 0x9fb4c7}),
        new THREE.MeshLambertMaterial({color: 0x9fb4c7}),
        new THREE.MeshLambertMaterial({color: 0x9fb4c7}),
    ])

    card.rotation.y = Math.PI /2

    return card
}

function ModelTable() {
    const table = new THREE.Group()

    const tablePlate = new THREE.Mesh(
        new THREE.CircleGeometry(160, 50),
        new THREE.MeshLambertMaterial({ color: 0x102b0b})
    )

    tablePlate.rotation.x-= Math.PI / 2

    table.add(tablePlate)

    return table
}

function ModelPlayer(own, cards) {
    const player = new THREE.Group()

    const body = new THREE.Mesh(
        new THREE.BoxBufferGeometry(50, 150, 50),
        new THREE.MeshLambertMaterial({color: 0xffa000})
    )

    if (!own) player.add(body)

    const armLeft = new THREE.Mesh(
        new THREE.BoxBufferGeometry(10, 50, 10),
        new THREE.MeshLambertMaterial({color: 0x992525})
    )

    armLeft.position.set(-30, 25, -30)
    armLeft.rotation.z = Math.PI / 3
    armLeft.rotation.x = Math.PI / 5

    if (!own) player.add(armLeft)

    const armRight = new THREE.Mesh(
        new THREE.BoxBufferGeometry(10, 50, 10),
        new THREE.MeshLambertMaterial({color: 0x992525})
    )

    armRight.position.set(-30, 25, 30)
    armRight.rotation.z = Math.PI / 3
    armRight.rotation.x = -1*Math.PI / 5

    if (!own) player.add(armRight)

    const cardLength = -70

    for (let i = 0; i < cards.length; i++) {
        let cardMarg = Math.PI / 6
        let dir = - (cards.length / 2 - 0.5) * cardMarg + i*cardMarg
        let tempX = Math.cos(dir) * cardLength
        let tempY = Math.sin(dir) * cardLength
        let card = ModelCard(cards[i].color, cards[i].value)
        card.cardId = i
        card.cardDir = dir
        card.position.set(tempX, 20, tempY)
        card.rotation.y = 2 * Math.PI - dir
        card.rotation.y += Math.PI / 2
        if (own) cardsRayCast.push(card)
        if (own && cards[i].color == 'black') {
            let colors = ['red', 'green', 'yellow', 'blue']
            for (let i = 0; i < colors.length; i++) {
                let chooserLength = 25
                let chooser = Chooser(colors[i])
                let chooserMarg = Math.PI / 4
                let chooserDir = -Math.PI/2 - (colors.length / 2 - 0.5) * chooserMarg + i*chooserMarg
                let tempX = Math.cos(chooserDir) * chooserLength
                let tempY = Math.sin(chooserDir) * chooserLength
                chooser.position.set(tempX, 20, tempY)
                chooser.rotation.y = 2 * Math.PI - chooserDir
                card.add(chooser)
                chooser.visible = false
                chooser.chooserColor = colors[i]
            }
        }
        player.add(card)
    }

    if (own) {
        let buttonDraw = Button('Draw')
        buttonDraw.rotation.y = Math.PI /2

        player.add(buttonDraw)

        let buttonEitt = Button('Eitt')
        buttonEitt.rotation.y = Math.PI /2
        buttonEitt.position.x -= 15

        player.add(buttonEitt)

        let buttonPass = Button('Pass')
        buttonPass.rotation.y = Math.PI /2
        buttonPass.position.x -= 30

        player.add(buttonPass)
    }

    return player
}

function Chooser(color) {
    const box = new THREE.Mesh(
        new THREE.BoxBufferGeometry(15, 5, 15),
        new THREE.MeshLambertMaterial({ color: new THREE.Color(color)})
    )
    return box
}

function Button(text) {
    let width = 30
    let height = 15

    let color = new THREE.Color('lightgrey')

    const boxTexture = getButtonTexture(width, height, text)

    const box = new THREE.Mesh(
        new THREE.BoxGeometry(width, 2, height), [
        new THREE.MeshLambertMaterial({color: color}),
        new THREE.MeshLambertMaterial({color: color}),
        new THREE.MeshLambertMaterial({map: boxTexture}),
        new THREE.MeshLambertMaterial({color: color}),
        new THREE.MeshLambertMaterial({color: color}),
        new THREE.MeshLambertMaterial({color: color}),
    ])
    return box
}