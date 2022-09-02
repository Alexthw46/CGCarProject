// noinspection DuplicatedCode

DirLight = function(x,y,z){
  this.direction = [x,y,z];
}

//controllable spotlight
let spot = new DirLight(0,1,0);

/*
the FollowFromUpCamera always look at the car from a position above right over the car
*/

FollowFromUpCamera = function(){

  /* the only data it needs is the position of the camera */
  this.pos = [0,0,0];
  this.rotation = 0;
  /* update the camera with the current car position */
  this.update = function(car){
    this.pos = car.position;
    this.rotation = car.angle;
  }

  /* return the transformation matrix to transform from world coordinates to the view reference frame */
  this.matrix = function(){
    let LookMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(),[ this.pos[0], 50, this.pos[2]], this.pos,[0, 0, 1]);
    let RotMatrix = glMatrix.mat4.fromRotation(glMatrix.mat4.create(), 0.25*this.rotation, [0,0,1]);
    return glMatrix.mat4.mul(RotMatrix, RotMatrix, LookMatrix);
  }
}

FollowFromBehindCamera = function(){
  /* the only data it needs is the position of the camera */
  this.pos = [0,0,0];
  this.rotation = 0;
  this.frame = [0,0,0];
  /* update the camera with the current car position */
  this.update = function(car){
    this.pos = car.position;
    this.rotation = car.rotation;
    this.frame = car.frame.slice();
  }

  /* return the transformation matrix to transform from world coordinates to the view reference frame */
  this.matrix = function(){

    let CameraMatrix = glMatrix.vec3.transformMat4(glMatrix.mat4.create(), [0,1.2,5,1], this.frame);
    let EyeMatrix = glMatrix.vec3.transformMat4(glMatrix.mat4.create(),[0,0,0,1],this.frame);

  return glMatrix.mat4.lookAt(glMatrix.mat4.create(),CameraMatrix, EyeMatrix, [0,1,0]);
  }
}

FixedCamera = function () {
  this.update = function (car) {
    this.pos = car.position;
  }
  this.matrix = function(){
    return glMatrix.mat4.lookAt(glMatrix.mat4.create(), [this.pos[0] + 10, 10, this.pos[2] + 10], this.pos, [0, 1, 0]);
  }
}



let angle = 0.0;
let mode = 0; // 0 light, 1 trackball
let shadingMode = 0;
let ncams = 3;
/* the main object to be implemented */
let Renderer = {};

/* array of cameras that will be used */
Renderer.cameras = [];
Renderer.cameras.push(new FollowFromUpCamera());
Renderer.cameras.push(new FollowFromBehindCamera());
Renderer.cameras.push(new FixedCamera());
// set the camera currently in use
Renderer.currentCamera = 0;
Renderer.createObjectBuffers = function (gl, obj) {

  ComputeNormals(obj);

  obj.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  if(typeof obj.texCoords != 'undefined'){
    obj.texCoordsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.texCoords, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  if(typeof obj.tangents != 'undefined'){
    obj.tangentsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.tangentsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, obj.tangents, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  obj.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, obj.normals, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  obj.indexBufferTriangles = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, obj.triangleIndices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  // create edges
  let edges = new Uint16Array(obj.numTriangles * 3 * 2);
  for (let i = 0; i < obj.numTriangles; ++i) {
    edges[i * 6] = obj.triangleIndices[i * 3];
    edges[i * 6 + 1] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 2] = obj.triangleIndices[i * 3];
    edges[i * 6 + 3] = obj.triangleIndices[i * 3 + 2];
    edges[i * 6 + 4] = obj.triangleIndices[i * 3 + 1];
    edges[i * 6 + 5] = obj.triangleIndices[i * 3 + 2];
  }

  obj.indexBufferEdges = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

Renderer.drawObject = function (gl, obj, fillColor, lineColor) {

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.enableVertexAttribArray(this.uniformShader.aPositionIndex);
  gl.vertexAttribPointer(this.uniformShader.aPositionIndex, 3, gl.FLOAT, false, 0, 0);

  if (typeof obj.texCoords != 'undefined'){
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordsBuffer);
    gl.enableVertexAttribArray(this.uniformShader.aTextureCoordsIndex);
    gl.vertexAttribPointer(this.uniformShader.aTextureCoordsIndex, 2, gl.FLOAT, false, 0, 0);
  }

  if (typeof obj.tangentsBuffer != 'undefined'){
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.tangentsBuffer);
    gl.enableVertexAttribArray(this.uniformShader.aTangentsIndex);
    gl.vertexAttribPointer(this.uniformShader.aTangentsIndex, 3, gl.FLOAT, false, 0, 0);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
  gl.enableVertexAttribArray(this.uniformShader.aNormalIndex);
  gl.vertexAttribPointer(this.uniformShader.aNormalIndex, 3, gl.FLOAT, false, 0, 0);

  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 1.0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferTriangles);
  gl.uniform4fv(this.uniformShader.uColorLocation, fillColor);
  gl.drawElements(gl.TRIANGLES, obj.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

  gl.disable(gl.POLYGON_OFFSET_FILL);
  
  gl.uniform4fv(this.uniformShader.uColorLocation, lineColor);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBufferEdges);
  gl.drawElements(gl.LINES, obj.numTriangles * 3 * 2, gl.UNSIGNED_SHORT, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(this.uniformShader.aPositionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

Renderer.initializeObjects = function (gl) {
  Game.setScene(scene_0);
  this.car = Game.addCar("mycar");

  Renderer.triangle = new Triangle();
  Renderer.cube = new Cube();
  Renderer.cylinder = new Cylinder(20);

  Renderer.createObjectBuffers(gl, this.triangle);
  Renderer.createObjectBuffers(gl, this.cube);
  Renderer.createObjectBuffers(gl, this.cylinder);

  Renderer.createObjectBuffers(gl,Game.scene.trackObj);
  Renderer.createObjectBuffers(gl,Game.scene.groundObj);
  for (let i = 0; i < Game.scene.buildings.length; ++i)
	  	Renderer.createObjectBuffers(gl,Game.scene.buildingsObj[i]);
};

/*
draw the car
*/
Renderer.drawCar = function (gl,frame, car) {
  this.drawObject(gl, this.triangle, [1, 1, 1, 1], [1, 1, 1, 1]);

  let wheelColor = [0.1,0.1,0.1,1];
  let lineColor = [0.1,0.1,0.1,0.6];
  let shader = this.uniformShader.uModelViewMatrixLocation;

  //car hull
  frame.push();
  frame.multiply(carMatrix());
  gl.uniformMatrix4fv(shader,false, frame.matrix);
  this.drawObject(gl, this.cube, [0.5,0.6,0.7,1],lineColor);
  //scaling
  let lilMat = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[0,1.6,0]);
  glMatrix.mat4.mul(lilMat,lilMat,glMatrix.mat4.fromScaling(glMatrix.mat4.create(),[0.6,0.8,0.6]));
  frame.multiply(lilMat);
  //draw scaled hull
  gl.uniformMatrix4fv(shader,false, frame.matrix);
  this.drawObject(gl, this.cube, [0.5,0.6,0.7,1],lineColor);
  frame.pop();

  frame.push();
  //wheels

  if (car.speed > 0.01){
    acc = Math.max(0, acc += 0.1);
  }else if (car.speed < -0.01){
    acc = Math.min(0, acc -= 0.1);
  }else{
    acc *= 0.01;
  }

  frame.multiply(glMatrix.mat4.fromTranslation(glMatrix.mat4.create(),[0,0.3,0]));
  frame.multiply(glMatrix.mat4.fromScaling(glMatrix.mat4.create(),[0.15, 0.3, 0.3])); //scale size
  frame.multiply(glMatrix.mat4.fromRotation(glMatrix.mat4.create(),1.55,[0,1,0]));
  frame.push();
  frame.multiply(wheelMatrix([2,0,5],-1));
  gl.uniformMatrix4fv(shader,false, frame.matrix);
  this.drawObject(gl, this.cylinder, wheelColor,lineColor);
  frame.pop();

  frame.push();
  frame.multiply(wheelMatrix([2,0,-5],1));
  gl.uniformMatrix4fv(shader,false, frame.matrix);
  this.drawObject(gl, this.cylinder, wheelColor,lineColor);
  frame.pop();

  frame.push();
  frame.multiply(wheelMatrix([-2,0,5],-1));
  gl.uniformMatrix4fv(shader,false, frame.matrix);
  this.drawObject(gl, this.cylinder, wheelColor,lineColor);
  frame.pop();

  frame.push();
  frame.multiply(wheelMatrix([-2,0,-5],1));
  gl.uniformMatrix4fv(shader,false, frame.matrix);
  this.drawObject(gl, this.cylinder, wheelColor,lineColor);
  frame.pop();
  //
  frame.pop();
};

Renderer.drawScene = function (gl) {

  const width = this.canvas.width;
  const height = this.canvas.height;
  const ratio = width / height;
  const stack = new MatrixStack();
  gl.viewport(0, 0, width, height);
  
  gl.enable(gl.DEPTH_TEST);
  //gl.cullFace(gl.BACK);
  //gl.enable(gl.CULL_FACE);

  // Clear the framebuffer
  gl.clearColor(0.34, 0.5, 0.74, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  gl.useProgram(this.uniformShader);

  /* the shader will just output the base color if a null light direction is given */
  gl.uniform3fv(this.uniformShader.uLightDirectionLocation,[0,0,0]);

  gl.uniformMatrix4fv(this.uniformShader.uProjectionMatrixLocation,false,glMatrix.mat4.perspective(glMatrix.mat4.create(),3.14 / 4, ratio, 1, 500));

  gl.uniformMatrix4fv(this.uniformShader.uTrackballMatrixLocation,false,trackball_matrix);

  Renderer.cameras[Renderer.currentCamera].update(this.car);
  let invV = Renderer.cameras[Renderer.currentCamera].matrix();

  // initialize the stack with the identity
  stack.loadIdentity();

  gl.uniform3fv(this.uniformShader.uLightDirectionLocation, scene_0.weather.sunLightDirection);
  gl.uniform3fv(this.uniformShader.uSpotLightDirectionLocation, spot.direction);
  gl.uniform1i(this.uniformShader.uShadingModeLocation, shadingMode);

  // multiply by the view matrix
  stack.multiply(invV);
  stack.push();
  stack.multiply(trackball_matrix);

  gl.uniformMatrix4fv(this.uniformShader.uViewMatrixLocation,false, stack.matrix);

  stack.pop();
  // drawing the car
  stack.push();

  stack.multiply(this.car.frame);
  this.drawCar(gl, stack, this.car);

  stack.pop();

  gl.uniformMatrix4fv(this.uniformShader.uModelViewMatrixLocation, false, stack.matrix);

  // drawing the static elements (ground, track and buildings)
	this.drawObject(gl, Game.scene.groundObj, [0.3, 0.7, 0.2, 1.0], [0, 0, 0, 1.0]);
 	this.drawObject(gl, Game.scene.trackObj, [0.9, 0.8, 0.7, 1.0], [0, 0, 0, 1.0]);
	for (let i in Game.scene.buildingsObj)
		this.drawObject(gl, Game.scene.buildingsObj[i], [0.8, 0.8, 0.8, 1.0], [0.2, 0.2, 0.2, 1.0]);
	gl.useProgram(null);
};

Renderer.Display = function () {
  Renderer.drawScene(Renderer.gl);
  window.requestAnimationFrame(Renderer.Display) ;

};

Renderer.setupAndStart = function () {
 /* create the canvas */
  Renderer.canvas = document.getElementById("OUTPUT-CANVAS");
  
 /* get the webgl context */
  Renderer.gl = Renderer.canvas.getContext("webgl");
  Renderer.gl.getExtension('OES_standard_derivatives');

  /* create the matrix stack */
  Renderer.stack = new MatrixStack();

  /* initialize objects to be rendered */
  Renderer.initializeObjects(Renderer.gl);

  /* create the shader */
  Renderer.uniformShader = new uniformShader(Renderer.gl);

  /*
  add listeners for the mouse / keyboard events
  */
  Renderer.canvas.addEventListener('mousemove', on_mouseMove,false);
  Renderer.canvas.addEventListener('mousedown', on_mousedown,false);
  Renderer.canvas.addEventListener('mouseup', on_mouseup,false);
  Renderer.canvas.addEventListener('keydown', on_keydown,false);
  Renderer.canvas.addEventListener('keyup', on_keyup,false);
  Renderer.canvas.addEventListener('wheel', on_mouseWheel, false);
  Renderer.Display();

}

on_mousedown = function(e){

  startX = e.clientX;
  startY = e.clientY;

  if(mode === 1){
    const isOnSphere = point_on_sphere(startX, startY);
    if (isOnSphere[0]){
      rotating = true;
      start_point = isOnSphere[1];
    }
  }

}

on_mouseMove = function(e){

  if(mode === 1 && rotating){
    let res = point_on_sphere(e.clientX, e.clientY);
    if(res[0]){
      let p0 = start_point;
      let p1 = res[1];
      let p0c = glMatrix.vec3.create();
      let p1c = glMatrix.vec3.create();
      let rot_axis = glMatrix.vec3.create();
      let rot_angle = 0.0;
      glMatrix.vec3.sub(p0c,p0,trackball_center);
      glMatrix.vec3.sub(p1c,p1,trackball_center);
      glMatrix.vec3.cross(rot_axis,p0c,p1c);
      rot_angle = Math.asin( glMatrix.vec3.length(rot_axis) /(glMatrix.vec3.length(p0c)*glMatrix.vec3.length(p1c)));
      glMatrix.vec3.normalize(rot_axis,rot_axis);

      let rotMat = glMatrix.mat4.create();
      glMatrix.mat4.fromRotation(rotMat,rot_angle,rot_axis);
      glMatrix.mat4.mul(trackball_rotation, rotMat,trackball_rotation);
      glMatrix.mat4.mul(trackball_matrix, trackball_scaling,trackball_rotation);

      start_point = p1;

    }
  }

  startX =  e.clientX;
  startY =  e.clientY;
}

on_mouseup = function(){
  rotating = false;
}

on_keyup = function(e){
	Renderer.car.control_keys[e.key] = false;
}
on_keydown = function(e){
  if (e.key === " ") {
    trackball_matrix = glMatrix.mat4.create();
    trackball_rotation = glMatrix.mat4.create();
    trackball_scaling = glMatrix.mat4.create();
    Renderer.currentCamera = (Renderer.currentCamera + 1) % ncams;
  }else if (e.key === "l") {
    scene_0.weather.sunLightDirection = [scene_0.weather.sunLightDirection[0] + 10, scene_0.weather.sunLightDirection[1] , scene_0.weather.sunLightDirection[2] + 10];
  }else {
    Renderer.car.control_keys[e.key] = true;
  }
}

//TODO find the bug, weird behaviour
on_mouseWheel = function(e){
  if (mode === 1) {
    scaling_factor *= (1.0 + e.deltaY * 0.0008);
    glMatrix.mat4.fromScaling(trackball_scaling, [scaling_factor, scaling_factor, scaling_factor]);
    glMatrix.mat4.mul(trackball_matrix, trackball_scaling, trackball_rotation);
  }
}

update_mode = function(v){
  mode = parseInt(v);
}

update_shading = function(v){
  shadingMode = parseInt(v);
}

window.onload = Renderer.setupAndStart;