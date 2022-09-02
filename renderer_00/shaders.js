uniformShader = function (gl) {//line 1,Listing 2.14

  let vertexShaderSource = `
    uniform   mat4 uModelViewMatrix;               
    uniform   mat4 uProjectionMatrix;
    uniform   mat4 uTrackballMatrix;
    uniform   mat4 uViewMatrix;
    
    // light direction
    uniform vec3 uLightDirection;
    uniform vec3 uSpotLightDirection;
    uniform vec4 uColor;	
          
    attribute vec3 aPosition;
    attribute vec3 aNormal;

    // computed color to be interpolated 
    varying vec3 vShadedColor;
    
    // position to be interpolated
	varying vec3 vPosVS;
	 	
	// light direction view space
	varying vec3 vLVS;
    varying vec3 vSLVS;
    
    // view direction to be interpolated
	 varying vec3 vViewVS;
	 
    // view direction to be interpolated
	 varying vec3 vNVS;
    
           
    void main(void)                                
    {                         
      mat4 toViewSpace = uModelViewMatrix;
      // light direction in view space
      vec3 lightDirectionVS = normalize((uViewMatrix * vec4(uLightDirection,0.0))).xyz;
      
      vec3 normalVS = normalize(toViewSpace * vec4(aNormal,0.0)).xyz;
      vec3 V = -normalize((toViewSpace * vec4(aPosition, 1.0)).xyz);
      
      // cosine term
      float L_diffuse = max(dot(lightDirectionVS, normalVS),0.0);
      
      vec3 R = -lightDirectionVS + 2.0 * dot(lightDirectionVS,normalVS)*normalVS;
      vec3 k_spec = vec3(uColor.x * 2.0, uColor.y * 2.0, uColor.z);
      
      float specular = max(0.0,pow(dot(V,R),5.0));
      
      // use uColor as base diffuse and multiply for cosine term
      vShadedColor = uColor.xyz * L_diffuse + k_spec * specular;
      
      vPosVS = ( toViewSpace * vec4(aPosition, 1.0)).xyz;
      
      vSLVS = normalize((uViewMatrix * vec4(uSpotLightDirection,0.0))).xyz;
      vLVS = lightDirectionVS;
      vViewVS = normalize(-vPosVS);
      vNVS = normalVS;
      
      gl_Position = uProjectionMatrix * uTrackballMatrix * toViewSpace * vec4(aPosition, 1.0);
    }                                              
  `;

  let fragmentShaderSource = `
    #extension GL_OES_standard_derivatives : enable
    precision highp float;             
                
    uniform vec4 uColor; 
    varying vec3 vShadedColor;

    uniform int uShadingMode;  // 0: none, 1: flat, 1:goraud, 3: phong

    uniform vec3 uLightDirection;
    uniform vec3 uSpotLightDirection;
    varying vec3 vPosVS;
	varying vec3 vLVS;
	varying vec3 vSLVS;
	varying vec3 vViewVS;
	varying vec3 vNVS;    
    
                              
    void main(void){                          
    vec3 lightPosVS = vec3(0,10,0) + 2.0 * vSLVS;

    if (uShadingMode == 0){
        gl_FragColor = uColor;	
     }  
     else if (uShadingMode==1){
        vec3 N = normalize(cross(dFdx(vPosVS),dFdy(vPosVS)));
      	float L_diffuse = max(dot(vLVS,N),0.0);
      	
      	vec3 R = -vLVS + 2.0 * dot(vLVS,N) * N;
  		vec3 k_spec = vec3(uColor.x * 2.1, uColor.y * 2.1, uColor.z);
  		float specular = max(0.0,pow(dot(vViewVS,R), 5.0));
      	
        gl_FragColor = vec4(uColor.xyz * L_diffuse + k_spec * specular , 1.0);
        
     }else if (uShadingMode==3){
        vec3 N = vNVS;
        vec3 L = normalize(lightPosVS - vPosVS);      	
      	
      	float L_diffuse = max(0.0, dot(L,N));
      	 
        vec3 R = 2.0 * dot(L,N) * N - L;
        vec3 k_spec = vec3(uColor.x * 2.2, uColor.y * 2.2, uColor.z);
        float specular = max(0.0,pow(dot(vViewVS,R), 5.0));
        vec3 output_color = uColor.xyz * L_diffuse + k_spec * specular;
        float cosangle = dot(-L, -vSLVS);
        
        //mix the color with the sunlight
        if (cosangle > 0.99){
          gl_FragColor = vec4(output_color * 1.5, uColor.w);
        }else{
          gl_FragColor = vec4(output_color, uColor.w);
        }
     }
     else {
        gl_FragColor = vec4(vShadedColor,uColor.w);
	 }
	 
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
  let aTangentsIndex = 2;
  let aTextureCoordsIndex = 3;

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
  shaderProgram.aTangentsIndex = aTangentsIndex;
  shaderProgram.aTextureCoordsIndex = aTextureCoordsIndex;

  shaderProgram.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
  shaderProgram.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
  shaderProgram.uTrackballMatrixLocation = gl.getUniformLocation(shaderProgram, "uTrackballMatrix");
  shaderProgram.uViewMatrixLocation = gl.getUniformLocation(shaderProgram, "uViewMatrix");

  shaderProgram.uColorLocation = gl.getUniformLocation(shaderProgram, "uColor");

  shaderProgram.uShadingModeLocation = gl.getUniformLocation(shaderProgram, "uShadingMode");

  shaderProgram.uLightDirectionLocation  = gl.getUniformLocation(shaderProgram, "uLightDirection");
  shaderProgram.uSpotLightDirectionLocation  = gl.getUniformLocation(shaderProgram, "uSpotLightDirection");


  return shaderProgram;
};