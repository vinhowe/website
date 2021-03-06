import React from "react"
import viralVizStyles from "./viralViz.module.css"
import init, { IndividualState, Population } from "./the-show-stops-wasm/pkg"
import showStopsStyles from "./showStops.module.css"

export interface ViralVizState {
  startTimestamp: number
  population: Population
  animating: boolean
  opacity: number
  initialAnimation: boolean
}

export interface ViralVizProps {
  onToggle?: (animating: boolean) => void
}

interface DrawIndividual {
  position: {
    x: number
    y: number
  }
  state: IndividualState
}

interface IndividualDrawStyle {
  fill?: string
  stroke?: string
}

const stateStyleMap: IndividualDrawStyle[] = []
stateStyleMap[IndividualState.Dead] = { stroke: "#555555" }
stateStyleMap[IndividualState.Uninfected] = { fill: "#555555" }
stateStyleMap[IndividualState.Incubating] = { fill: "#DB9D0B" }
stateStyleMap[IndividualState.Symptomatic] = { fill: "#DB2E0B" }
stateStyleMap[IndividualState.Recovered] = { fill: "#00EE00" }

const defaultPopulationSize = 1000

const deltaReloadThresholdCount = 100
// 16ms frame length is 60 FPS so 20ms is slightly below that at 50fps
const deltaReloadThresholdFrameLength = 20

const deltaReloadThresholdMinPopulationSize = defaultPopulationSize / 2 ** 8

class ViralViz extends React.Component<ViralVizProps, ViralVizState> {
  canvasRef: HTMLCanvasElement
  canvasContext: CanvasRenderingContext2D
  requestFrameFun: any
  lastPercentScrolled: number
  lastTime: number
  lastStateUpdateTime: number
  lastDeltas: number[]
  canvasWidth: number
  canvasHeight: number

  constructor(props: any) {
    super(props)
    this.handleResize = this.handleResize.bind(this)
    this.handleSpacebar = this.handleSpacebar.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    this.toggleAnimation = this.toggleAnimation.bind(this)
    this.updateAnimationState = this.updateAnimationState.bind(this)
    this.initPopulation = this.initPopulation.bind(this)

    this.lastTime = 0
    this.lastStateUpdateTime = 0
    this.lastDeltas = []
    this.canvasWidth = 0
    this.canvasHeight = 0
    this.state = {
      startTimestamp: -1,
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
    let delta = this.lastTime == 0 ? 0 : time - this.lastTime
    let lastStateUpdateDelta =
      this.lastStateUpdateTime == 0 ? 1000 : time - this.lastStateUpdateTime

    if (delta > 1000) {
      // Handle sudden time jumps (like leaving the tab)
      delta = 0
    }

    let population = this.state.population
    if (population && this.state.animating) {
      if (this.state.population.size > deltaReloadThresholdMinPopulationSize) {
        while (this.lastDeltas.length > deltaReloadThresholdCount) {
          this.lastDeltas.pop()
        }

        // console.log(delta);
        // console.log(this.state.lastDeltas);
        // console.log(this.state.lastDeltas.length);

        if (this.lastDeltas.length == deltaReloadThresholdCount) {
          const average =
            this.lastDeltas.reduce((a, b) => a + b, 0) / this.lastDeltas.length

          // console.log(`${average} ${this.state.population.individual_count}`)

          if (
            average > deltaReloadThresholdFrameLength &&
            this.state.population
          ) {
            this.adjustPopulation(this.state.population.size / 2)
          }

          this.lastDeltas = []
        }

        this.lastDeltas.unshift(delta)
      }

      population.tick(delta)

      this.draw()

      if (
        this.state.initialAnimation &&
        new Date().getTime() - this.state.startTimestamp > 2000
        // this.state.population.percent_infected > 0.2
      ) {
        this.toggleAnimation()
      }
    }

    // State needs to update so that percent indicator updates regularly
    // but we don't want to do it so often that it regularly increases the
    // time in ms per frame
    if (lastStateUpdateDelta > 200) {
      this.setState({})
      this.lastStateUpdateTime = time
    }

    this.lastTime = time
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
    const populationSize = this.state.population.size

    this.canvasContext.clearRect(
      0,
      0,
      this.canvasRef.width,
      this.canvasRef.height
    )

    const radius = 3 * devicePixelRatio

    let drawingGroups: DrawIndividual[][] = []
    for (const stateKey of Object.keys(IndividualState)) {
      const stateValue: number = (IndividualState[
        stateKey as any
      ] as unknown) as number
      drawingGroups[stateValue] = []
    }

    for (let i = 0; i < populationSize; i++) {
      const individual = this.state.population.individual_at_index(i)

      const drawIndividual: DrawIndividual = {
        position: {
          x: individual.position.x * this.canvasWidth,
          y: individual.position.y * this.canvasHeight,
        },
        state: individual.state(),
      }

      drawingGroups[drawIndividual.state].push(drawIndividual)
    }

    let lastStyle: IndividualDrawStyle

    this.canvasContext.lineWidth = 2 * devicePixelRatio

    for (const stateNum in drawingGroups) {
      const drawingGroup = drawingGroups[stateNum]

      if (drawingGroup.length == 0) {
        continue
      }

      const newStyle = stateStyleMap[stateNum]

      if (lastStyle) {
        if (!newStyle.fill && lastStyle.fill) {
          this.canvasContext.fillStyle = ""
        }
        if (!newStyle.stroke && lastStyle.stroke) {
          this.canvasContext.strokeStyle = ""
        }
      }

      if (newStyle.stroke) {
        this.canvasContext.strokeStyle = newStyle.stroke
      }

      if (newStyle.fill) {
        this.canvasContext.fillStyle = newStyle.fill
      }

      lastStyle = newStyle

      for (const individual of drawingGroup) {
        const pointX = individual.position.x
        const pointY = individual.position.y

        this.canvasContext.beginPath()
        this.canvasContext.arc(pointX, pointY, radius, 0, 2 * Math.PI, false)
        if (newStyle.fill) {
          this.canvasContext.fill()
        }
        if (newStyle.stroke) {
          this.canvasContext.stroke()
        }
      }
    }
  }

  handleResize() {
    if (!this.canvasRef) {
      return
    }
    const canvas = this.canvasRef
    this.canvasWidth = document.body.clientWidth * devicePixelRatio
    this.canvasHeight = window.innerHeight * devicePixelRatio
    canvas.width = this.canvasWidth
    canvas.height = this.canvasHeight
    this.draw()
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

  // Thanks https://scotch.io/tutorials/get-to-know-the-page-visibility-api
  handleVisibilityChange() {
    if (!document.hidden) {
      return
    }

    if (this.state.animating) {
      this.toggleAnimation()
    }
  }

  toggleAnimation() {
    const animating = !this.state.animating
    if (!animating) {
      cancelAnimationFrame(this.requestFrameFun)
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
      this.requestFrameFun = requestAnimationFrame(this.updateAnimationState)
    }
    this.lastTime = 0
    this.lastDeltas = []
    this.setState({
      animating: !this.state.animating,
      // Cancels initial animation if it is running
      initialAnimation: false,
      // Need to get rid of these
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
    document.addEventListener("visibilitychange", this.handleVisibilityChange)
    this.setState({
      startTimestamp: new Date().getTime(),
    })
    // Set canvas width and height to be used in draw function
    this.handleResize()

    this.requestFrameFun = requestAnimationFrame(this.updateAnimationState)

    document.addEventListener("keypress", this.handleSpacebar)
    this.canvasContext = this.canvasRef.getContext("2d")
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.handleResize)
    window.removeEventListener("scroll", this.handleScroll)
    document.removeEventListener("visibilitychange", this.handleVisibilityChange)
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
              opacity:
                0.6 * this.state.opacity * (this.state.animating ? 1 : 0.5),
              // zIndex: 1,
              verticalAlign: "bottom",
            }}
          />
        </div>
      </div>
    )
  }
}

export default ViralViz
