var camera, scene, renderer;
var geometry, material, mesh;
var light_source = new THREE.Vector3(707.07, 707.07, 700);
var water_color = new THREE.Vector3(0.109, 0.419, 0.627);
var imgUrl = "https://raw.githubusercontent.com/jbouny/ocean/master/demo/assets/img";
var tile = "../img/tile.jpg";

var time = new THREE.Clock();
var width = 5000, height = 5000;
var land_depth = 800;
var land_frequency = 7;
var land_vertex = 64;
var smoothingFactor = 500, boundaryHeight = 50;
var ms_Water;
var waveX = 0.5, waveY = 1.5, rippleX = 1, rippleY = 2;
var gridNumber = 20;

init();


function init() {

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x000000 );

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 3000000);
  camera.position.set(-1000, 700, -1000);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  controls = new THREE.OrbitControls( camera, renderer.domElement );

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position = light_source;
  scene.add(directionalLight);

  var plane_geometry = new THREE.PlaneBufferGeometry( width, height, 32, 32 );

  ms_Water = new THREE.Water(renderer, camera, scene, {
      textureWidth: 256,
      textureHeight: 256,
      // waterNormals: waterNormals,
      alpha:  1.0,
      sunDirection: light_source.normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      betaVersion: 0,
      side: THREE.DoubleSide,
      gridNumber: gridNumber,
      waveX: waveX,
      waveY: waveY,
      rippleX: rippleX,
      rippleY: rippleY
  });


  surface = new THREE.Mesh( plane_geometry, ms_Water.material );
  surface.add(ms_Water);

  surface.position.set(0,0,0);
  surface.rotation.x = Math.PI*0.5;

  scene.add( surface );

  // Update the render target cube

  // var skyGeometry = new THREE.BoxGeometry( 5000, 5000, 5000 );
  var skyGeometry = new THREE.BoxGeometry( 10000, 10000, 10000 );

  THREE.TextureLoader.prototype.crossOrigin = '';
  var loader = new THREE.TextureLoader();
  // var materialArray = [

  //                 new THREE.MeshBasicMaterial( { map: loader.load( tile ) ,side: THREE.BackSide } ), // right
  //                 new THREE.MeshBasicMaterial( { map: loader.load( tile ) ,side: THREE.BackSide } ), // left
  //                 new THREE.MeshBasicMaterial( { map: loader.load( tile ) ,side: THREE.BackSide } ), // top
  //                 new THREE.MeshBasicMaterial( { map: loader.load( tile ) ,side: THREE.BackSide } ), // bottom
  //                 new THREE.MeshBasicMaterial( { map: loader.load( tile ) ,side: THREE.BackSide } ), // back
  //                 new THREE.MeshBasicMaterial( { map: loader.load( tile ) ,side: THREE.BackSide } )  // front

  //             ];

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

  /////////
  //panel//
  /////////

  var gui = new dat.GUI({
      height : 5 * 32 - 1
  });

  var params = {
      Wireframe : false,
      WaveX : waveX,
      WaveY : waveY,
      RippleX : rippleX,
      RippleY : rippleY,
      Grid: gridNumber

  };

  gui.add(params, 'Wireframe').onFinishChange(function(){
    // land.material.wireframe = params.Wireframe;
    surface.material.wireframe = params.Wireframe;

  });

  gui.add(params, 'Grid').min(0).max(50).step(0.5).onChange(function(){
    ms_Water.material.uniforms.gridNumber.value = params.Grid;
  });
  gui.add(params, 'WaveX').min(0).max(10).step(0.5).onChange(function(){
    ms_Water.material.uniforms.waveX.value = params.WaveX;
  });
  gui.add(params, 'WaveY').min(0).max(10).step(0.5).onChange(function(){
    ms_Water.material.uniforms.waveY.value = params.WaveY;
  });
  gui.add(params, 'RippleX').min(0).max(10).step(0.5).onChange(function(){
    ms_Water.material.uniforms.rippleX.value = params.RippleX;
  });
  gui.add(params, 'RippleY').min(0).max(10).step(0.5).onChange(function(){
    ms_Water.material.uniforms.rippleY.value = params.RippleY;
  });

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

