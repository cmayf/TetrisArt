// Caleb Mayfield (CS 435) - Project 2
// This program generates a Tetris Art Game using WebGL

"use strict"

var canvas;
var gl;

var projection; // projection matrix uniform shader variable location
var transformation; // projection matrix uniform shader variable location
var vPosition;
// var vColor;
var fColor;

// state representation
var Blocks; // Blocks on screen
var BlockIdToBeMoved; // this black is moving
var MoveCount;
var OldX;
var OldY;

var nop = 8; // Number of blocks

var rotIndex = 5; // default
var rotDegrees = [ 1, 5, 10, 30, 45, 90];


window.onload = function initialize() {
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

  /*---------------------------------------------------------------------------------------------*/
  // Initialize events
  canvas.addEventListener("mousedown", function(event){
    console.log("MOUSE_DOWN");
    if (event.button!=0) return; // left button only
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    y=canvas.height-y;
    if (y > 500) {
      for (var i=nop; i>=0; i--) {	// search from last to first
        if (Blocks[i].isInside(x, y) && i <= 8) { 
          // increment nop
          nop += 1;
          Blocks.push(Blocks[i].duplicate()) 
        }
      }
    }
    if (event.shiftKey) {  // with shift key, rotate counter-clockwise
      for (var i=nop; i>=2; i--) {	// search from last to first
        if (Blocks[i].isInside(x, y)) {
          // move Blocks[i] to the top
          var temp=Blocks[i];
          for (var j=i; j<nop; j++) Blocks[j]=Blocks[j+1];
          Blocks[nop]=temp;
          // rotate the block
          Blocks[nop].UpdateAngle(rotDegrees[rotIndex]);
          // redraw
          window.requestAnimFrame(render);
          return;
        }
      }
      return;
    }
    if (event.altKey) { // with alternate key, rotate clockwise
      for (var i=nop; i>=2; i--) {	// search from last to first
        if (Blocks[i].isInside(x, y)) {
          // move Blocks[i] to the top
          var temp=Blocks[i];
          for (var j=i; j<nop; j++) Blocks[j]=Blocks[j+1];
          Blocks[nop]=temp;
          // rotate the block
          Blocks[nop].UpdateAngle(-rotDegrees[rotIndex]);
          // redraw
          window.requestAnimFrame(render);
          // render();
          return;
        }
      }
      return;
    }
    for (var i=nop; i>=2; i--) {	// search from last to first
      console.log(x+" "+y)
      if (Blocks[i].isInside(x, y)) {
        console.log("IS_INSIDE (x,y)");
        // move Blocks[i] to the top
        var temp=Blocks[i];
        for (var j=i; j<nop; j++) Blocks[j]=Blocks[j+1];
        Blocks[nop]=temp;
        // remember the one to be moved
        BlockIdToBeMoved=nop
        MoveCount=0;
        OldX=x;
        OldY=y;
        // redraw
        window.requestAnimFrame(render);
        // render();
        break;
      }
    }
  });

  canvas.addEventListener("mouseup", function(event){
    var y = event.pageY - canvas.offsetTop;
    y=canvas.height-y;
    //if ((y < 100 || y > 500) && nop > 8) { Blocks.pop(); nop -= 1; console.log(Blocks); } // -> if you want to remove when placed above top bar
    if (y < 100 && nop > 8) { Blocks.pop(); nop -= 1; console.log(Blocks); }  // -> if you want to remove only when placed below bottom bar


    if (BlockIdToBeMoved>=0) {
      BlockIdToBeMoved=-1;
    }
    window.requestAnimFrame(render);
  });

  canvas.addEventListener("mousemove", function(event){
    if (BlockIdToBeMoved>=0) {  // if dragging
      console.log("MOVING");
      var x = event.pageX - canvas.offsetLeft;
      var y = event.pageY - canvas.offsetTop;
      y=canvas.height-y;
      console.log(BlockIdToBeMoved);
      Blocks[BlockIdToBeMoved].UpdateOffset(x-OldX, y-OldY);
      MoveCount++;
      OldX=x;
      OldY=y;
      window.requestAnimFrame(render);
      // render();
    }
  });

/*---------------------------------------------------------------------------------------------*/

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Initial State
    Blocks=[];

    Blocks.push(new TPiece(2, vec4(0.0, 0.0, 0.0, 1.0), [vec2(0, 500), vec2(800, 500), vec2(0, 0), vec2(0, 0)]));
    Blocks.push(new TPiece(2, vec4(0.0, 0.0, 0.0, 1.0), [vec2(0, 100), vec2(800, 100), vec2(0, 0), vec2(0, 0)]));

    Blocks.push(new TPiece(4, vec4(1.0, 1.0, 0.0, 1.0), S()));
    Blocks.push(new TPiece(4, vec4(0.0, 1.0, 1.0, 1.0), R()));

    Blocks.push(new TPiece(12, vec4(1.0, 0.0, 1.0, 1.0), T()));
    Blocks.push(new TPiece(12, vec4(1.0, 0.5, 0.0, 1.0), L()));
    Blocks.push(new TPiece(12, vec4(0.0, 0.0, 1.0, 1.0), L2()));
    Blocks.push(new TPiece(12, vec4(0.0, 1.0, 0.0, 1.0), Z()));
    Blocks.push(new TPiece(12, vec4(1.0, 0.0, 0.0, 1.0), Z2()));

    for (var i=0; i<Blocks.length; i++) {
        Blocks[i].init();
    }

    BlockIdToBeMoved=-1; // no piece selected

    projection = gl.getUniformLocation( program, "projection" );
    var pm = ortho( 0.0, canvas.width, 0.0, canvas.height, -1.0, 1.0 );
    gl.uniformMatrix4fv( projection, gl.TRUE, flatten(pm) );

    transformation = gl.getUniformLocation( program, "transformation" );

    fColor = gl.getUniformLocation( program, "fColor" );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    // vColor = gl.getAttribLocation( program, "vColor" );

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i=0; i<Blocks.length; i++) {
        Blocks[i].draw();
    }
    // window.requestAnimFrame(render);
}

/*---------------------------------------------------------------------------------------------*/

function TPiece (n, color, vertices) {
  this.NumVertices = n;
  this.color = color;
  this.points=vertices;

  this.vBuffer=0;

  this.OffsetX=0;
  this.OffsetY=0;
  this.Angle=0;

  this.UpdateOffset = function(dx, dy) {
      this.OffsetX += dx;
      this.OffsetY += dy;
  }

  this.SetOffset = function(dx, dy) {
      this.OffsetX = dx;
      this.OffsetY = dy;
  }

  this.UpdateAngle = function(deg) {
      this.Angle += deg;
  }

  this.SetAngle = function(deg) {
      this.Angle = deg;
  }


  this.transform = function(x, y) {
      var theta = -Math.PI/180*this.Angle;	// in radians
      //var theta = .45;
      var x2 = this.points[0][0] + (x - this.points[0][0]-this.OffsetX) * Math.cos(theta) - (y - this.points[0][1]-this.OffsetY) * Math.sin(theta);
      var y2 = this.points[0][1] + (x - this.points[0][0]-this.OffsetX) * Math.sin(theta) + (y - this.points[0][1]-this.OffsetY) * Math.cos(theta);
      return vec2(x2, y2);
  }

  this.isInside = function(x, y) {
      var p=this.transform(x, y);
      for (var i = 0; i < this.NumVertices; i++) {
        if (!this.inside(p, this.points)) return false;
      }
      return true;
  }

  this.inside = function(point, vs) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    
    var x = point[0], y = point[1];
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};

  this.init = function() {
      this.vBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
  }

  this.duplicate = function() {
    var dup = new TPiece(this.NumVertices, this.color, this.points);
    dup.SetOffset(this.OffsetX, this.OffsetY);
    dup.SetAngle(this.Angle);
    dup.init();
    return dup;
}

  this.draw = function() {
      var tm=translate(this.points[0][0]+this.OffsetX, this.points[0][1]+this.OffsetY, 0.0);
      tm=mult(tm, rotate(this.Angle, vec3(0, 0, 1)));
      tm=mult(tm, translate(-this.points[0][0], -this.points[0][1], 0.0));
      gl.uniformMatrix4fv( transformation, gl.TRUE, flatten(tm) );

      // send the color as a uniform variable
      gl.uniform4fv( fColor, flatten(this.color) );

      gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
      gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vPosition );

      if (this.NumVertices==2) {
        gl.drawArrays( gl.LINES, 0, this.NumVertices );
      }
      else if (this.NumVertices==3) {
          gl.drawArrays( gl.TRIANGLES, 0, this.NumVertices );
      }
      else if (this.NumVertices==4) {
          gl.drawArrays( gl.TRIANGLE_FAN, 0, this.NumVertices );
      }
      else {
          gl.drawArrays( gl.TRIANGLE_STRIP, 0, this.NumVertices );
      }
  }

}

/*---------------------------------------------------------------------------------------------*/
// Tetraminos

function S() {
  // 100, 500, 100, 550, 50, 550, 50, 500
  var S = [
    vec2(100, 500),
    vec2(100, 550),
    vec2(50, 550),
    vec2(50, 500)
  ]
  return S;
}

function R() {
// 225, 500, 225, 525, 125, 525, 125, 500
  var R = [
    vec2(225, 500),
    vec2(225, 525),
    vec2(125, 525),
    vec2(125, 500)
  ]
  return R;
}


function T() {

    var T = [
      // bottom block
      vec2(250, 500),
      vec2(250, 525),
      vec2(325, 500),
      vec2(325, 525),
      vec2(250, 525),
      vec2(250, 500),

      // top block
      vec2(275, 525),
      vec2(300, 525),
      vec2(275, 550),
      vec2(300, 550),
      vec2(300, 525),
      vec2(275, 525),

    ];

    return T;
}

function L() {

  var L = [
    // bottom block
    vec2(350, 500),
    vec2(350, 525),
    vec2(425, 500),
    vec2(425, 525),
    vec2(350, 525),
    vec2(350, 500),

    // top block
    vec2(400, 525),
    vec2(425, 525),
    vec2(400, 550),
    vec2(425, 550),
    vec2(425, 525),
    vec2(400, 525),
  ];

  return L;
}

function L2() {

  var L = [
    // bottom block
    vec2(450, 500),
    vec2(450, 525),
    vec2(525, 500),
    vec2(525, 525),
    vec2(450, 525),
    vec2(450, 500),

    // top block
    vec2(450, 525),
    vec2(475, 525),
    vec2(450, 550),
    vec2(475, 550),
    vec2(475, 525),
    vec2(450, 525),
  ];

  return L;
}

function Z() {

  var Z = [
    // bottom block
    vec2(550, 500),
    vec2(550, 525),
    vec2(600, 500),
    vec2(600, 525),
    vec2(550, 525),
    vec2(575, 500),

    // top block
    vec2(575, 525),
    vec2(575, 550),
    vec2(625, 525),
    vec2(625, 550),
    vec2(575, 550),
    vec2(575, 525),
  ];

  return Z;
}

function Z2() {

  var Z = [
    // bottom block
    vec2(675, 500),
    vec2(675, 525),
    vec2(725, 500),
    vec2(725, 525),
    vec2(675, 525),
    vec2(675, 500),

    // top block
    vec2(700, 525),
    vec2(700, 550),
    vec2(650, 525),
    vec2(650, 550),
    vec2(700, 550),
    vec2(700, 525),
  ];

  return Z;
}