(function () {
    'use strict';

    class Core {
    }

    class Utils {
        /**
         * 创建并编译一个着色器
         *
         * @param {!WebGLRenderingContext} gl WebGL上下文。
         * @param {string} shaderSource GLSL 格式的着色器代码
         * @param {number} shaderType 着色器类型, VERTEX_SHADER 或
         *     FRAGMENT_SHADER。
         * @return {!WebGLShader} 着色器。
         */
        static compileShader(gl, shaderSource, shaderType) {
            // 创建着色器程序
            var shader = gl.createShader(shaderType);
            // 设置着色器的源码
            gl.shaderSource(shader, shaderSource);
            // 编译着色器
            gl.compileShader(shader);
            // 检测编译是否成功
            var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!success) {
                // 编译过程出错，获取错误信息。
                throw "could not compile shader:" + gl.getShaderInfoLog(shader);
            }
            return shader;
        }
        /**
         * 从 2 个着色器中创建一个程序
         *
         * @param {!WebGLRenderingContext) gl WebGL上下文。
         * @param {!WebGLShader} vertexShader 一个顶点着色器。
         * @param {!WebGLShader} fragmentShader 一个片断着色器。
         * @return {!WebGLProgram} 程序
         */
        static createProgram(gl, vertexShader, fragmentShader) {
            // 创建一个程序
            var program = gl.createProgram();
            // 附上着色器
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            // 链接到程序
            gl.linkProgram(program);
            // 检查链接是否成功
            var success = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!success) {
                // 链接过程出现问题
                throw ("program filed to link:" + gl.getProgramInfoLog(program));
            }
            return program;
        }
        ;
        /**
         * Resize a canvas to match the size its displayed.
         * @param {HTMLCanvasElement} canvas The canvas to resize.
         * @param {number} [multiplier] amount to multiply by.
         *    Pass in window.devicePixelRatio for native pixels.
         * @return {boolean} true if the canvas was resized.
         * @memberOf module:webgl-utils
         */
        static resizeCanvasToDisplaySize(canvas, multiplier) {
            multiplier = multiplier || 1;
            const width = canvas.clientWidth * multiplier | 0;
            const height = canvas.clientHeight * multiplier | 0;
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                return true;
            }
            return false;
        }
    }

    class ShaderData {
    }
    /** 顶点着色器 */
    ShaderData.vertexShader2D = `
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
    ShaderData.fragmentShader2D = `
    precision mediump float;

    // uniform vec4 u_color;

    varying vec4 v_color;

    void main() {
    gl_FragColor = v_color;
    }`;

    /**
     * todo 本打算是创建二维的图然后用3d矩阵做旋转做透视的效果
     * 但是发现，如果想做3d透视效果，创建渲染程序 program的时候就必须要用3d矩阵来创建, 这样才可以使用透视效果，不然可能无法直接在2d创建的矩阵上面做修改
     */
    class Logic {
        /**
         * webgl 逻辑
         */
        constructor() {
            let gl = Core.gl;
            let program = Utils.createProgram(Core.gl, Utils.compileShader(Core.gl, ShaderData.vertexShader2D, Core.gl.VERTEX_SHADER), Utils.compileShader(Core.gl, ShaderData.fragmentShader2D, Core.gl.FRAGMENT_SHADER));
            let positionAttributeLocation = Core.gl.getAttribLocation(program, 'a_position');
            let resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
            // Create a buffer and put three 2d clip space points in it
            let positionBuffer = gl.createBuffer();
            // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            var positions = [
                10, 20,
                180, 20,
                10, 300,
                10, 300,
                180, 20,
                180, 300,
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            // code above this line is initialization code.
            // code below this line is rendering code.
            // Utils.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
            // Tell WebGL how to convert from clip space to pixels
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            // Clear the canvas
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            // Tell it to use our program (pair of shaders)
            gl.useProgram(program);
            // Turn on the attribute
            gl.enableVertexAttribArray(positionAttributeLocation);
            // Create a buffer for the colors.
            var colorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            // Set the colors.
            this.setColors(gl);
            var colorLocation = gl.getAttribLocation(program, "a_color");
            // Turn on the color attribute
            gl.enableVertexAttribArray(colorLocation);
            // Bind the color buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            // Tell the color attribute how to get data out of colorBuffer (ARRAY_BUFFER)
            var size = 4; // 4 components per iteration
            var type = gl.FLOAT; // the data is 32bit floats
            var normalize = false; // don't normalize the data
            var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
            var offset = 0; // start at the beginning of the buffer
            gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);
            // Bind the position buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            // var colorUniformLocation = gl.getUniformLocation(program, "u_color");
            // // Set a random color.
            // gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
            // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
            var size = 2; // 2 components per iteration
            var type = gl.FLOAT; // the data is 32bit floats
            var normalize = false; // don't normalize the data
            var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
            var offset = 0; // start at the beginning of the buffer
            gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
            // set the resolution
            gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
            // draw
            var primitiveType = gl.TRIANGLES;
            var offset = 0;
            //顶点数量
            var count = 6;
            gl.drawArrays(primitiveType, offset, count);
            let node = document.querySelector('#range'), drag = false, num = 0;
            node.addEventListener('mousedown', () => {
                drag = true;
            });
            node.addEventListener('mouseup', () => {
                drag = false;
            });
            node.addEventListener('mousemove', () => {
                if (drag) {
                    if ((num == 0 || num == 100) && num == Number(node.value)) {
                        return;
                    }
                    num = Number(node.value);
                }
            });
        }
        setColors(gl) {
            // Make every vertex a different color.
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                0, 0, 0, 1,
                1, 1, 0, 1,
                1, 0, 0, 1,
                1, 0, 0, 1,
                1, 1, 0, 1,
                0, 0, 0, 1
            ]), gl.STATIC_DRAW);
        }
    }

    class App {
        constructor() {
            Core.canvas = document.querySelector('canvas');
            let gl = Core.canvas.getContext("webgl2");
            if (!gl) {
                return;
            }
            Core.gl = gl;
            new Logic();
        }
    }
    new App();

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbImFwcC9jb3JlL0NvcmUudHMiLCJhcHAvY29yZS9VdGlscy50cyIsImFwcC9kYXRhL1NoYWRlckRhdGEudHMiLCJhcHAvbG9naWMvTG9naWMudHMiLCJhcHAvQXBwLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IGNsYXNzIENvcmUge1xyXG4gICAgLyoqIGNhbnZhc+agh+etvueUu+W4gyAqL1xyXG4gICAgc3RhdGljIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICAvKiogZ2wgKi9cclxuICAgIHN0YXRpYyBnbDpXZWJHTDJSZW5kZXJpbmdDb250ZXh0O1xyXG59IiwiZXhwb3J0IGRlZmF1bHQgY2xhc3MgVXRpbHMge1xyXG4gICAgLyoqXHJcbiAgICAgKiDliJvlu7rlubbnvJbor5HkuIDkuKrnnYDoibLlmahcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0geyFXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIFdlYkdM5LiK5LiL5paH44CCXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2hhZGVyU291cmNlIEdMU0wg5qC85byP55qE552A6Imy5Zmo5Luj56CBXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc2hhZGVyVHlwZSDnnYDoibLlmajnsbvlnossIFZFUlRFWF9TSEFERVIg5oiWXHJcbiAgICAgKiAgICAgRlJBR01FTlRfU0hBREVS44CCXHJcbiAgICAgKiBAcmV0dXJuIHshV2ViR0xTaGFkZXJ9IOedgOiJsuWZqOOAglxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgY29tcGlsZVNoYWRlcihnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0LCBzaGFkZXJTb3VyY2U6IHN0cmluZywgc2hhZGVyVHlwZTogbnVtYmVyKSB7XHJcbiAgICAgICAgLy8g5Yib5bu6552A6Imy5Zmo56iL5bqPXHJcbiAgICAgICAgdmFyIHNoYWRlcjogV2ViR0xTaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoc2hhZGVyVHlwZSkhO1xyXG5cclxuICAgICAgICAvLyDorr7nva7nnYDoibLlmajnmoTmupDnoIFcclxuICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzaGFkZXJTb3VyY2UpO1xyXG5cclxuICAgICAgICAvLyDnvJbor5HnnYDoibLlmahcclxuICAgICAgICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcblxyXG4gICAgICAgIC8vIOajgOa1i+e8luivkeaYr+WQpuaIkOWKn1xyXG4gICAgICAgIHZhciBzdWNjZXNzID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpO1xyXG4gICAgICAgIGlmICghc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAvLyDnvJbor5Hov4fnqIvlh7rplJnvvIzojrflj5bplJnor6/kv6Hmga/jgIJcclxuICAgICAgICAgICAgdGhyb3cgXCJjb3VsZCBub3QgY29tcGlsZSBzaGFkZXI6XCIgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2hhZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICog5LuOIDIg5Liq552A6Imy5Zmo5Lit5Yib5bu65LiA5Liq56iL5bqPXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHshV2ViR0xSZW5kZXJpbmdDb250ZXh0KSBnbCBXZWJHTOS4iuS4i+aWh+OAglxyXG4gICAgICogQHBhcmFtIHshV2ViR0xTaGFkZXJ9IHZlcnRleFNoYWRlciDkuIDkuKrpobbngrnnnYDoibLlmajjgIJcclxuICAgICAqIEBwYXJhbSB7IVdlYkdMU2hhZGVyfSBmcmFnbWVudFNoYWRlciDkuIDkuKrniYfmlq3nnYDoibLlmajjgIJcclxuICAgICAqIEByZXR1cm4geyFXZWJHTFByb2dyYW19IOeoi+W6j1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgY3JlYXRlUHJvZ3JhbShnbDogV2ViR0xSZW5kZXJpbmdDb250ZXh0LCB2ZXJ0ZXhTaGFkZXI6IFdlYkdMU2hhZGVyLCBmcmFnbWVudFNoYWRlcjogV2ViR0xTaGFkZXIpOiBXZWJHTFByb2dyYW0ge1xyXG4gICAgICAgIC8vIOWIm+W7uuS4gOS4queoi+W6j1xyXG4gICAgICAgIHZhciBwcm9ncmFtOiBXZWJHTFByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCkhO1xyXG5cclxuICAgICAgICAvLyDpmYTkuIrnnYDoibLlmahcclxuICAgICAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdmVydGV4U2hhZGVyKTtcclxuICAgICAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnJhZ21lbnRTaGFkZXIpO1xyXG5cclxuICAgICAgICAvLyDpk77mjqXliLDnqIvluo9cclxuICAgICAgICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcclxuXHJcbiAgICAgICAgLy8g5qOA5p+l6ZO+5o6l5piv5ZCm5oiQ5YqfXHJcbiAgICAgICAgdmFyIHN1Y2Nlc3MgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkxJTktfU1RBVFVTKTtcclxuICAgICAgICBpZiAoIXN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgLy8g6ZO+5o6l6L+H56iL5Ye6546w6Zeu6aKYXHJcbiAgICAgICAgICAgIHRocm93IChcInByb2dyYW0gZmlsZWQgdG8gbGluazpcIiArIGdsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9ncmFtO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc2l6ZSBhIGNhbnZhcyB0byBtYXRjaCB0aGUgc2l6ZSBpdHMgZGlzcGxheWVkLlxyXG4gICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudH0gY2FudmFzIFRoZSBjYW52YXMgdG8gcmVzaXplLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFttdWx0aXBsaWVyXSBhbW91bnQgdG8gbXVsdGlwbHkgYnkuXHJcbiAgICAgKiAgICBQYXNzIGluIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIGZvciBuYXRpdmUgcGl4ZWxzLlxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgY2FudmFzIHdhcyByZXNpemVkLlxyXG4gICAgICogQG1lbWJlck9mIG1vZHVsZTp3ZWJnbC11dGlsc1xyXG4gICAgICovXHJcbiAgICBzdGF0aWMgcmVzaXplQ2FudmFzVG9EaXNwbGF5U2l6ZShjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LCBtdWx0aXBsaWVyPzogbnVtYmVyKSB7XHJcbiAgICAgICAgbXVsdGlwbGllciA9IG11bHRpcGxpZXIgfHwgMTtcclxuICAgICAgICBjb25zdCB3aWR0aCA9IGNhbnZhcy5jbGllbnRXaWR0aCAqIG11bHRpcGxpZXIgfCAwO1xyXG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGNhbnZhcy5jbGllbnRIZWlnaHQgKiBtdWx0aXBsaWVyIHwgMDtcclxuICAgICAgICBpZiAoY2FudmFzLndpZHRoICE9PSB3aWR0aCB8fCBjYW52YXMuaGVpZ2h0ICE9PSBoZWlnaHQpIHtcclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBTaGFkZXJEYXRhIHtcclxuICAgIC8qKiDpobbngrnnnYDoibLlmaggKi9cclxuICAgIHN0YXRpYyB2ZXJ0ZXhTaGFkZXIyRDogc3RyaW5nID0gYFxyXG4gICAgLy8gYW4gYXR0cmlidXRlIHdpbGwgcmVjZWl2ZSBkYXRhIGZyb20gYSBidWZmZXJcclxuLy8gICBhdHRyaWJ1dGUgdmVjNCBhX3Bvc2l0aW9uO1xyXG5cclxuYXR0cmlidXRlIHZlYzIgYV9wb3NpdGlvbjtcclxuIFxyXG51bmlmb3JtIHZlYzIgdV9yZXNvbHV0aW9uO1xyXG5cclxudmFyeWluZyB2ZWM0IHZfY29sb3I7XHJcblxyXG5hdHRyaWJ1dGUgdmVjNCBhX2NvbG9yO1xyXG5cclxuICAvLyBhbGwgc2hhZGVycyBoYXZlIGEgbWFpbiBmdW5jdGlvblxyXG4gIHZvaWQgbWFpbigpIHtcclxuXHJcbiAgICAvLyBnbF9Qb3NpdGlvbiBpcyBhIHNwZWNpYWwgdmFyaWFibGUgYSB2ZXJ0ZXggc2hhZGVyXHJcbiAgICAvLyBpcyByZXNwb25zaWJsZSBmb3Igc2V0dGluZ1xyXG4gICAgLy8gZ2xfUG9zaXRpb24gPSBhX3Bvc2l0aW9uO1xyXG5cclxuICAgIC8vIOS7juWDj+e0oOWdkOagh+i9rOaNouWIsCAwLjAg5YiwIDEuMFxyXG4gICAgdmVjMiB6ZXJvVG9PbmUgPSBhX3Bvc2l0aW9uIC8gdV9yZXNvbHV0aW9uO1xyXG4gXHJcbiAgICAvLyDlho3mioogMC0+MSDovazmjaIgMC0+MlxyXG4gICAgdmVjMiB6ZXJvVG9Ud28gPSB6ZXJvVG9PbmUgKiAyLjA7XHJcbiBcclxuICAgIC8vIOaKiiAwLT4yIOi9rOaNouWIsCAtMS0+KzEgKOijgeWJquepuumXtClcclxuICAgIHZlYzIgY2xpcFNwYWNlID0gemVyb1RvVHdvIC0gMS4wO1xyXG4gXHJcbiAgICAvLyBnbF9Qb3NpdGlvbiA9IHZlYzQoY2xpcFNwYWNlLCAwLCAxKTtcclxuICAgIGdsX1Bvc2l0aW9uID0gdmVjNChjbGlwU3BhY2UgKiB2ZWMyKDEsIC0xKSwgMCwgMSk7XHJcblxyXG4gICAgdl9jb2xvciA9IGFfY29sb3I7XHJcblxyXG4gIH1gO1xyXG5cclxuICAgIC8qKiDniYflhYPnnYDoibLlmaggKi9cclxuICAgIHN0YXRpYyBmcmFnbWVudFNoYWRlcjJEOiBzdHJpbmcgPSBgXHJcbiAgICBwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcclxuXHJcbiAgICAvLyB1bmlmb3JtIHZlYzQgdV9jb2xvcjtcclxuXHJcbiAgICB2YXJ5aW5nIHZlYzQgdl9jb2xvcjtcclxuXHJcbiAgICB2b2lkIG1haW4oKSB7XHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2X2NvbG9yO1xyXG4gICAgfWA7XHJcbn0iLCJpbXBvcnQgQ29yZSBmcm9tIFwiLi4vY29yZS9Db3JlXCI7XHJcbmltcG9ydCBVdGlscyBmcm9tIFwiLi4vY29yZS9VdGlsc1wiO1xyXG5pbXBvcnQgU2hhZGVyRGF0YSBmcm9tIFwiLi4vZGF0YS9TaGFkZXJEYXRhXCI7XHJcblxyXG5cclxudmFyIG0zID0ge1xyXG4gICAgdHJhbnNsYXRpb246IGZ1bmN0aW9uICh0eDogbnVtYmVyLCB0eTogbnVtYmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgMSwgMCwgMCxcclxuICAgICAgICAgICAgMCwgMSwgMCxcclxuICAgICAgICAgICAgdHgsIHR5LCAxLFxyXG4gICAgICAgIF07XHJcbiAgICB9LFxyXG5cclxuICAgIHJvdGF0aW9uOiBmdW5jdGlvbiAoYW5nbGVJblJhZGlhbnM6IG51bWJlcikge1xyXG4gICAgICAgIHZhciBjID0gTWF0aC5jb3MoYW5nbGVJblJhZGlhbnMpO1xyXG4gICAgICAgIHZhciBzID0gTWF0aC5zaW4oYW5nbGVJblJhZGlhbnMpO1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIGMsIC1zLCAwLFxyXG4gICAgICAgICAgICBzLCBjLCAwLFxyXG4gICAgICAgICAgICAwLCAwLCAxLFxyXG4gICAgICAgIF07XHJcbiAgICB9LFxyXG5cclxuICAgIHNjYWxpbmc6IGZ1bmN0aW9uIChzeDogbnVtYmVyLCBzeTogbnVtYmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgc3gsIDAsIDAsXHJcbiAgICAgICAgICAgIDAsIHN5LCAwLFxyXG4gICAgICAgICAgICAwLCAwLCAxLFxyXG4gICAgICAgIF07XHJcbiAgICB9LFxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiB0b2RvIOacrOaJk+eul+aYr+WIm+W7uuS6jOe7tOeahOWbvueEtuWQjueUqDNk55+p6Zi15YGa5peL6L2s5YGa6YCP6KeG55qE5pWI5p6cXHJcbiAqIOS9huaYr+WPkeeOsO+8jOWmguaenOaDs+WBmjNk6YCP6KeG5pWI5p6c77yM5Yib5bu65riy5p+T56iL5bqPIHByb2dyYW3nmoTml7blgJnlsLHlv4XpobvopoHnlKgzZOefqemYteadpeWIm+W7uiwg6L+Z5qC35omN5Y+v5Lul5L2/55So6YCP6KeG5pWI5p6c77yM5LiN54S25Y+v6IO95peg5rOV55u05o6l5ZyoMmTliJvlu7rnmoTnn6npmLXkuIrpnaLlgZrkv67mlLlcclxuICovXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMb2dpYyB7XHJcbiAgICAvKipcclxuICAgICAqIHdlYmdsIOmAu+i+kVxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgbGV0IGdsID0gQ29yZS5nbDtcclxuXHJcbiAgICAgICAgbGV0IHByb2dyYW0gPSBVdGlscy5jcmVhdGVQcm9ncmFtKENvcmUuZ2wsIFV0aWxzLmNvbXBpbGVTaGFkZXIoQ29yZS5nbCwgU2hhZGVyRGF0YS52ZXJ0ZXhTaGFkZXIyRCwgQ29yZS5nbC5WRVJURVhfU0hBREVSKSwgVXRpbHMuY29tcGlsZVNoYWRlcihDb3JlLmdsLCBTaGFkZXJEYXRhLmZyYWdtZW50U2hhZGVyMkQsIENvcmUuZ2wuRlJBR01FTlRfU0hBREVSKSk7XHJcblxyXG4gICAgICAgIGxldCBwb3NpdGlvbkF0dHJpYnV0ZUxvY2F0aW9uID0gQ29yZS5nbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCAnYV9wb3NpdGlvbicpO1xyXG5cclxuICAgICAgICBsZXQgcmVzb2x1dGlvblVuaWZvcm1Mb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInVfcmVzb2x1dGlvblwiKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGEgYnVmZmVyIGFuZCBwdXQgdGhyZWUgMmQgY2xpcCBzcGFjZSBwb2ludHMgaW4gaXRcclxuICAgICAgICBsZXQgcG9zaXRpb25CdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICAgICAgLy8gQmluZCBpdCB0byBBUlJBWV9CVUZGRVIgKHRoaW5rIG9mIGl0IGFzIEFSUkFZX0JVRkZFUiA9IHBvc2l0aW9uQnVmZmVyKVxyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBwb3NpdGlvbkJ1ZmZlcik7XHJcblxyXG4gICAgICAgIHZhciBwb3NpdGlvbnMgPSBbXHJcbiAgICAgICAgICAgIDEwLCAyMCxcclxuICAgICAgICAgICAgMTgwLCAyMCxcclxuICAgICAgICAgICAgMTAsIDMwMCxcclxuXHJcbiAgICAgICAgICAgIDEwLCAzMDAsXHJcbiAgICAgICAgICAgIDE4MCwgMjAsXHJcbiAgICAgICAgICAgIDE4MCwgMzAwLFxyXG4gICAgICAgIF07XHJcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkocG9zaXRpb25zKSwgZ2wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgICAgICAvLyBjb2RlIGFib3ZlIHRoaXMgbGluZSBpcyBpbml0aWFsaXphdGlvbiBjb2RlLlxyXG4gICAgICAgIC8vIGNvZGUgYmVsb3cgdGhpcyBsaW5lIGlzIHJlbmRlcmluZyBjb2RlLlxyXG5cclxuICAgICAgICAvLyBVdGlscy5yZXNpemVDYW52YXNUb0Rpc3BsYXlTaXplKGdsLmNhbnZhcyBhcyBIVE1MQ2FudmFzRWxlbWVudCk7XHJcblxyXG4gICAgICAgIC8vIFRlbGwgV2ViR0wgaG93IHRvIGNvbnZlcnQgZnJvbSBjbGlwIHNwYWNlIHRvIHBpeGVsc1xyXG4gICAgICAgIGdsLnZpZXdwb3J0KDAsIDAsIGdsLmNhbnZhcy53aWR0aCwgZ2wuY2FudmFzLmhlaWdodCk7XHJcblxyXG4gICAgICAgIC8vIENsZWFyIHRoZSBjYW52YXNcclxuICAgICAgICBnbC5jbGVhckNvbG9yKDAsIDAsIDAsIDApO1xyXG4gICAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgICAgICAvLyBUZWxsIGl0IHRvIHVzZSBvdXIgcHJvZ3JhbSAocGFpciBvZiBzaGFkZXJzKVxyXG4gICAgICAgIGdsLnVzZVByb2dyYW0ocHJvZ3JhbSk7XHJcblxyXG4gICAgICAgIC8vIFR1cm4gb24gdGhlIGF0dHJpYnV0ZVxyXG4gICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHBvc2l0aW9uQXR0cmlidXRlTG9jYXRpb24pO1xyXG5cclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGEgYnVmZmVyIGZvciB0aGUgY29sb3JzLlxyXG4gICAgICAgIHZhciBjb2xvckJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBjb2xvckJ1ZmZlcik7XHJcbiAgICAgICAgLy8gU2V0IHRoZSBjb2xvcnMuXHJcbiAgICAgICAgdGhpcy5zZXRDb2xvcnMoZ2wpO1xyXG5cclxuICAgICAgICB2YXIgY29sb3JMb2NhdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9jb2xvclwiKTtcclxuXHJcbiAgICAgICAgLy8gVHVybiBvbiB0aGUgY29sb3IgYXR0cmlidXRlXHJcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoY29sb3JMb2NhdGlvbik7XHJcblxyXG4gICAgICAgIC8vIEJpbmQgdGhlIGNvbG9yIGJ1ZmZlci5cclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgY29sb3JCdWZmZXIpO1xyXG5cclxuXHJcblxyXG4gICAgICAgIC8vIFRlbGwgdGhlIGNvbG9yIGF0dHJpYnV0ZSBob3cgdG8gZ2V0IGRhdGEgb3V0IG9mIGNvbG9yQnVmZmVyIChBUlJBWV9CVUZGRVIpXHJcbiAgICAgICAgdmFyIHNpemUgPSA0OyAgICAgICAgICAvLyA0IGNvbXBvbmVudHMgcGVyIGl0ZXJhdGlvblxyXG4gICAgICAgIHZhciB0eXBlID0gZ2wuRkxPQVQ7ICAgLy8gdGhlIGRhdGEgaXMgMzJiaXQgZmxvYXRzXHJcbiAgICAgICAgdmFyIG5vcm1hbGl6ZSA9IGZhbHNlOyAvLyBkb24ndCBub3JtYWxpemUgdGhlIGRhdGFcclxuICAgICAgICB2YXIgc3RyaWRlID0gMDsgICAgICAgIC8vIDAgPSBtb3ZlIGZvcndhcmQgc2l6ZSAqIHNpemVvZih0eXBlKSBlYWNoIGl0ZXJhdGlvbiB0byBnZXQgdGhlIG5leHQgcG9zaXRpb25cclxuICAgICAgICB2YXIgb2Zmc2V0ID0gMDsgICAgICAgIC8vIHN0YXJ0IGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlclxyXG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoXHJcbiAgICAgICAgICAgIGNvbG9yTG9jYXRpb24sIHNpemUsIHR5cGUsIG5vcm1hbGl6ZSwgc3RyaWRlLCBvZmZzZXQpO1xyXG5cclxuICAgICAgICAvLyBCaW5kIHRoZSBwb3NpdGlvbiBidWZmZXIuXHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHBvc2l0aW9uQnVmZmVyKTtcclxuXHJcblxyXG4gICAgICAgIC8vIHZhciBjb2xvclVuaWZvcm1Mb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInVfY29sb3JcIik7XHJcbiAgICAgICAgLy8gLy8gU2V0IGEgcmFuZG9tIGNvbG9yLlxyXG4gICAgICAgIC8vIGdsLnVuaWZvcm00Zihjb2xvclVuaWZvcm1Mb2NhdGlvbiwgTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSwgMSk7XHJcblxyXG4gICAgICAgIC8vIFRlbGwgdGhlIGF0dHJpYnV0ZSBob3cgdG8gZ2V0IGRhdGEgb3V0IG9mIHBvc2l0aW9uQnVmZmVyIChBUlJBWV9CVUZGRVIpXHJcbiAgICAgICAgdmFyIHNpemUgPSAyOyAgICAgICAgICAvLyAyIGNvbXBvbmVudHMgcGVyIGl0ZXJhdGlvblxyXG4gICAgICAgIHZhciB0eXBlID0gZ2wuRkxPQVQ7ICAgLy8gdGhlIGRhdGEgaXMgMzJiaXQgZmxvYXRzXHJcbiAgICAgICAgdmFyIG5vcm1hbGl6ZSA9IGZhbHNlOyAvLyBkb24ndCBub3JtYWxpemUgdGhlIGRhdGFcclxuICAgICAgICB2YXIgc3RyaWRlID0gMDsgICAgICAgIC8vIDAgPSBtb3ZlIGZvcndhcmQgc2l6ZSAqIHNpemVvZih0eXBlKSBlYWNoIGl0ZXJhdGlvbiB0byBnZXQgdGhlIG5leHQgcG9zaXRpb25cclxuICAgICAgICB2YXIgb2Zmc2V0ID0gMDsgICAgICAgIC8vIHN0YXJ0IGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlclxyXG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoXHJcbiAgICAgICAgICAgIHBvc2l0aW9uQXR0cmlidXRlTG9jYXRpb24sIHNpemUsIHR5cGUsIG5vcm1hbGl6ZSwgc3RyaWRlLCBvZmZzZXQpO1xyXG5cclxuICAgICAgICAvLyBzZXQgdGhlIHJlc29sdXRpb25cclxuICAgICAgICBnbC51bmlmb3JtMmYocmVzb2x1dGlvblVuaWZvcm1Mb2NhdGlvbiwgZ2wuY2FudmFzLndpZHRoLCBnbC5jYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgLy8gZHJhd1xyXG4gICAgICAgIHZhciBwcmltaXRpdmVUeXBlID0gZ2wuVFJJQU5HTEVTO1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSAwO1xyXG4gICAgICAgIC8v6aG254K55pWw6YePXHJcbiAgICAgICAgdmFyIGNvdW50ID0gNjtcclxuICAgICAgICBnbC5kcmF3QXJyYXlzKHByaW1pdGl2ZVR5cGUsIG9mZnNldCwgY291bnQpO1xyXG5cclxuXHJcblxyXG4gICAgICAgIGxldCBub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3JhbmdlJykgYXMgSFRNTElucHV0RWxlbWVudCxcclxuICAgICAgICAgICAgZHJhZzogYm9vbGVhbiA9IGZhbHNlLFxyXG4gICAgICAgICAgICBudW06IG51bWJlciA9IDA7XHJcbiAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGRyYWcgPSB0cnVlO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsICgpID0+IHtcclxuICAgICAgICAgICAgZHJhZyA9IGZhbHNlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkcmFnKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKG51bSA9PSAwIHx8IG51bSA9PSAxMDApICYmIG51bSA9PSBOdW1iZXIobm9kZS52YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBudW0gPSBOdW1iZXIobm9kZS52YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXRDb2xvcnMoZ2w6IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQpIHtcclxuICAgICAgICAvLyBNYWtlIGV2ZXJ5IHZlcnRleCBhIGRpZmZlcmVudCBjb2xvci5cclxuICAgICAgICBnbC5idWZmZXJEYXRhKFxyXG4gICAgICAgICAgICBnbC5BUlJBWV9CVUZGRVIsXHJcbiAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgMCwgMCwgMCwgMSxcclxuICAgICAgICAgICAgICAgICAgICAxLCAxLCAwLCAxLFxyXG4gICAgICAgICAgICAgICAgICAgIDEsIDAsIDAsIDEsXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIDEsIDAsIDAsIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgMSwgMSwgMCwgMSxcclxuICAgICAgICAgICAgICAgICAgICAwLCAwLCAwLCAxXHJcbiAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IENvcmUgZnJvbSBcIi4vY29yZS9Db3JlXCI7XHJcbmltcG9ydCBMb2dpYyBmcm9tIFwiLi9sb2dpYy9Mb2dpY1wiO1xyXG5cclxuY2xhc3MgQXBwIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIENvcmUuY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignY2FudmFzJykhO1xyXG4gICAgICAgIGxldCBnbCA9IENvcmUuY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIik7XHJcbiAgICAgICAgaWYgKCFnbCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIENvcmUuZ2wgPSBnbDtcclxuXHJcbiAgICAgICAgbmV3IExvZ2ljKCk7XHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5uZXcgQXBwKCk7Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztVQUFxQixJQUFJO0tBS3hCOztVQ0xvQixLQUFLOzs7Ozs7Ozs7O1FBVXRCLE9BQU8sYUFBYSxDQUFDLEVBQXlCLEVBQUUsWUFBb0IsRUFBRSxVQUFrQjs7WUFFcEYsSUFBSSxNQUFNLEdBQWdCLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFFLENBQUM7O1lBR3ZELEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDOztZQUd0QyxFQUFFLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDOztZQUd6QixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsT0FBTyxFQUFFOztnQkFFVixNQUFNLDJCQUEyQixHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENB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
