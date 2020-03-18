import React from "react"
import viralVizStyles from "./viralViz.module.css"
import init, { Population } from "./the-show-stops-wasm/pkg"
import showStopsStyles from "./showStops.module.css"
import { drawScene, initBuffers, initShaderProgram } from "./viralVizWebGl"

export interface ViralVizState {
  lastTime: number
  lastDeltas: number[]
  startTimestamp: number
  population: Population
  animating: boolean
  opacity: number
  initialAnimation: boolean
}

export interface ViralVizProps {
  onToggle?: (animating: boolean) => void
}

const defaultPopulationSize = 1000

const deltaReloadThresholdCount = 10
const deltaReloadThresholdFrameLength = 60

const deltaReloadThresholdMinPopulationSize = defaultPopulationSize / 2 ** 4

class ViralViz extends React.Component<ViralVizProps, ViralVizState> {
  canvasRef: HTMLCanvasElement
  requestFrameFun: any
  lastPercentScrolled: number

  constructor(props: any) {
    super(props)
    this.handleResize = this.handleResize.bind(this)
    this.handleSpacebar = this.handleSpacebar.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.toggleAnimation = this.toggleAnimation.bind(this)
    this.updateAnimationState = this.updateAnimationState.bind(this)
    this.initPopulation = this.initPopulation.bind(this)
    this.state = {
      lastTime: 0,
      startTimestamp: -1,
      lastDeltas: [],
      population: null,
      animating: true,
      opacity: 1,
      initialAnimation: true,
    }
    this.init()
  }

  async init(): Promise<any> {
    // const wasm = await loadWasm()
    const wasmFileUrl = require("./the-show-stops-wasm/pkg/the_show_stops_wasm_bg.wasm")
    await init(wasmFileUrl)

    this.initPopulation()
  }

  initPopulation(populationSize = defaultPopulationSize) {
    const population = Population.new_with_size(populationSize)
    this.setState({
      population,
    })
  }

  adjustPopulation(populationSize = defaultPopulationSize) {
    const population = this.state.population.first_n(populationSize)
    this.setState({
      population,
    })
  }

  setCanvasRef = (ref: HTMLCanvasElement): void => {
    this.canvasRef = ref
    this.handleResize()
  }

  updateAnimationState(time: number) {
    let delta = this.state.lastTime == 0 ? 0 : time - this.state.lastTime

    if (delta > 1000) {
      // Handle sudden time jumps (like leaving the tab)
      delta = 0
    }

    let population = this.state.population
    if (population && this.state.animating) {
      if (
        this.state.population.individual_count >
        deltaReloadThresholdMinPopulationSize
      ) {
        while (this.state.lastDeltas.length > deltaReloadThresholdCount) {
          this.state.lastDeltas.pop()
        }

        // console.log(delta);
        // console.log(this.state.lastDeltas);
        // console.log(this.state.lastDeltas.length);

        if (this.state.lastDeltas.length == deltaReloadThresholdCount) {
          const average =
            this.state.lastDeltas.reduce((a, b) => a + b, 0) /
            this.state.lastDeltas.length

          // console.log(average);

          if (
            average > deltaReloadThresholdFrameLength &&
            this.state.population
          ) {
            this.setState({
              lastDeltas: [],
            })
            this.adjustPopulation(this.state.population.individual_count / 2)
          }
        }

        this.state.lastDeltas.unshift(delta)
      }

      population.tick(delta)

      // this.draw()
      this.drawGl()

      if (
        this.state.initialAnimation &&
        new Date().getTime() - this.state.startTimestamp > 3000
      ) {
        this.toggleAnimation()
      }
    }
    this.setState(prevState => ({
      lastTime: time,
    }))
    this.requestFrameFun = requestAnimationFrame(this.updateAnimationState)
  }

  draw() {
    if (
      !this.canvasRef ||
      !this.state.population ||
      this.state.opacity < 0.01
    ) {
      return
    }
    const canvas = this.canvasRef
    const context = canvas.getContext("2d")
    const radius = 3

    const width = document.body.clientWidth
    const height = window.innerHeight

    canvas.width = width
    canvas.height = height


    interface Point {
      x: number
      y: number
    }

    let uninfected: Point[] = []
    let incubating: Point[] = []
    let symptotic: Point[] = []
    let recovered: Point[] = []
    let dead: Point[] = []

    for (let i = 0; i < this.state.population.individual_count; i++) {
      const point = this.state.population.individual_at_index(i)

      const targetList = point.is_alive
        ? point.days_infected > 0
          ? point.days_infected > point.incubation_period
            ? point.days_infected > point.days_to_recover
              ? recovered
              : symptotic
            : incubating
          : uninfected
        : dead

      targetList.push({
        x: point.position.x * width,
        y: point.position.y * height,
      })
    }

    context.fillStyle = "#555555"
    for (const point of uninfected) {
      context.beginPath()
      context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false)
      context.fill()
    }

    context.fillStyle = "rgba(219,157,11,0.85)"
    for (const point of incubating) {
      context.beginPath()
      context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false)
      context.fill()
    }

    context.fillStyle = "rgba(219,46,11,0.87)"
    for (const point of symptotic) {
      context.beginPath()
      context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false)
      context.fill()
    }

    context.fillStyle = "green"
    for (const point of recovered) {
      context.beginPath()
      context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false)
      context.fill()
    }

    context.fillStyle = ""
    context.strokeStyle = "rgba(85,85,85,0.72)"
    context.lineWidth = 2
    for (const point of dead) {
      context.beginPath()
      context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false)
      context.stroke()
    }

    // if (point.is_alive) {
    //   context.fillStyle =
    //     point.days_infected > 0
    //       ? point.days_infected > point.incubation_period
    //       ? point.days_infected > point.days_to_recover
    //         ? "green"
    //         : "#DB2E0B"
    //       : "#DB9D0B"
    //       : "#555555"
    // } else {
    //   context.strokeStyle = "#555555"
    //   context.lineWidth = 2
    //   context.stroke()
    // }
    //
    // const pointX = canvas.width * point.position.x
    // const pointY = canvas.height * point.position.y
  }

  drawGl() {
    if (
      !this.canvasRef ||
      !this.state.population ||
      this.state.opacity < 0.01
    ) {
      return
    }

    const canvas = this.canvasRef
    const gl = canvas.getContext("webgl")

    const width = document.body.clientWidth
    const height = window.innerHeight

    canvas.width = width
    canvas.height = height

    // Vertex shader program

    const vsSource = `
    attribute vec4 aVertexPosition;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      // // vColor = aVertexColor;
      // float ambientStrength = 1.0;
      // vec4 ambient = ambientStrength * aVertexColor;
      //
      // vec4 result = ambient * aVertexColor;
      // vColor = result;
    }
  `

    // Fragment shader program

    const fsSource = `
    #ifdef GL_ES
      precision highp float;
    #endif
    uniform vec4 uGlobalColor; 
    
    void main(void) {
      gl_FragColor = uGlobalColor;
    }
  `
    // Only continue if WebGL is available and working
    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.")
      return
    }

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT)
    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource)

    // Collect all the info needed to use the shader program.
    // Look up which attribute our shader program is using
    // for aVertexPosition and look up uniform locations.
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
        globalColor: gl.getUniformLocation(shaderProgram, "uGlobalColor"),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      },
    }

    interface Point {
      x: number
      y: number
    }

    let uninfected: Point[] = []
    let incubating: Point[] = []
    let symptotic: Point[] = []
    let recovered: Point[] = []
    let dead: Point[] = []

    for (let i = 0; i < this.state.population.individual_count; i++) {
      const point = this.state.population.individual_at_index(i)

      const targetList = point.is_alive
        ? point.days_infected > 0
          ? point.days_infected > point.incubation_period
            ? point.days_infected > point.days_to_recover
              ? recovered
              : symptotic
            : incubating
          : uninfected
        : dead

      targetList.push({
        x: point.position.x,
        y: point.position.y,
      })
    }

    let sampleCircles: any[] = []

    sampleCircles.push(...uninfected.map((item) => {
      return {
        ...item,
        color: [85, 85, 85],
      }
    }))


    sampleCircles.push(...incubating.map((item) => {
      return {
        ...item,
        color: [219/255,157/255,11/255],
      }
    }))

    sampleCircles.push(...symptotic.map((item) => {
      return {
        ...item,
        color: [219/255,46/255,11/255],
      }
    }))

    sampleCircles.push(...recovered.map((item) => {
      return {
        ...item,
        color: [85/255, 85/255, 85/255],
      }
    }))

    sampleCircles.push(...dead.map((item) => {
      return {
        ...item,
        color: [0, 0, 0],
      }
    }))

    // let sampleCircles = [];

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(sampleCircles, [-1, -1, 1, 1])

    // Draw the scene
    drawScene(gl, programInfo, buffers)
  }

  handleResize() {
    if (!this.canvasRef) {
      return
    }
    const canvas = this.canvasRef
    canvas.width = document.body.clientWidth * devicePixelRatio
    canvas.height = window.innerHeight * devicePixelRatio
    this.drawGl()
  }

  handleScroll() {
    const percentScrolled = window.scrollY / window.innerHeight
    const opacity = 1 - percentScrolled * 15

    if (
      opacity < 0.01 &&
      this.state.animating &&
      this.lastPercentScrolled &&
      // Only handle opacity animation toggle if going down
      percentScrolled > this.lastPercentScrolled
    ) {
      this.toggleAnimation()
    }

    this.lastPercentScrolled = percentScrolled

    this.setState({
      opacity,
    })
  }

  toggleAnimation() {
    const animating = !this.state.animating
    if (!animating) {
      cancelAnimationFrame(this.requestFrameFun)
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
      this.requestFrameFun = requestAnimationFrame(this.updateAnimationState)
    }
    this.setState({
      animating: !this.state.animating,
      // Cancels initial animation if it is running
      initialAnimation: false,
      // Need to get rid of these
      lastDeltas: [],
      lastTime: 0,
    })

    if (this.props.onToggle) {
      this.props.onToggle(animating)
    }
  }

  handleSpacebar(event: KeyboardEvent): void {
    if (event.key == " ") {
      event.preventDefault()
      this.toggleAnimation()
    }
  }

  componentDidMount(): void {
    window.addEventListener("resize", this.handleResize)
    window.addEventListener("scroll", this.handleScroll)
    this.setState({
      startTimestamp: new Date().getTime(),
    })
    this.requestFrameFun = requestAnimationFrame(this.updateAnimationState)

    document.addEventListener("keypress", this.handleSpacebar)
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.handleResize)
    window.removeEventListener("scroll", this.handleScroll)
    this.setState({
      startTimestamp: new Date().getTime(),
    })
    cancelAnimationFrame(this.requestFrameFun)

    document.removeEventListener("keypress", this.handleSpacebar)
  }

  render() {
    let percentInfected = 0
    if (this.state.population) {
      percentInfected = Math.round(this.state.population.percent_infected * 100)
    }

    return (
      <div>
        <span
          className={
            !this.state.animating ? showStopsStyles.featureTitleOutline : ""
          }
          style={{
            cursor: "pointer",
            userSelect: "none",
            lineHeight: 0,
            marginBottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
          onClick={() => this.toggleAnimation()}
        >
          <i
            className={viralVizStyles.playPauseButton + " material-icons"}
            style={{
              // Slight adjustment to make play button line up with pause button
              zIndex: -1000,
              transform: !this.state.animating ? "translateX(-3px)" : "",
            }}
          >
            {this.state.animating ? "pause" : "play_arrow"}
          </i>
          <div
            style={{
              color: this.state.animating ? "#DB9D0B" : "white",
              lineHeight: 0,
              marginBottom: 0,
              opacity: this.state.opacity,
              textShadow: "0 0 20px #0b0231",
            }}
            className={viralVizStyles.percentIndicator}
          >
            {percentInfected}%
          </div>
        </span>

        <div className={viralVizStyles.viralVizContainer}>
          <canvas
            ref={this.setCanvasRef}
            style={{
              width: "100vw",
              height: "100vh",
              transition: "opacity ease-out 200ms",
              opacity: 1,
              // 0.6 * this.state.opacity * (this.state.animating ? 1 : 0.5),
              zIndex: 100000000,
              verticalAlign: "bottom",
            }}
          />
        </div>
      </div>
    )
  }
}

export default ViralViz
