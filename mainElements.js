var renderer, scene, camera, controls;
var WIDTH, HEIGHT;
var clock;

//let mixer, colorMixer;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var joints = []; 
var selected;

var displayTransform = true;

var hexWhite = new THREE.Color( 0xffffff );
var hexSoftLight = new THREE.Color( 0xffeac1 );

var boxSize;


window.addEventListener( "resize", stageResize );
stageResize();
init();

newLight( hexWhite, 1 );
        
//Add Scene Elements
uploadModel();

render();
animate();

/************************ INITIALIZERS *************************/
function init() {
            
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor( hexWhite );
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    document.body.appendChild(renderer.domElement);

    //Clock
    //clock = new THREE.Clock();

    // Camera
    camera = new THREE.PerspectiveCamera(100, WIDTH / HEIGHT, 0.1, 1000);
    camera.position.set(500, 0, 0);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 5;
            
    // Scene
    scene = new THREE.Scene();

    }
        
function render() {

    renderer.render( scene, camera );

}         

function animate() {

    requestAnimationFrame( animate );
    render();

}

function stageResize() {

    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    if (renderer !== undefined) {

        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();

    }
}

function uploadModel() {
    const modelLoader = new THREE.GLTFLoader();
    const path = 'Models/FemaleModel/Agreeing.glb'; 

    modelLoader.load(
        path,
        function( gltf ) {
            root = gltf.scene;
                
            console.log("gltf: ",gltf);
            console.log("root: ",root);
            console.log("modelLoader: ",modelLoader);

            //compute box with the model
            var box = new THREE.Box3().setFromObject(root);
            boxSize = box.getSize(new THREE.Vector3()).length();
            var boxCenter = box.getCenter(new THREE.Vector3());
            var jointSize = boxCenter.length()/44; //sphereSize always is (1/44) of length to boxcenter

            console.log(boxCenter.length());
            console.log(jointSize);

            //Add joint spheres and manipulate texture            
            root.traverse( function ( child ) {
                   
                if ( displayTransform && child.isBone ) {

                    //Joints
                    const fingers = [ "Pinky", "Ring", "Thumb", "Middle", "Index" ];
                    
                    if ( fingers.some( finger => child.name.includes(finger) ) ) {

                        var joint = controlHandle( jointSize/3 );

                    } else {

                        var joint = controlHandle( jointSize );

                    }
                    
                    joints.push( joint );
                    child.add( joint );

                }

                if ( child.isMesh ) {
                    
                    child.material.color = { r: 1, g: 1, b: 1 }; 
                    child.material.metalness = 0.1;
                    child.material.roughness = 0.55;
                            
                } 
            });

            console.log(joints);

            //Add Model to scene
            scene.add(root);

            //Resize camera;
            controls.maxDistance = boxSize*2;
            controls.target.copy(boxCenter);                    
            controls.update(); 

            //Adds Directional light for model based on boxSize 
            //addDirLight( 0,boxSize,boxSize );
            //addDirLight( 0,boxSize,-1*boxSize );
            //addDirLight( boxSize,boxSize,0 );
            //addDirLight( -1*boxSize,boxSize,0 );    
            
            //Adds Grid
            var gridHelper = new THREE.GridHelper( boxSize, 20 );
            scene.add( gridHelper );
                    
        },

        // called while loading is progressing
        function ( xhr ) {

            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

        },
                
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );                    
            console.log( error )
    
        }                           
    );
}
        
/************************ LIGHTING *************************/

//Creates World Lights
function addDirLight( x,y,z ) {
        
    var worldLights = [];
    dirLight = new THREE.DirectionalLight( hexSoftLight );
    dirLight.position.set( x,y,z );
    scene.add(dirLight);

    //addDirLight( 0,boxSize,boxSize );
            //addDirLight( 0,boxSize,-1*boxSize );
            //addDirLight( boxSize,boxSize,0 );
            //addDirLight( -1*boxSize,boxSize,0 );   
        
}
        
//Creates Controllable Light
function newLight( color, intensity ) {

    var light = new THREE.DirectionalLight( color, intensity );
    light.position.set( 1, 1, 1 );
    light.castShadow = true;
    scene.add(light);
            
    var handleSize = 3;
    var handle = controlHandle( handleSize );
    light.add(handle);
            
    addControls(light, "translate");

}

/************************ TRANSFORM CONTROLS *************************/

function addControls(object, type) {
            
    var transformControl = new THREE.TransformControls( camera, renderer.domElement );
    transformControl.addEventListener( 'change', render );
    transformControl.addEventListener( 'dragging-changed', function ( event ) {
        controls.enabled = ! event.value;  
        //changePose(); //WILL FUCK UP WHEN USING FOR LIGHT
    } );
            
    transformControl.attach( object );
    transformControl.setMode( type );
    transformControl.setSpace( "local" );
    scene.add( transformControl );
            
    return transformControl;

}

function controlHandle( size ) {
    
    //var geometry = new THREE.SphereGeometry( size, 10, 10 );
    var geometry = new THREE.TorusGeometry( size, size/2.5, 10, 10 );
    var material = new THREE.MeshPhongMaterial( { 
        depthTest: false,
        color: hexWhite
    } );

    var handle = new THREE.Mesh( geometry, material );
    handle.material.receiveShadow = false;
    handle.material.castShadow = false;
    handle.material.wireframe = false;
    handle.renderOrder = 1;

    return handle;
            
}

/************************ JOINT RAYCASTER *************************/

document.addEventListener('mousedown', function (event) {

    event.preventDefault();
    moveJoint( event.clientX, event.clientY );
    
}, false);
  
function moveJoint( x, y ) {
    
    mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y =  - (y / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects( joints );

    if (intersects.length > 0) {

        var selectedJoint = intersects[0].object;

        if ( selected && selectedJoint) {

            joints.forEach(child => child.material.color = { r: 1, g: 1, b: 1 });
            selected.detach();
        
        }
        
        selectedJoint.material.color = { r: 0, g: 0, b: 1 };
        selected = addControls( selectedJoint.parent, "rotate" ) 

    }
}
