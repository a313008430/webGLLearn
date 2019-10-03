export default class Utils {
    /**
     * 创建并编译一个着色器
     *
     * @param {!WebGLRenderingContext} gl WebGL上下文。
     * @param {string} shaderSource GLSL 格式的着色器代码
     * @param {number} shaderType 着色器类型, VERTEX_SHADER 或
     *     FRAGMENT_SHADER。
     * @return {!WebGLShader} 着色器。
     */
    static compileShader(gl: WebGLRenderingContext, shaderSource: string, shaderType: number) {
        // 创建着色器程序
        var shader: WebGLShader = gl.createShader(shaderType)!;

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
    static createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
        // 创建一个程序
        var program: WebGLProgram = gl.createProgram()!;

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
    };

    /**
     * Resize a canvas to match the size its displayed.
     * @param {HTMLCanvasElement} canvas The canvas to resize.
     * @param {number} [multiplier] amount to multiply by.
     *    Pass in window.devicePixelRatio for native pixels.
     * @return {boolean} true if the canvas was resized.
     * @memberOf module:webgl-utils
     */
    static resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier?: number) {
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