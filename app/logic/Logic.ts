import Core from "../core/Core";
import Utils from "../core/Utils";
import ShaderData from "../data/ShaderData";


var m3 = {
    translation: function (tx: number, ty: number) {
        return [
            1, 0, 0,
            0, 1, 0,
            tx, ty, 1,
        ];
    },

    rotation: function (angleInRadians: number) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
            c, -s, 0,
            s, c, 0,
            0, 0, 1,
        ];
    },

    scaling: function (sx: number, sy: number) {
        return [
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1,
        ];
    },
};


/**
 * todo 本打算是创建二维的图然后用3d矩阵做旋转做透视的效果
 * 但是发现，如果想做3d透视效果，创建渲染程序 program的时候就必须要用3d矩阵来创建, 这样才可以使用透视效果，不然可能无法直接在2d创建的矩阵上面做修改
 */

export default class Logic {
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
        var size = 4;          // 4 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            colorLocation, size, type, normalize, stride, offset);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


        // var colorUniformLocation = gl.getUniformLocation(program, "u_color");
        // // Set a random color.
        // gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset);

        // set the resolution
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

        // draw
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        //顶点数量
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);



        let node = document.querySelector('#range') as HTMLInputElement,
            drag: boolean = false,
            num: number = 0;
        node.addEventListener('mousedown', () => {
            drag = true;
        })

        node.addEventListener('mouseup', () => {
            drag = false;
        })
        node.addEventListener('mousemove', () => {
            if (drag) {
                if ((num == 0 || num == 100) && num == Number(node.value)) {
                    return;
                }
                num = Number(node.value);
            }
        })

    }

    setColors(gl: WebGL2RenderingContext) {
        // Make every vertex a different color.
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(
                [
                    0, 0, 0, 1,
                    1, 1, 0, 1,
                    1, 0, 0, 1,

                    1, 0, 0, 1,
                    1, 1, 0, 1,
                    0, 0, 0, 1
                ]),
            gl.STATIC_DRAW);
    }
}