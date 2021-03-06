(function() {
  var scene, game, camera, width, height, controls;
  var mouseDeltaX = 0, mouseDeltaY = 0;
  var running = false;
  var mouseEvents = [];
  var player;
  var newtonTimeBank = 0;
  var gravity = new Vector3(0, -1, 0);
  var keysPressed = {};
  var newton = new Newton();
  var nextEntityID = 0;

  function Player() {
    this.id = nextEntityID++;
    this.bodyHandle = newton.createBody(new Vector3(0, 20, 60));
    newton.createSphereCollider(this.bodyHandle, 5);
    this.rotation = new Vector3(0, 0, -1);
    this.shootingID = Shooting.create(this);
  }

  Player.prototype = {
    getForce: function() {
      return this.getBody().force;
    },
    getVelocity: function() {
      return this.getBody().velocity;
    },
    applyForce: function(v) {
      this.getForce().add(v);
    },
    getPosition: function() {
      return this.getBody().position;
    },
    getBody: function() {
      return newton.getBody(this.bodyHandle);
    }
  }

  function resize(newWidth, newHeight) {
    Rendering.resize(newWidth, newHeight);
    width = newWidth;
    height = newHeight;
    camera.aspect = Rendering.calcAspect();
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function updatePlayerShooting() {
    mouseEvents.forEach(function(eventName) {
      if(eventName === "down") {
        Shooting.activate(player.shootingID);
      }
      else if(eventName === "up") {
        Shooting.deactivate(player.shootingID);
      }
    });
  }

  function updatePlayer(timeDelta) {
    updatePlayerRotation();
    updatePlayerForce(timeDelta);
    updatePlayerShooting();
  }

  function updatePlayerForce(timeDelta) {
    var rotation = player.rotation;
    var direction = new Vector3(
      Math.sin(rotation.y)*Math.cos(rotation.x)*-1,
      Math.sin(rotation.x),
      Math.cos(rotation.y)*Math.cos(rotation.x)*-1
    );
    var right = Vector3.cross(direction, new Vector3(0, 1, 0));

    var force = new Vector3(0, 0, 0);
    if(keysPressed.w) {
      force.add(direction);
    }
    if(keysPressed.s) {
      force.subtract(direction);
    }
    if(keysPressed.d) {
      force.add(right);
    }
    if(keysPressed.a) {
      force.subtract(right);
    }
    force.normalize();
    force.multiply(timeDelta*0.5);
    player.applyForce(force);

    var drag = Vector3.multiply(player.getVelocity(), -7);
    player.applyForce(drag);

    player.applyForce(Vector3.multiply(gravity, timeDelta*0.1));
  }

  function updatePlayerRotation() {
    player.rotation.y -= mouseDeltaX*0.001;
    player.rotation.y = player.rotation.y % (Math.PI*2);
    player.rotation.x -= mouseDeltaY*0.001;
    var limit = Math.PI*0.5*0.9;
    player.rotation.x = Math.max(player.rotation.x, -limit);
    player.rotation.x = Math.min(player.rotation.x, limit);
    mouseDeltaX = 0;
    mouseDeltaY = 0;
  }

  function updateCamera() {
    // todo: should interpolate
    camera.rotation.x = player.rotation.x;
    camera.rotation.y = player.rotation.y;

    var position = player.getPosition();
    camera.position.x = position.x;
    camera.position.y = position.y;
    camera.position.z = position.z;
  }

  function updatePhysics(timeDelta, newtonEvents) {
    var executed = false;
    newtonTimeBank += timeDelta;
    while(Newton.tickDuration < newtonTimeBank) {
      newton.tick(newtonEvents);
      newtonTimeBank -= timeDelta;
      executed = true;
    }
    return executed;
  }

  function update(timeDelta) {
    if(running) {
      var newtonEvents = [];
      updatePlayer(timeDelta);
      Gravity.update(timeDelta);
      if(updatePhysics(timeDelta, newtonEvents)) {
        Interpolation.reload();
        Bullets.tick(newtonEvents);
        newtonEvents.length = 0;
      }
      Bullets.update(timeDelta);
      Shooting.update(timeDelta);
      mouseEvents.length = 0;
    }
    updateCamera();
    Interpolation.update(newtonTimeBank/Newton.tickDuration);
    Explosions.update(timeDelta);
    RenderFeed.update();
    renderer.clear();
    renderer.render(scene, camera);
    HUDRendering.render(renderer);
  }

  function init(container, width, height) {
    var viewAngle = 45;
    var near = 0.1;
    var far = 10000;

    Entities.init(newton);
    Gravity.init(newton);
    Rendering.init();
    Interpolation.init(newton);

    player = new Player();

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMapEnabled = true;
    renderer.shadowMapType = THREE.PCFSoftShadowMap;
    renderer.autoClear = false;
    renderer.setClearColor(0xffffff, 1);
    camera = new THREE.PerspectiveCamera(viewAngle, 1, near, far);
    camera.rotation.order = "YXZ";
    scene = new THREE.Scene();
    Game.scene = scene; // hack

    scene.fog = new THREE.Fog(0xffffff, 20, 200);

    scene.add(camera);

    //camera.position.set(0, 20, 100);
    camera.up = new THREE.Vector3(0, 1, 0);
    //camera.lookAt(new THREE.Vector3(0, 0, 0));

    var wallMaterial = new THREE.MeshLambertMaterial({
      color: 0xbbbbbb,
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
    //var sphereBody = newton.createBody(new Vector3(sphere.position.x, sphere.position.y, sphere.position.z));
    //newton.createSphereCollider(sphereBody, radius*2);

    var platformGeometry = new THREE.BoxGeometry(40, 400, 40);
    var platformA = new THREE.Mesh(
      platformGeometry,
      wallMaterial
    );
    platformA.receiveShadow = true;
    platformA.position.set(0, -200, -60)
    scene.add(platformA);

    var platformABody = newton.createBody(new Vector3(0, -200, -60));
    newton.createBoxCollider(platformABody, new Vector3(40, 400, 40));


    var platformB = new THREE.Mesh(
      platformGeometry,
      wallMaterial
    );
    platformB.receiveShadow = true;
    platformB.position.set(0, -200, 60);
    scene.add(platformB);

    var platformBBody = newton.createBody(new Vector3(0, -200, 60));
    newton.createBoxCollider(platformBBody, new Vector3(40, 400, 40));


    var spotLight = new THREE.SpotLight(0xffffff, 1, 0, Math.PI/2, 1);
    spotLight.position.set(30, 200, 40);
    spotLight.target.position.set(0, 0, 0);
    spotLight.castShadow = true;

    spotLight.shadowCameraNear = 10;
    spotLight.shadowCameraFar = 1000;
    spotLight.shadowCameraFov = 50;

    scene.add(spotLight);

    var pointLight1 = new THREE.PointLight(0xffffff, 0.5);
    pointLight1.position.set(20, -20, 60);
    scene.add(pointLight1);

    var pointLight2 = new THREE.PointLight(0xffffff, 0.3);
    pointLight2.position.set(-40, -20, 60);
    scene.add(pointLight2);

    Bullets.init(newton);

    HUDRendering.init();

    Crosshair.setup();

    resize(width, height);

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

  function handleMouseDown() {
    mouseDown = true;
    mouseEvents.push('down');
  }

  function handleMouseUp() {
    mouseDown = false;
    mouseEvents.push('up');
  }

  function handleKeyPress(key) {
    keysPressed[key] = true;
  }

  function handleKeyRelease(key) {
    delete keysPressed[key];
  }

  window.Game = {
    init: init,
    update: update,
    resize: resize,
    resume: resume,
    pause: pause,
    handleMouseMove: handleMouseMove,
    handleKeyPress: handleKeyPress,
    handleKeyRelease: handleKeyRelease,
    handleMouseDown: handleMouseDown,
    handleMouseUp: handleMouseUp
  };
})();
