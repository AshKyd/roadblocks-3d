var THREE = require('three');
THREE.TrackballControls = require('three.trackball');

// a bunch of sprites
var sprites = require('./data/sprites');

var levels = require('./data/levels');

var scene = new THREE.Scene();

// arbitrary modifier (convert decimal to actual size)
var tileSize = 10;

// Set up renderer
var renderer = new THREE.WebGLRenderer({
  antialias: true,
  shadowMapEnabled: true,
});
renderer.shadowMapEnabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add some ambience
var light = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 1);
scene.add(light);

var sunlight = new THREE.DirectionalLight();
sunlight.position.set(100, 250, 100);
sunlight.intensity = .2;
sunlight.shadowDarkness = .1;
sunlight.castShadow = true;
// sunlight.shadowCameraNear = 250;
// sunlight.shadowCameraFar = 600;
// sunlight.shadowCameraLeft = -200;
// sunlight.shadowCameraRight = 200;
// sunlight.shadowCameraTop = 200;
// sunlight.shadowCameraBottom = -200;
sunlight.shadowMapWidth = sunlight.shadowMapHeight = 1024;
renderer.shadowMapType = THREE.PCFSoftShadowMap;
scene.add(sunlight);


// Isometric camera nicked from here
// http://stackoverflow.com/questions/23450588/isometric-camera-with-three-js
// var aspect = window.innerWidth / window.innerHeight;
// var d = 40;
// var camera = new THREE.OrthographicCamera(
//   - d * aspect,
//   d * aspect,
//   d,
//   - d,
//   1,
//   1000
// );
// camera.position.set( 200, 200, 200 );
// camera.lookAt( scene.position );


//  Add a non-isometric camera to test with.
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 100;
camera.position.x = 100;
camera.position.y = 100;

// Set up mouse controls.
var controls = new THREE.TrackballControls(camera, renderer.domElement);

window.onscroll = function(e){
    console.log(e);
};


// A sprite is a collection of boxes.
function Sprite(sprite) {
  var _this = this;
  _this.cubes = [];

  function constructCube(box, offset){
    // My existing coordinate system starts from 0,0,0 whereas Three starts
    // from the center of the object. This code adjusts for that.
    var x = box[1] + box[3] / 2 + offset[2];
    var y = box[0] + box[5] / 2 + offset[0];
    var z = box[2] + box[4] / 2 + offset[1];

    // create the box
    var geometry = new THREE.BoxGeometry(
      box[3] * tileSize, // width
      box[5] * tileSize, // height
      box[4] * tileSize // depth
    );
    var material = new THREE.MeshLambertMaterial({
      color: box[6]
    });
    var cube = new THREE.Mesh(geometry, material);

    // position the box
    cube.position.y = y * tileSize;
    cube.position.x = x * tileSize;
    cube.position.z = z * tileSize;

    if(box[7]){
        material.opacity = box[7];
        material.transparent = true;
    } else {
        cube.castShadow = true;
        cube.receiveShadow = true;
    }

    // Add it to the scene and save it for later.
    scene.add(cube);
    _this.cubes.push(cube);
  }

  // create each box.
  sprite.forEach(function(box) {
      // If this is a sub-sprite, pull in the desired sprite pieces.
      if(box.length == 4){
          var offset = box.slice(1);
          box = sprites.sprites[box[0]];
          if(typeof box === 'function'){
              box = box();
          }
          box.forEach(function(thisBox){
              constructCube(thisBox, offset);
          });
      } else {
          constructCube(box, [0, 0, 0]);
      }
  });
}

// We can move a box by translating it from it's current location
Sprite.prototype.move = function(x, y, z) {
  this.cubes.forEach(function(cube) {
    cube.position.y += y * tileSize;
    cube.position.x += x * tileSize;
    cube.position.z += z * tileSize;
  });
};

// Add roads to the world
var sprite = new Sprite(sprites.sprites.grass);
sprite.move(0, 0, 1);


function crawlMap(map, w, h, fn){
    var returnVal, x, y;
    for(x=0; x<w; x++){
        if(!map[x]){
            map[x] = [];
        }
        for(y=0; y<h; y++){
            returnVal = fn(x, y, map[x][y]);
            if(returnVal){
                map[x][y] = returnVal;
            }
        }
    }
    return map;
}

function setupLevel(level){
    var map = crawlMap([], level.w, level.h, function(){
        return level.base;
    });
    level.predef.forEach(function(thisTile){
        map[thisTile[0]][thisTile[1]] = thisTile[2];
    });
    crawlMap(map, level.w, level.h, function(x, z, sprite){
        var thisSprite = new Sprite(sprites.sprites[sprite]);
        thisSprite.move(x, 0, z);
    });
}
setupLevel(levels.Puzzle[8]);


// Start rendering.
function render() {
  renderer.render(scene, camera);
  requestAnimationFrame(render);
  controls.update();
}

render();
