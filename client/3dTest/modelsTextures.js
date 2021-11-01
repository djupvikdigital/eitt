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
        let dir = Math.PI / cards.length * i - Math.PI / 3
        let tempX = Math.cos(dir) * cardLength
        let tempY = Math.sin(dir) * cardLength
        let card = ModelCard(cards[i].color, cards[i].value)
        card.cardId = i
        card.position.set(tempX, 20, tempY)
        card.rotation.y = 2 * Math.PI - dir
        card.rotation.y += Math.PI / 2
        if (own) cardsRayCast.push(card)
        player.add(card)
    }

    return player
}