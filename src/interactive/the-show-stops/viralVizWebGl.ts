import { mat4 } from "gl-matrix"
// Functions adapted from https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context

//
// Initialize a shader program, so WebGL knows how to draw our data
//
export const initShaderProgram = (
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
) => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

  // Create the shader program

  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    )
    return null
  }

  return shaderProgram
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
export const loadShader = (
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string
) => {
  const shader = gl.createShader(type)

  // Send the source to the shader object

  gl.shaderSource(shader, source)

  // Compile the shader program

  gl.compileShader(shader)

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
    )
    gl.deleteShader(shader)
    return null
  }

  return shader
}

export const drawScene = (
  gl: WebGLRenderingContext,
  programInfo: {
    attribLocations: {
      vertexColor: GLuint
      vertexPosition: number
    }
    program: WebGLProgram
    uniformLocations: {
      projectionMatrix: WebGLUniformLocation
      modelViewMatrix: WebGLUniformLocation
      globalColor: WebGLUniformLocation
    }
  },
  buffers: {
    positions: {
      color: number[]
      positions: number[]
    }[]
  }
) => {
  gl.clearColor(0.0, 0.0, 0.0, 0.0) // Clear to black, fully opaque
  gl.clearDepth(1.0) // Clear everything
  gl.enable(gl.DEPTH_TEST) // Enable depth testing
  gl.depthFunc(gl.LEQUAL) // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = (45 * Math.PI) / 180 // in radians
  let aspect
  if ("clientWidth" in gl.canvas) {
    aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
  }
  const zNear = 0.1
  const zFar = 100.0
  const projectionMatrix = mat4.create()

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create()

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to translate
    [-0.0, 0.0, -8.0]
  ) // amount to translate

  const numComponents = 2 // pull out 2 values per iteration
  const type = gl.FLOAT // the data in the buffer is 32bit floats
  const normalize = false // don't normalize
  const stride = 0 // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0 // how many bytes inside the buffer to start from

  for (const item of buffers.positions) {
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(item.positions),
      gl.STATIC_DRAW
    )

    {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset
      )
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
      gl.useProgram(programInfo.program)
    }

    gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    )
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix
    )

    gl.uniform4fv(programInfo.uniformLocations.globalColor, [...item.color, 1])

    {
      const offset = 0
      const vertexCount = 101
      gl.drawArrays(gl.TRIANGLE_FAN, offset, vertexCount)
    }
  }

  // const positionBuffer = gl.createBuffer()
  // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  // {
  //   const numComponents = 2 // pull out 2 values per iteration
  //   const type = gl.FLOAT // the data in the buffer is 32bit floats
  //   const normalize = false // don't normalize
  //   const stride = 0 // how many bytes to get from one set of values to the next
  //   // 0 = use type and numComponents above
  //   const offset = 0 // how many bytes inside the buffer to start from
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
  //   gl.vertexAttribPointer(
  //     programInfo.attribLocations.vertexPosition,
  //     numComponents,
  //     type,
  //     normalize,
  //     stride,
  //     offset,
  //   )
  //   gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
  // }

  // Tell WebGL to use our program when drawing

  // Set the shader uniforms

  // gl.uniform4fv(programInfo.uniformLocations.globalColor, [0.1, 0.7, 0.5, 1.0])
  //
  // {
  //   const offset = 0
  //   const vertexCount = 101
  //   gl.drawArrays(gl.TRIANGLE_FAN, offset, vertexCount)
  // }
}

export const initBuffers = (circles: any[], dimensionBounds: number[]) => {
  // Create a buffer for the square's positions.

  // const positionBuffer = gl.createBuffer()
  // const colorBuffer = gl.createBuffer()

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  // Now create an array of positions for the square.

  // const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0]
  const stops = 100
  const radius = 0.025

  const viewportWidth = dimensionBounds[2] - dimensionBounds[0]
  const viewportHeight = dimensionBounds[3] - dimensionBounds[1]
  const viewportStartX = dimensionBounds[0]
  const viewportStartY = dimensionBounds[1]

  let primitiveCircles = []

  for (const circle of circles) {
    const positions = [
      viewportStartX + (circle.x * viewportWidth),
      viewportStartY + (circle.y * viewportHeight),
    ]

    const color = [circle.color[0], circle.color[1], circle.color[2]]

    for (let i = 0; i < stops; i++) {
      positions.push(
        positions[0] + Math.cos((i * 2.1 * Math.PI) / stops) * radius
      ) // x coord
      positions.push(
        positions[1] + Math.sin((i * 2.1 * Math.PI) / stops) * radius
      ) // y coord
    }

    primitiveCircles.push({
      color,
      positions,
    })
  }

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  // const positionBuffer = gl.createBuffer()
  // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  // const colors = [
  //   1.0,
  //   1.0,
  //   1.0,
  //   1.0, // rgba color
  // ]

  // for (let i = 0; i <= 100; i++) {
  //     colors.push(1.0, 0.0, 0.0, 1.0) // even-numbered vertices
  // }
  // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

  return {
    positions: primitiveCircles,
    // color: colorBuffer,
  }
}
