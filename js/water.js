/**
 *
 * Work based on :
 * @author jbouny / https://github.com/jbouny
 * @author Slayvin / http://slayvin.net : Flat mirror for three.js
 * @author Stemkoski / http://www.adelphi.edu/~stemkoski : An implementation of water shader based on the flat mirror
 * @author Jonas Wagner / http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

THREE.ShaderLib['water'] = {

  uniforms: THREE.UniformsUtils.merge( [
    THREE.UniformsLib[ "fog" ], { 
      "envMap":    { type: "t", value: null },
      "alpha":            { type: "f", value: 1.0 },
      "u_time":             { type: "f", value: 0.0 },
      "distortionScale":  { type: "f", value: 20.0 },
      "noiseScale":       { type: "f", value: 1.0 },
      "envMapMatrix" :   { type: "m4", value: new THREE.Matrix4() },
      "sunColor":         { type: "c", value: new THREE.Color(0x7F7F7F) },
      "sunDirection":     { type: "v3", value: new THREE.Vector3(0.70707, 0.70707, 0) },
      "eye":              { type: "v3", value: new THREE.Vector3(0, 0, 0) },
      "waterColor":       { type: "c", value: new THREE.Color(0x555555) },
      "gridNumber" :   { type: "f", value: 0.0 },
      "waveX":         { type: "f", value: 0.0 },
      "waveY":     { type: "f", value: 0.0 },
      "rippleX":       { type: "f", value: 0.0 },
      "rippleY":       { type: "f", value: 0.0 }
    }
  ] ),

  vertexShader: [
      'uniform mat4 envMapMatrix;',

      'varying vec3 vNormal;',
      'varying vec2 uVu;',
      'varying vec3 modelPosition;',

      'varying vec3 surfaceX;',
      'varying vec3 surfaceY;',
      'varying vec3 surfaceZ;',
      'varying vec3 worldPosition;',
      'varying vec4 mirrorCoord;',

      'void main() {',

        'vNormal = normal;',
        'uVu = uv;',
        'modelPosition = position;',
        'worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;',
        'surfaceX = vec3( modelMatrix[0][0], modelMatrix[0][1], modelMatrix[0][2]);',
        'surfaceY = vec3( modelMatrix[1][0], modelMatrix[1][1], modelMatrix[1][2]);',
        'surfaceZ = vec3( modelMatrix[2][0], modelMatrix[2][1], modelMatrix[2][2]);',

        'mirrorCoord =  envMapMatrix * modelMatrix * vec4(position, 1.0);',

        'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}'
  ].join('\n'),

  fragmentShader: [    

    '#ifdef GL_ES',
    'precision mediump float;',
    '#endif',

    'uniform vec2 u_resolution;',
    'uniform vec2 u_mouse;',
    'uniform float u_time;',

    'uniform float baseSpeed;',
    'uniform float alpha;',
    'uniform float time;',
    'uniform float noiseScale;',
    'uniform float distortionScale;',
    'uniform vec3 eye;',
    'uniform vec3 sunDirection;',
    'uniform sampler2D envMap;',
    'uniform vec3 sunColor;',
    'uniform float gridNumber;',
    'uniform float waveX;',
    'uniform float waveY;',
    'uniform float rippleX;',
    'uniform float rippleY;',

    'varying vec2 uVu;',
    'varying vec3 vNormal;',
    'varying vec3 modelPosition;',
    'varying vec3 surfaceX;',
    'varying vec3 surfaceY;',
    'varying vec3 surfaceZ;',
    'varying vec3 worldPosition;',
    'varying vec4 mirrorCoord;',

    'vec3 random(vec3 st){',
    '    st = vec3( dot(st,vec3(192.9898,78.233, 235.124)),',
    '              dot(st,vec3(1212.9898,78.233, 1235.53)),',
    '            dot(st, vec3(12.42154, 53.124, 534.123)));',
    '    return -1.0 + 2.0*fract(sin(st)*43758.5453123);',
    '}',

    'float getNoise (in vec3 p) {',

    '    vec3 i = floor(p);',
    '    vec3 f = fract(p);',

    '    vec3 u = f * f * (3.0 - 2.0 * f);',
    '    return mix( mix(mix(dot(random( i + vec3(0,0,0)), f - vec3(0,0,0)),',
    '                        dot(random( i + vec3(1,0,0)), f - vec3(1,0,0)),',
    '                        u.x),',
    '                    mix(dot(random( i + vec3(0,1,0)), f - vec3(0,1,0)),',
    '                        dot(random( i + vec3(1,1,0)), f - vec3(1,1,0)),',
    '                        u.x),',
    '                u.y),',
    '                mix(mix(dot(random( i + vec3(0,0,1)), f - vec3(0,0,1)),',
    '                        dot(random( i + vec3(1,0,1)), f - vec3(1,0,1)),',
    '                        u.x),',
    '                    mix(dot(random( i + vec3(0,1,1)), f - vec3(0,1,1)),',
    '                        dot(random( i + vec3(1,1,1)), f - vec3(1,1,1)),',
    '                        u.x),',
    '                u.y),',
    '            u.z);',
    '}',

    'float fbm(vec3 st){',
    '  float result = 0.0;',
    '  const int octave = 4;',
    '  float frequency = 1.0;',

    '  float amplitude = 0.5;',
    '  float lacunarity = 1.5;',
    '  float gain = 0.5;',
    '  for (int i = 0 ; i < octave ; i++){',
    '    result += amplitude*getNoise(st);',
    '    st *= lacunarity;',
    '    amplitude *= gain;',
    '  }',
    '  float n = 1. - abs(result);',
    '  return n*n;',
    '}',


    'vec3 diffuseLight(float intensity, vec3 sunColor){',
    '  return vec3(max(dot(vNormal, normalize(sunDirection)), 0.0)*intensity)*sunColor;',
    '}',

    'vec3 specularLight(vec3 distortNormal, vec3 eyeDirection, float intensity, float radius, vec3 sunColor){',
    '  vec3 reflect = -normalize(reflect(-sunDirection, distortNormal));',
    '  float direction = max(0.0, dot(eyeDirection, reflect));',
    '  return vec3(pow(direction, radius)*intensity)*sunColor;',
    '}',



    'void main() {',
    'vec2 st = uVu.xy* gridNumber;',

    'vec3 noise = vec3(0.0);',

    'vec3 pos = vec3(st.x*rippleX, st.y*rippleY, u_time*0.4);',
    'noise = vec3(fbm(pos) + 1.0);',

    'vec3 wave_pos = vec3(st.x*waveX , st.y*waveY + (u_time/1.5), u_time*0.3);',
    'noise *= vec3(fbm(wave_pos)*1.5 + 0.5);',

    'vec3 distortCoord = noise.x * surfaceX + noise.y * surfaceY;',
    'vec3 distortNormal = distortCoord + surfaceZ;',

    'vec3 worldToEye = eye - worldPosition;',
    'vec3 eyeDirection = normalize(worldToEye);',

    'vec3 specular = vec3(0.0);',
    'vec3 diffuse = vec3(0.0);',
    'specular += specularLight(distortNormal, eyeDirection, 0.8, 20.0, sunColor);',
    'diffuse += diffuseLight(1.0, sunColor);',
    'noise *= (specular+diffuse);',

    'float distance = length(worldToEye);',
    'vec2 distortion = distortCoord.xy * distortionScale * sqrt(distance) * 0.07;',
    'vec3 mirrorDistord = mirrorCoord.xyz + vec3(distortion.x, distortion.y, 1.0);',
    'vec3 reflectionSample = texture2DProj(envMap, mirrorDistord).xyz;',

    'vec3 oceanBlue = vec3(0.109, 0.419, 0.627);',
    // 'oceanBlue = vec3(0.333, 0.4, 0.4);',
    'vec3 finalColor = oceanBlue * noise * 0.5;',



     'gl_FragColor = vec4( reflectionSample*finalColor, alpha);',


    '}'

  ].join('\n')

};

THREE.Water = function (renderer, camera, scene, options) {
  
  THREE.Object3D.call(this);
  this.name = 'water_' + this.id;

  function optionalParameter (value, defaultValue) {
    return value !== undefined ? value : defaultValue;
  };

  options = options || {};
  
  this.matrixNeedsUpdate = true;
  
  var width = optionalParameter(options.textureWidth, 512);
  var height = optionalParameter(options.textureHeight, 512);
  this.clipBias = optionalParameter(options.clipBias, -0.0001);
  this.alpha = optionalParameter(options.alpha, 1.0);
  this.time = optionalParameter(options.time, 0.0);
  this.normalSampler = optionalParameter(options.waterNormals, null);
  this.sunDirection = optionalParameter(options.sunDirection, new THREE.Vector3(0.70707, 0.70707, 0.0));
  this.sunColor = new THREE.Color(optionalParameter(options.sunColor, 0xffffff));
  this.waterColor = new THREE.Color(optionalParameter(options.waterColor, 0x7F7F7F));
  this.eye = optionalParameter(options.eye, new THREE.Vector3(0, 0, 0));
  this.distortionScale = optionalParameter(options.distortionScale, 20.0);
  this.noiseScale = optionalParameter(options.noiseScale, 1.0);
  this.side = optionalParameter(options.side, THREE.FrontSide);
  this.gridNumber = optionalParameter(options.gridNumber, 20.0);
  this.waveX = optionalParameter(options.waveX, 0.5);
  this.waveY = optionalParameter(options.waveY, 1.5);
  this.rippleX = optionalParameter(options.rippleX, 3.0);
  this.rippleY = optionalParameter(options.rippleY, 5.0);
  // this.fog = optionalParameter(options.fog, false);
  
  this.renderer = renderer;
  this.scene = scene;
  this.mirrorPlane = new THREE.Plane();
  this.normal = new THREE.Vector3(0, 0, 1);
  this.cameraWorldPosition = new THREE.Vector3();
  this.rotationMatrix = new THREE.Matrix4();
  this.lookAtPosition = new THREE.Vector3(0, 0, -1);
  this.clipPlane = new THREE.Vector4();
  
  if ( camera instanceof THREE.PerspectiveCamera ) {
    this.camera = camera;
  }
  else  {
    this.camera = new THREE.PerspectiveCamera();
    console.log(this.name + ': camera is not a Perspective Camera!')
  }

  this.textureMatrix = new THREE.Matrix4();

  this.mirrorCamera = this.camera.clone();
  
  this.texture = new THREE.WebGLRenderTarget(width, height);
  this.tempTexture = new THREE.WebGLRenderTarget(width, height);
  
  var mirrorShader = THREE.ShaderLib["water"];
  var mirrorUniforms = THREE.UniformsUtils.clone(mirrorShader.uniforms);

  this.material = new THREE.ShaderMaterial({ 
    fragmentShader: mirrorShader.fragmentShader, 
    vertexShader: mirrorShader.vertexShader, 
    uniforms: mirrorUniforms,
    transparent: true,
    side: this.side,
    // fog: this.fog
  });
  
  this.mesh = new THREE.Object3D();

  this.material.uniforms.envMap.value = this.texture;
  this.material.uniforms.envMapMatrix.value = this.textureMatrix;
  this.material.uniforms.alpha.value = this.alpha;
  this.material.uniforms.u_time.value = this.time;
  // this.material.uniforms.normalSampler.value = this.normalSampler;
  this.material.uniforms.sunColor.value = this.sunColor;
  this.material.uniforms.waterColor.value = this.waterColor;
  this.material.uniforms.sunDirection.value = this.sunDirection;
  this.material.uniforms.distortionScale.value = this.distortionScale;
  this.material.uniforms.noiseScale.value = this.noiseScale;
  this.material.uniforms.waveX.value = this.waveX;
  this.material.uniforms.waveY.value = this.waveY;
  this.material.uniforms.rippleX.value = this.rippleX;
  this.material.uniforms.rippleY.value = this.rippleY;
  this.material.uniforms.gridNumber.value = this.gridNumber;
  
  this.material.uniforms.eye.value = this.eye;
  
  if ( !THREE.Math.isPowerOfTwo(width) || !THREE.Math.isPowerOfTwo(height) ) {
    this.texture.generateMipmaps = false;
    this.tempTexture.generateMipmaps = false;
  }
};

THREE.Water.prototype = Object.create(THREE.Object3D.prototype);

THREE.Water.prototype.renderWithMirror = function (otherMirror) {

  // update the mirror matrix to mirror the current view
  this.updateTextureMatrix();
  this.matrixNeedsUpdate = false;

  // set the camera of the other mirror so the mirrored view is the reference view
  var tempCamera = otherMirror.camera;
  otherMirror.camera = this.mirrorCamera;

  // render the other mirror in temp texture
  otherMirror.render(true);

  // render the current mirror
  this.render();
  this.matrixNeedsUpdate = true;

  // restore material and camera of other mirror
  otherMirror.camera = tempCamera;

  // restore texture matrix of other mirror
  otherMirror.updateTextureMatrix();
};

THREE.Water.prototype.updateTextureMatrix = function () {
  if ( this.parent !== undefined ) {
    this.mesh = this.parent;
  }
  function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

  this.updateMatrixWorld();
  this.camera.updateMatrixWorld();

  this.cameraWorldPosition.setFromMatrixPosition(this.camera.matrixWorld);

  this.rotationMatrix.extractRotation(this.matrixWorld);

  this.normal = (new THREE.Vector3(0, 0, 1)).applyEuler(this.mesh.rotation);

  // calculate relative position of camera
  var cameraPosition = this.camera.position.clone().sub( this.mesh.position );
  if ( this.normal.dot(cameraPosition) < 0 ) {
    var meshNormal = (new THREE.Vector3(0, 0, 1)).applyEuler(this.mesh.rotation);
    this.normal.reflect(meshNormal);
  }

  // calculate view vector
  var view = this.mesh.position.clone().sub(this.cameraWorldPosition);
  view.reflect(this.normal).negate();
  view.add(this.mesh.position);

  this.rotationMatrix.extractRotation(this.camera.matrixWorld);

  this.lookAtPosition.set(0, 0, -1);
  this.lookAtPosition.applyMatrix4(this.rotationMatrix);
  this.lookAtPosition.add(this.cameraWorldPosition);

  var target = this.mesh.position.clone().sub(this.lookAtPosition);
  target.reflect(this.normal).negate();
  target.add(this.mesh.position);

  //this.up.set(0, 1, 0);
  this.up.set(0, -1, 0);
  this.up.applyMatrix4(this.rotationMatrix);
  this.up.reflect(this.normal).negate();

  this.mirrorCamera.position.copy(view);
  this.mirrorCamera.up = this.up;
  this.mirrorCamera.lookAt(target);
  this.mirrorCamera.aspect = this.camera.aspect;

  this.mirrorCamera.updateProjectionMatrix();
  this.mirrorCamera.updateMatrixWorld();
  this.mirrorCamera.matrixWorldInverse.getInverse(this.mirrorCamera.matrixWorld);

  // Update the texture matrix
  var scalingFactor = 0.5;
  var translatingFactor = 0.5;
  this.textureMatrix.set(scalingFactor, 0.0, 0.0, translatingFactor,
              0.0, scalingFactor, 0.0, translatingFactor,
              0.0, 0.0, scalingFactor, translatingFactor,
              0.0, 0.0, 0.0, 1.0);
  this.textureMatrix.multiply(this.mirrorCamera.projectionMatrix);
  this.textureMatrix.multiply(this.mirrorCamera.matrixWorldInverse);

  // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
  // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
  this.mirrorPlane.setFromNormalAndCoplanarPoint(this.normal, this.mesh.position);
  this.mirrorPlane.applyMatrix4(this.mirrorCamera.matrixWorldInverse);

  this.clipPlane.set(this.mirrorPlane.normal.x, this.mirrorPlane.normal.y, this.mirrorPlane.normal.z, this.mirrorPlane.constant);

  var q = new THREE.Vector4();
  var projectionMatrix = this.mirrorCamera.projectionMatrix;

  q.x = (sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
  q.y = (sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
  q.z = -1.0;
  q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

  // Calculate the scaled plane vector
  var c = new THREE.Vector4();
  c = this.clipPlane.multiplyScalar(2.0 / this.clipPlane.dot(q));

  // Replacing the third row of the projection matrix
  projectionMatrix.elements[2] = c.x;
  projectionMatrix.elements[6] = c.y;
  projectionMatrix.elements[10] = c.z + 1.0 - this.clipBias;
  projectionMatrix.elements[14] = c.w;
  
  var worldCoordinates = new THREE.Vector3();
  worldCoordinates.setFromMatrixPosition(this.camera.matrixWorld);
  this.eye = worldCoordinates;
  this.material.uniforms.eye.value = this.eye;
};

THREE.Water.prototype.render = function (isTempTexture) {

  if ( this.matrixNeedsUpdate ) {
    this.updateTextureMatrix();
  }

  this.matrixNeedsUpdate = true;

  // Render the mirrored view of the current scene into the target texture
  if ( this.scene !== undefined && this.scene instanceof THREE.Scene ) {
    // Remove the mirror texture from the scene the moment it is used as render texture
    // https://github.com/jbouny/ocean/issues/7 
    this.material.visible = false;
    
    var renderTexture = (isTempTexture !== undefined && isTempTexture)? this.tempTexture : this.texture;
    this.renderer.render(this.scene, this.mirrorCamera, renderTexture, true);
    
    this.material.visible = true;
    this.material.uniforms.envMap.value = renderTexture;
  }

};