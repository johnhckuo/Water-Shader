var camera, scene, renderer;
var geometry, material, mesh;
var light_source = new THREE.Vector3(0.70707, 0.70707, 0.7);
var water_color = new THREE.Vector3(0.109, 0.419, 0.627);

var time = new THREE.Clock();
var width = 5000, height = 5000;
var land_depth = 800;
var land_frequency = 7;
var land_vertex = 64;
var smoothingFactor = 500, boundaryHeight = 50;
var ms_Water;


init();


function init() {

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x000000 );

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(-1000, 700, -1000);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  controls = new THREE.OrbitControls( camera, renderer.domElement );

  var directionalLight = new THREE.DirectionalLight(0xffff55, 1);
  directionalLight.position.set(-600, 300, 600);
  scene.add(directionalLight);

  var plane_geometry = new THREE.PlaneBufferGeometry( width, height, 32 );

  ms_Water = new THREE.Water(renderer, camera, scene, {
      textureWidth: 256,
      textureHeight: 256,
      // waterNormals: waterNormals,
      alpha:  1.0,
      sunDirection: directionalLight.position.normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      betaVersion: 0,
      side: THREE.DoubleSide
  });


  surface = new THREE.Mesh( plane_geometry, ms_Water.material );
  surface.add(ms_Water);

	surface.position.set(0,0,0);
  surface.rotation.x = Math.PI*0.5;

	scene.add( surface );

  // Update the render target cube

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
    // land.material.wireframe = params.Wireframe;
    surface.material.wireframe = params.Wireframe;

  });

  var meshMaterial = new THREE.MeshBasicMaterial({ color: 0xFF00FF, wireframe: false });
  var sphere = new THREE.Mesh( new THREE.SphereGeometry( 500 ), meshMaterial );
  sphere.position.set(0, 800, 0);
  scene.add( sphere );

  window.addEventListener('resize', onWindowResize, false);
  animate();
}

function animate() {
  var deltaTime = time.getDelta();
  var elapsedTime = time.getElapsedTime();
  requestAnimationFrame(animate);
  scene.updateMatrixWorld();

  ms_Water.render();
  ms_Water.material.uniforms.u_time.value += deltaTime;

  renderer.render(scene, camera);
  controls.update();

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

