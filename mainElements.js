var renderer, scene, camera, controls;
var WIDTH, HEIGHT;
var clock;

//let mixer, colorMixer;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var joints = []; 
var selected;
const modelHeight = 150;

var displayTransform = true; //Doesn't really work, maybe use it to make joints[] invisible

var worldLights = [];
var spotLights = [];
var spotLightControls = [];

var hexWhite = new THREE.Color( 0xffffff );
var hexSoftLight = new THREE.Color( 0xffeac1 );

window.addEventListener( "resize", stageResize );
stageResize();
init();
        
//Add Scene Elements
uploadModel();
addSpotLights();
addWorldLight();

render();
animate();

/************************ INITIALIZERS *************************/
function init() {
            
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor( hexSoftLight );
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
    //WIDTH = 600; 
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
    //const path = 'Models/CesiumManFolder/CesiumMan.gltf'; 

    modelLoader.load(
        path,
        function( gltf ) {
            root = gltf.scene;
                
            console.log("gltf: ",gltf);
            console.log("root: ",root);
            console.log("modelLoader: ",modelLoader);

            //compute box with the model
            var intlBox = new THREE.Box3().setFromObject(root);
            var intlCenter = intlBox.getCenter(new THREE.Vector3());
            
            var unscaledHeight = intlCenter.length() * 2;
            var scaleFactor = modelHeight/unscaledHeight;
 
            root.scale.set( scaleFactor, scaleFactor, scaleFactor );

            var finbox = new THREE.Box3().setFromObject(root);
            var finCenter = finbox.getCenter(new THREE.Vector3());

            //Add joints and manipulate texture            
            root.traverse( function ( child ) {

                if ( displayTransform && child.isBone ) {

                    //Joints
                    var jointSize = modelHeight/88; 
                    //jointSize always is (1/88) of the model's height, I THOUGHT
                    //when doing cesium man, everything good excapt joint toruss were huge
                    //think they might be connected to bone size? maybe just manualy make jointSize

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

                    if (child.name == "Eyelashes" ) {
                        child.visible = false;
                    }
                            
                } 
            });

            console.log(joints);

            //Add Model to scene
            scene.add(root);

            //Resize camera;
            controls.maxDistance = modelHeight*2;
            controls.target.copy( finCenter );                    
            controls.update();  
            
            //Adds Grid
            var gridHelper = new THREE.GridHelper( modelHeight*1.5, 20 );
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
function addWorldLight() {
       
    for ( i=0; i<4; i++ ) {
        var light = new THREE.DirectionalLight( hexSoftLight );
        worldLights.push( light );
        scene.add( light );
    }

    worldLights[0].position.set( 0,modelHeight*3,modelHeight*3 );
    worldLights[1].position.set( 0,modelHeight*3,-1*modelHeight*3 );
    worldLights[2].position.set( modelHeight*3,modelHeight*3,0 );
    worldLights[3].position.set( -1*modelHeight*3,modelHeight*3,0 );

}
        
//Creates Controllable Light
function addSpotLights() {

    var amount = 3;
    //light.position.set( 0, modelHeight, modelHeight/4 );
    for ( var i=0; i<amount; i++ ) {

        var light = new THREE.PointLight( hexWhite, 1 );
        spotLights.push(light);
        light.castShadow = true;
        scene.add(light);

        var handleSize = modelHeight/50;
        var handle = controlHandle( handleSize );
        light.add(handle);
        controlAxes = addControls(light, "translate");
        spotLightControls.push(controlAxes);

        if (i>0) {

            light.visible = false;
            light.children.visible = false;
            controlAxes.visible = false;

        }

    }
    
    //Positions lights
    spotLights[0].position.set( 0,modelHeight,modelHeight );
    spotLights[1].position.set( -0.5*modelHeight,modelHeight,-1*modelHeight );
    spotLights[2].position.set( modelHeight,modelHeight,0 );

}

/************************ ALTER STUFF *************************/
//Lighting
function lightColor( light, color ) {
    
    var hexColor = new THREE.Color( parseInt( "0x"+color ) );
    
    if ( light == worldLights ) {

        for( var i=0; i<light.length(); i++ ) {
            light[i].color = hexColor;
        }

    } else {

        light.color = hexColor;

    }
}

function lightIntensity( light, intensity ) {

    if ( light == worldLights ) {

        for( var i=0; i<light.length(); i++ ) {
            light[i].intensity = intensity;
        }

    } else {

        light.intensity = intensity;

    }

}

function lightVisibility( light ) {

    
    if ( light == worldLights ) {

        for( var i=0; i<light.length(); i++ ) {
            
            light[i].visible = ! light[i].visible;
      
        }

    } else {
        
        var opp = ! light.visible;
        light.visible = opp;
        light.children.visible = opp;
        spotLightControls[spotLights.indexOf(light)].visible = opp;

    }

}

//Renderer
function setRendererColor( color ) {

    var hexColor = new THREE.Color( parseInt( "0x"+color ) );
    renderer.setClearColor( hexColor );

}


//still to do:
    //render background color
    //model skintone/reflectivity/visible joints

/************************ TRANSFORM CONTROLS *************************/

function addControls(object, type) {
            
    var transformControl = new THREE.TransformControls( camera, renderer.domElement );
    transformControl.addEventListener( 'change', render );
    transformControl.addEventListener( 'dragging-changed', function ( event ) {
        controls.enabled = ! event.value;  
        //changePose(); //WILL MESS UP WHEN USING FOR LIGHT
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
    //For x and y offset
    //mouse.x = ( ( x - renderer.domElement.offsetLeft ) / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( ( y - renderer.domElement.offsetTop ) / renderer.domElement.clientHeight ) * 2 + 1;
    
    //Regular
    mouse.x = (x / renderer.domElement.clientWidth) * 2 - 1;
    //mouse.y =  - (y / renderer.domElement.clientHeight) * 2 + 1;
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
