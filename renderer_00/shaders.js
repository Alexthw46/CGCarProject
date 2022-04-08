uniformShader = function (gl) {//line 1,Listing 2.14
  let vertexShaderSource = `
    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix;              
    attribute vec3 aPosition;                      
    void main(void)                                
    {                                              
      gl_Position = uProjectionMatrix *            
      uModelViewMatrix * vec4(aPosition, 1.0);     
    }                                              
  `;

  let fragmentShaderSource = `
    precision highp float;                         
    uniform vec4 uColor;                           
    void main(void)                                
    {                                              
      gl_FragColor = vec4(uColor);                 
    }                                             
  `;

  // create the vertex shader
  let vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  // create the fragment shader
  let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  // Create the shader program
  let aPositionIndex = 0;
  let aNormalIndex = 1;
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.bindAttribLocation(shaderProgram, aPositionIndex, "aPosition");
  gl.bindAttribLocation(shaderProgram, aNormalIndex, "aNormal")
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    let str = "Unable to initialize the shader program.\n\n";
    str += "VS:\n" + gl.getShaderInfoLog(vertexShader) + "\n\n";
    str += "FS:\n" + gl.getShaderInfoLog(fragmentShader) + "\n\n";
    str += "PROG:\n" + gl.getProgramInfoLog(shaderProgram);
    alert(str);
  }

  shaderProgram.aPositionIndex = aPositionIndex;
  shaderProgram.aNormalIndex = aNormalIndex;


  shaderProgram.uM  = gl.getUniformLocation(shaderProgram, "uM");

  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uTrackballMatrixLocation = gl.getUniformLocation(shaderProgram, "uTrackballMatrix");

  shaderProgram.uColorLocation            = gl.getUniformLocation(shaderProgram, "uColor");
  shaderProgram.uShadingModeLocation      = gl.getUniformLocation(shaderProgram, "uShadingMode");

  shaderProgram.uLightDirectionLocation  = gl.getUniformLocation(shaderProgram, "uLightDirection");

  return shaderProgram;
};