var renderer, scene, camera, controls, root, grid;
var WIDTH, HEIGHT;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var joints = []; 
var selectedControls;
const modelHeight = 150;

var liveModel = false;

var worldLights = [];
var spotLights = [];
var spotLightControls = [];

var hexWhite = new THREE.Color( 0xffffff );
var hexSoftLight = new THREE.Color( 0xffeac1 );
var lightBlue = new THREE.Color( 0xA3CEFF );

window.addEventListener( "resize", stageResize );
stageResize();
init();
        
//Add Scene Elements
uploadModel( "Models/FemaleModel/Agreeing.glb" );
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
    renderer.setClearColor( lightBlue );
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    document.body.appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 1000);
    camera.position.set(150, 150, 150);

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

    var sidebar = document.getElementById("sidebar");
    WIDTH = window.innerWidth - sidebar.offsetWidth; 
    HEIGHT = window.innerHeight;

    if (renderer !== undefined) {

        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();

    }
}

function uploadModel( path ) {
    
    if ( liveModel ) {
        disposeModel();
    }

    var modelLoader = new THREE.GLTFLoader();
    var path = path;

    modelLoader.load(
        path,
        function( gltf ) {
            root = gltf.scene;
                
            //console.log("gltf: ",gltf);
            //console.log("root: ",root);
            //console.log("modelLoader: ",modelLoader);

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

                if ( child.isBone ) {

                    //Joints
                    var jointSize = modelHeight/88; 

                    const fingers = [ "Pinky", "Ring", "Thumb", "Middle", "Index" ];
                    
                    if ( fingers.some( finger => child.name.includes(finger) ) ) {

                        var joint = controlHandle( jointSize/3 );

                    } else {

                        var joint = controlHandle( jointSize*1.2 );

                    }
                    
                    joints.push( joint );
                    child.add( joint );

                }
                
                if ( child.isMesh ) {

                    child.material.metalness = 0.1;
                    
                    if ( child.name === "Eyelashes" ) {
                        child.visible = false;
                    }
                } 
            } );

            //console.log(joints);

            //Add Model to scene
            scene.add(root);

            //Resize camera;
            controls.maxDistance = modelHeight*2;
            controls.target.copy( finCenter );                    
            controls.update();  
            
            //Adds Grid
            if ( ! grid ) {

                grid = new THREE.GridHelper( modelHeight*1.5, 20, 0x565656, 0x565656 );
                scene.add( grid );

            }

            //Activates Live Model
            liveModel = true;
                    
        },

        // called while loading is progressing
        function ( xhr ) {

            var perc = xhr.loaded / xhr.total * 100;
            console.log( perc + '% loaded' );
            
            if( perc == 100 ) {
                document.querySelector("#loader").innerHTML = null;
            } else {
                document.querySelector("#loader").innerHTML = `Loading...${Math.round(perc, 2)}% downloaded`;
            }

        },
                
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );                    
            console.log( error )
    
        }                           
    );
}

function disposeModel() {

    if ( root ) {
        scene.remove( root );
        root.dispose();

        for ( var i=0; i<joints.length; i++ ) {
            scene.remove(joints[i]);
            joints[i].material.dispose();
            joints[i].geometry.dispose();
        }

        joints = [];
        if ( selectedControls ) {
            selectedControls.visible = false;
        }

        liveModel = false;

    }

}
 
/************************ LIGHTING *************************/

//Creates World Lights
function addWorldLight() {
       
    for ( i=0; i<4; i++ ) {
        var light = new THREE.DirectionalLight( hexSoftLight );
        light.intensity = 0.6;
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
    //var depth = modelHeight/10;
    var depth = modelHeight/2;
    spotLights[0].position.set( 0,depth*2,depth );
    spotLights[1].position.set( -0.5*depth,depth,-1*depth );
    spotLights[2].position.set( depth,depth,0 );

}

/************************ ALTER STUFF *************************/
//Lighting
function lightColor( light, color ) {
    
    var hexColor = new THREE.Color( parseInt( "0x"+color ) );
    
    if ( light === worldLights ) {

        for( var i=0; i<light.length; i++ ) {
            light[i].color = hexColor;
        }

    } else {

        light.color = hexColor;

    }
}

function lightIntensity( light, inc ) { 

    if ( light === worldLights && light[0].intensity+inc<7.5 && light[0].intensity+inc>-0.5 ) {

        for( var i=0; i<light.length; i++ ) {
            
            light[i].intensity += inc;

        }
        

    } else if ( light.intensity+inc<7.5 && light.intensity+inc>-0.5 ){

        light.intensity += inc;
        
    }   
}

function lightVisibility( light ) {

    
    if ( light === worldLights ) {

        for( var i=0; i<light.length; i++ ) {
            
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

function showGrid() {

    grid.visible = ! grid.visible;

}

//Model 
function setSkinTone( color ) {

    var hexColor = new THREE.Color( parseInt( "0x"+color ) );

    if ( root ) {
        root.traverse( function( child ) {
            if ( child.isMesh && child.type === "SkinnedMesh" ) {

                child.material.color = hexColor; 

            }
        });
    }
}

function modelReflectivity( inc ) {

    if (root) {
        root.traverse( function ( child ) {
            if (child.isMesh && child.material.roughness+inc>0 && child.material.roughness+inc<1) {
                
                child.material.roughness += inc;

            }
        });
    }
}

function jointsVisible() {

    var opp = ! joints[0].visible;

    for ( var i=0; i<joints.length; i++ ) {
        joints[i].visible = opp;
    }

    if (selectedControls) {
        //selectedControls.visible = opp;
        selectedControls.detach();
    }
}

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
    
    //var geometry = new THREE.TorusGeometry( size, size/2.5, 10, 10 );
    var geometry = new THREE.SphereGeometry( size, 10, 10 );
    var material = new THREE.MeshPhongMaterial( { 
        depthTest: false,
        color: hexWhite,
        wireframe: true
    } );

    var handle = new THREE.Mesh( geometry, material );
    handle.material.receiveShadow = false;
    handle.material.castShadow = false;
    handle.renderOrder = 1;

    return handle;
            
}

/************************ JOINT RAYCASTER *************************/

document.addEventListener('mousedown', function (event) {

    event.preventDefault();
    moveJoint( event.clientX, event.clientY );
    
}, false);

document.addEventListener('touchstart', function (event) {
    
    //event.preventDefault();
    moveJoint( event.touches[0].clientX, event.touches[0].clientY );
    
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

        if ( selectedControls && selectedJoint) {

            //Future fix vv, why change all color when can just change previous?
            joints.forEach(child => child.material.color = { r: 1, g: 1, b: 1 }); 

            selectedControls.detach();
        
        }
        
        selectedJoint.material.color = { r: 0, g: 0, b: 1 };
        selectedControls = addControls( selectedJoint.parent, "rotate" ) 
 
    }
}
