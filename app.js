(function() {
  var gameElm;
  var lockElement;
  var instructionsElm;
  var lastTimestamp;

  var keyCodeMap = {
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    65: 'a',
    66: 'b',
    67: 'c',
    68: 'd',
    69: 'e',
    70: 'f',
    71: 'g',
    72: 'h',
    73: 'i',
    74: 'j',
    75: 'k',
    76: 'l',
    77: 'm',
    78: 'n',
    79: 'o',
    80: 'p',
    81: 'q',
    82: 'r',
    83: 's',
    84: 't',
    85: 'u',
    86: 'v',
    87: 'w',
    88: 'x',
    89: 'y',
    90: 'z',
  };

  function update(timestamp) {
    var timeDelta = 0;
    if(lastTimestamp) {
      timeDelta = timestamp-lastTimestamp;
    }
    Game.update(timeDelta);
    requestAnimationFrame(update);
    lastTimestamp = timestamp;
  }

  function handlePointerLockChange() {
    if(document.pointerLockElement === lockElement) {
      instructionsElm.style.display = 'none';
      Game.resume();
    } else {
      instructionsElm.style.display = 'block';
      Game.pause();
    }
  }

  function handleResize() {
    Game.resize(window.innerWidth, window.innerHeight);
  }

  function handleMouseMove(event) {
    Game.handleMouseMove(event.movementX, event.movementY);
  }

  function handleKeyPress(event) {
    var key = keyCodeMap[event.keyCode];
    if(key) {
      Game.handleKeyPress(key);
    }
  }

  function handleMouseUp() {
    Game.handleMouseUp();
  }

  function handleMouseDown() {
    Game.handleMouseDown();
  }

  function handleKeyRelease(event) {
    var key = keyCodeMap[event.keyCode];
    if(key) {
      Game.handleKeyRelease(keyCodeMap[event.keyCode]);
    }
  }

  function init() {
    gameElm = document.querySelector('div.game');
    initedGame = false;
    lockElement = document.body;

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyRelease);

    Game.init(gameElm, window.innerWidth, window.innerHeight);

    instructionsElm = document.querySelector('div.lock_instructions');
    instructionsElm.addEventListener('click', function() {
      lockElement.requestPointerLock();
    });

    update();
  }

  /*
  function test() {
    var list = new ComponentList();

    var handles = [];

    var obj;
    for(var i=0; i<100; ++i) {
      obj = { key: i };

      if(Math.random() < 0.25 && handles.length != 0) {
        list.remove(handles.pop());
      } else {
        handle = list.add(obj);
        handles.push(handle);
        obj.x = handle;
      }

      for(var n=0; n<handles.length; ++n) {
        obj = list.get(n);
        if(obj.x != n) {
          throw new Error("CORRUPT");
        } else {
          console.log("OK");
        }
      }


    }

  }
  */

  window.App = {
    init: init
  };
})();
