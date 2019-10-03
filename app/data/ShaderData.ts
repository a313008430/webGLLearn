export default class ShaderData {
    /** 顶点着色器 */
    static vertexShader2D: string = `
    // an attribute will receive data from a buffer
//   attribute vec4 a_position;

attribute vec2 a_position;
 
uniform vec2 u_resolution;

varying vec4 v_color;

attribute vec4 a_color;

  // all shaders have a main function
  void main() {

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    // gl_Position = a_position;

    // 从像素坐标转换到 0.0 到 1.0
    vec2 zeroToOne = a_position / u_resolution;
 
    // 再把 0->1 转换 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;
 
    // 把 0->2 转换到 -1->+1 (裁剪空间)
    vec2 clipSpace = zeroToTwo - 1.0;
 
    // gl_Position = vec4(clipSpace, 0, 1);
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

    v_color = a_color;

  }`;

    /** 片元着色器 */
    static fragmentShader2D: string = `
    precision mediump float;

    // uniform vec4 u_color;

    varying vec4 v_color;

    void main() {
    gl_FragColor = v_color;
    }`;
}