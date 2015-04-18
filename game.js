(function() {
  var scene, game, camera, width, height, controls;
  var mouseDeltaX = 0, mouseDeltaY = 0;
  var running = false;

  function calcAspect() {
    return width/height;
  }

  function resize(newWidth, newHeight) {
    width = newWidth;
    height = newHeight;
    camera.aspect = calcAspect();
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function updateCameraOrientation() {
    camera.rotation.y -= mouseDeltaX*0.001;
    camera.rotation.y = camera.rotation.y % (Math.PI*2);
    camera.rotation.x -= mouseDeltaY*0.001;
    var limit = Math.PI*0.5*0.9;
    camera.rotation.x = Math.max(camera.rotation.x, -limit);
    camera.rotation.x = Math.min(camera.rotation.x, limit);
    mouseDeltaX = 0;
    mouseDeltaY = 0;
  }

  function updateCameraPosition() {

  }

  function updateCamera() {
    updateCameraOrientation();
    updateCameraPosition();
  }

  function update() {
    if(running) {
      updateCamera();
    }
    renderer.render(scene, camera);
  }

  function init(container, width, height) {
    var viewAngle = 45;
    var near = 0.1;
    var far = 10000;

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xffffff, 1);
    camera = new THREE.PerspectiveCamera(viewAngle, 1, near, far);
    camera.rotation.order = "YXZ";
    resize(width, height);
    scene = new THREE.Scene();

    scene.add(camera);

    camera.position.set(0, 20, 100);
    camera.up = new THREE.Vector3(0, 1, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    var wallMaterial = new THREE.MeshLambertMaterial({
      color: 0xcccccc,
      shading: THREE.FlatShading
    });

    var sphereMaterial = new THREE.MeshLambertMaterial({
      color: 0xcc0000,
      shading: THREE.FlatShading
    });

    // set up the sphere vars
    var radius = 5, segments = 14, rings = 6;

    // create a new mesh with sphere geometry -
    // we will cover the sphereMaterial next!
    var sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, rings),
      sphereMaterial
    );
    sphere.position.set(0, 5, -60);
    scene.add(sphere);

    var platformGeometry = new THREE.BoxGeometry(40, 100, 20);
    var platformA = new THREE.Mesh(
      platformGeometry,
      wallMaterial
    );
    platformA.position.set(0, -50, -60)
    scene.add(platformA);

    var platformB = new THREE.Mesh(
      platformGeometry,
      wallMaterial
    );
    platformB.position.set(0, -50, 60);
    scene.add(platformB);

    var pointLight = new THREE.PointLight( 0xFFFFFF );
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;

    scene.add(pointLight);

    container.appendChild(renderer.domElement);
  };

  function pause() {
    running = false;
  }

  function resume() {
    running = true;
  }

  function handleMouseMove(newDeltaX, newDeltaY) {
    if(running) {
      mouseDeltaX += newDeltaX;
      mouseDeltaY += newDeltaY;
    }
  }

  window.Game = {
    init: init,
    update: update,
    resize: resize,
    resume: resume,
    pause: pause,
    handleMouseMove: handleMouseMove
  };
})();
