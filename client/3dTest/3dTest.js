function Table() {
    const table = new THREE.Group()

    const tablePlate = new THREE.Mesh(
        new THREE.CircleBufferGeometry(160, 50),
        new THREE.MeshLambertMaterial({ color: 0x333333})
    )

    tablePlate.rotation.x-=1.5

    table.add(tablePlate)

    return table
}

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xffffff );

const table = Table()
scene.add(table)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
dirLight.position.set(100, -300, 400)
scene.add(dirLight)



const aspectRatio = window.innerWidth / window.innerHeight

const cameraWidth = 500
const cameraHeight = cameraWidth / aspectRatio


const camera = new THREE.PerspectiveCamera(
    30,
    aspectRatio,
    0.1,
    2000
)

/*
const camera = new THREE.OrthographicCamera(
    cameraWidth / -2,
    cameraWidth / 2,
    cameraHeight / 2,
    cameraHeight / -2,
    0,
    1000
)
*/

camera.position.set(200, 100, 200)
//camera.up.set(0, 0, 1)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true})
renderer.setSize(window.innerWidth -20, window.innerHeight -20)

let controls = new THREE.PointerLockControls(camera, document.body)

document.body.appendChild(renderer.domElement)

window.addEventListener( 'click', function () {

    controls.lock();

} );


setInterval(function(){
    renderer.render(scene, camera)
},1000/50)

