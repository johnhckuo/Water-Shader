var camera, scene, renderer;
var geometry, material, mesh;
var light_source = new THREE.Vector3(0.70707, 0.70707, 0.7);
var water_color = new THREE.Vector3(0.109, 0.419, 0.627);
var imgUrl = "https://raw.githubusercontent.com/jbouny/ocean/master/demo/assets/img";

var time = new THREE.Clock();
var width = 5000, height = 5000;
var land_depth = 800;
var land_frequency = 7;
var land_vertex = 64;
var smoothingFactor = 500, boundaryHeight = 50;

init();
animate();

function init() {

    // water plane test
  THREE.TextureLoader.prototype.crossOrigin = '';
  var loader = new THREE.TextureLoader();
  // var bumpTex = loader.load('http://res.cloudinary.com/johnhckuo/image/upload/v1513674522/waternormals_q9a5yi.jpg', function(texture){
  //   texture.wrapS = THREE.RepeatWrapping;
  //   texture.wrapT = THREE.RepeatWrapping;
  // });

  uniforms = {
    amplitude: {
      type: 'f', // a float
      value: 0
    },
    u_mouse:{
      type: "v2",
      value:new THREE.Vector2()
    },
    u_resolution:{
      type: "v2",
      value: new THREE.Vector2()
    },
    u_time:{
      type: "f",
      value:0
    },
    // bumpTexture:{
    //   type:"t",
    //   value:bumpTex
    // },
    alpha: 			{ type: "f", value: 0.0 },
    baseSpeed:  {type :"f", value:0.01},
    noiseScale:		{ type: "f", value: 1.0 },
    eye: {type:"f", value: new THREE.Vector3(0, 0, 0)},
    sunDirection: {type:"v3", value: light_source},
    water_sampler: {type:"t", value:null},
    depth:		{ type: "f", value: 1000.0 },
  };

  attributes = {
    displacement: {
      type: 'f', // a float
      value: [] // an empty array
    }
  };

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.x = -1000;
  camera.position.y = 700;
  camera.position.z = -1000;

  controls = new THREE.OrbitControls( camera );
  controls.update();

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x000000 );
  uniforms.u_resolution.value.x = window.innerWidth;
  uniforms.u_resolution.value.y = window.innerHeight;

  var plane_geometry = new THREE.PlaneBufferGeometry( width, height, 32 );

  var water_texture = new THREE.WebGLRenderTarget(width, height);
  uniforms.water_sampler.value = water_texture;

  var customMaterial = new THREE.ShaderMaterial(
    {
      uniforms: uniforms,
      //attributes:     attributes,
      vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
      fragmentShader: document.getElementById( 'fragmentShader' ).textContent

    }
  );
  customMaterial.side = THREE.DoubleSide;
  surface = new THREE.Mesh( plane_geometry, customMaterial );
	surface.position.set(0,0,0);
  surface.rotation.x = Math.PI*0.5;
	scene.add( surface );


  var skyGeometry = new THREE.BoxGeometry( width, width, width );
  THREE.TextureLoader.prototype.crossOrigin = '';
  var loader = new THREE.TextureLoader();
  var materialArray = [

                  new THREE.MeshBasicMaterial( { map: loader.load( imgUrl+'/px.jpg' ) ,side: THREE.DoubleSide } ), // right
                  new THREE.MeshBasicMaterial( { map: loader.load( imgUrl+'/nx.jpg' ) ,side: THREE.DoubleSide } ), // left
                  new THREE.MeshBasicMaterial( { map: loader.load( imgUrl+'/py.jpg' ) ,side: THREE.DoubleSide } ), // top
                  new THREE.MeshBasicMaterial( { map: loader.load( imgUrl+'/ny.jpg' ) ,side: THREE.DoubleSide } ), // bottom
                  new THREE.MeshBasicMaterial( { map: loader.load( imgUrl+'/pz.jpg' ) ,side: THREE.DoubleSide } ), // back
                  new THREE.MeshBasicMaterial( { map: loader.load( imgUrl+'/nz.jpg' ) ,side: THREE.DoubleSide } )  // front

              ];

  var skyMaterial = new THREE.MeshFaceMaterial( materialArray );

  var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
  scene.add( skyBox );

  //scene.fog = new THREE.Fog(0xffffff,0,width*(3/4));
  /////////
  //panel//
  /////////

  var gui = new dat.GUI({
      height : 5 * 32 - 1
  });

  var params = {
      Wireframe : false,
  };

  gui.add(params, 'Wireframe').onFinishChange(function(){
    land.material.wireframe = params.Wireframe;
    surface.material.wireframe = params.Wireframe;

  });

  // var meshMaterial = new THREE.MeshBasicMaterial({ color: 0xFF00FF, wireframe: true });
  // var sphere = new THREE.Mesh( new THREE.SphereGeometry( 5 ), meshMaterial );
  // sphere.position.set(light_source.x, light_source.y, light_source.z);
  // scene.add( sphere );


  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize, false);
  document.onmousemove = function(e){
    uniforms.u_mouse.value.x = e.pageX
    uniforms.u_mouse.value.y = e.pageY
  }
}

function animate() {
  var deltaTime = time.getDelta();
  var elapsedTime = time.getElapsedTime();

  requestAnimationFrame(animate);

  scene.updateMatrixWorld();
  var vector = camera.position.clone();
  vector.setFromMatrixPosition( camera.matrixWorld );
  uniforms.eye.value = vector;

  uniforms.u_time.value += deltaTime;
   // camera.rotation.y += deltaTime;

  uniforms.amplitude.value = Math.sin(elapsedTime);
  renderer.render(scene, camera);
  controls.update();

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = window.innerWidth;
  uniforms.u_resolution.value.y = window.innerHeight;

}

