let acc = 0;

function wheelMatrix(tVec, rot){

    let matrixRot = glMatrix.mat4.fromRotation(glMatrix.mat4.create(), rot * 1.55, [1,0,0]);
    let matrixTran = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), tVec);
    let matrixWheel = glMatrix.mat4.fromRotation(glMatrix.mat4.create(), rot*1.5*acc, [0,1,0]);

    glMatrix.mat4.mul(matrixRot, matrixTran, matrixRot);
    return glMatrix.mat4.mul(matrixWheel, matrixRot, matrixWheel);
}

function carMatrix(){

    let matrixScale = glMatrix.mat4.fromScaling(glMatrix.mat4.create(),[1.2, 0.2, 0.5]);
    let matrixTran = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), [0,0.45,0]);
    let matrixRot = glMatrix.mat4.fromRotation(glMatrix.mat4.create(),1.55, [0,1,0]);
    glMatrix.mat4.mul(matrixTran,matrixRot,matrixTran);
    return glMatrix.mat4.mul(matrixTran,matrixTran,matrixScale);
}