var renderer, scene, camera, controls;
var WIDTH, HEIGHT;
var mesh, mesh2;
var root;
var clock;
//let mixer, colorMixer;
//var boneArr = [];
//var raycaster = new THREE.Raycaster();
//var mouse = new THREE.Vector2();
//var boneControl = false;

      

window.addEventListener("resize", stageResize);
stageResize();
init();

//newLight( 0xffffbb, 1 );
newLight( 0x1ace68, 1 );
        
//Add Scene Elements
uploadModel();

render();
animate();

function init() {
            
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff);
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
        
    //Adds Grid
    //Need to tailor to specific model or scale all models
    var gridHelper = new THREE.GridHelper( 5, 20 );
    scene.add( gridHelper );

            

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

    if (renderer != undefined) {

        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();

    }
}

function uploadModel() {
    const gltfLoader = new THREE.GLTFLoader();
    const gltfPath = 'Models/CesiumManFolder/CesiumMan.gltf';
    //const gltfPath = 'Models/man_rigged/scene.gltf';
    gltfLoader.load(
        gltfPath,
        function( gltf ) {
            root = gltf.scene;
                
            console.log("gltf: ",gltf);
            console.log("root: ",root);
            console.log("gltfLoader: ",gltfLoader);

            root.traverse( function ( child ) {
                if ( child.isMesh === true ) {

                    //For variables
                    console.log(child);

                    //View Skeleton Rig
                    var helper = new THREE.SkeletonHelper( child.skeleton.bones[ 0 ] );
                    helper.visible = true;	
                    scene.add( helper );
                    console.log( helper );
                            
                }
            });
                    
            //Add Model to scene
            scene.add(root);
                    
            //compute box with the model
            var box = new THREE.Box3().setFromObject(root);
            var boxSize = box.getSize(new THREE.Vector3()).length();
            var boxCenter = box.getCenter(new THREE.Vector3());
                    
            //resize camera;
            controls.maxDistance = boxSize*2;
            controls.target.copy(boxCenter);                    
            controls.update(); 

            //Adds Directional light for model based on boxSize 
            addDirLight( 0,boxSize,boxSize );
            addDirLight( 0,boxSize,-1*boxSize );
            addDirLight( boxSize,boxSize,0 );
            addDirLight( -1*boxSize,boxSize,0 );         
                    
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
        
    //Creates World Lights
function addDirLight( x,y,z ) {
            
    dirLight = new THREE.DirectionalLight(0xf44242);
    dirLight.position.set( x,y,z );
    scene.add(dirLight);
        
}
        
//Creates Controllable Light
function newLight( color, intensity ) {

    var light = new THREE.DirectionalLight( color, intensity );
    light.position.set( 1, 1, 1 );
    light.castShadow = true;
    scene.add(light);
            
    var sphere = controlSphere();
    light.add(sphere);
            
    addControls(light, "translate");

}

function addControls(object, type) {
            
    var transformControl = new THREE.TransformControls( camera, renderer.domElement );
    transformControl.addEventListener( 'change', render );
    transformControl.addEventListener( 'dragging-changed', function ( event ) {
    controls.enabled = ! event.value;
    //transformControl.enabled = event.value;
    //changePose(); //WILL FUCK UP WHEN USING FOR LIGHT
} );
            
    transformControl.attach( object );
    transformControl.setMode( type );
    transformControl.setSpace( "local" );
    scene.add( transformControl );
            
            
    transformControl.addEventListener( 'mousedown', function ( event ) {
        transformControl.attach( object );
        transformControl.setMode( type );
        transformControl.setSpace( "local" );
        scene.add( transformControl );
    } );
            
    window.addEventListener( 'keypress', function ( event ) {
        transformControl.detach( object );
        transformControl.dispose();
        scene.remove(transformControl);          
    } );
            
    //return transformControl;
}

//Maybe make for just lights
function controlSphere() {
            
    var geometry = new THREE.SphereGeometry( .025, 10, 10 );
    var material = new THREE.MeshNormalMaterial( { 
        depthTest: false,
        //color: 0x000000
    } );
    var sphere = new THREE.Mesh( geometry, material );
    sphere.material.receiveShadow = false;
    sphere.material.castShadow = false;
    sphere.material.wireframe = false;
    sphere.renderOrder = 1;

    return sphere;
            
}