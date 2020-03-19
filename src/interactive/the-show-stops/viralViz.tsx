import React from "react"
import viralVizStyles from "./viralViz.module.css"
import init, { Population } from "./the-show-stops-wasm/pkg"
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

interface DrawCachedIndividual {
  position: {
    x: number
    y: number
  }
  state: number
}

const defaultPopulationSize = 2000

const deltaReloadThresholdCount = 100
// 16ms frame length is 60 FPS so 20ms is slightly below that at 50fps
const deltaReloadThresholdFrameLength = 20

const deltaReloadThresholdMinPopulationSize = defaultPopulationSize / 2 ** 8

class ViralViz extends React.Component<ViralVizProps, ViralVizState> {
  canvasRef: HTMLCanvasElement
  requestFrameFun: any
  lastPercentScrolled: number
  lastTime: number
  lastStateUpdateTime: number
  lastDeltas: number[]
  populationDrawCache: DrawCachedIndividual[]

  constructor(props: any) {
    super(props)
    this.handleResize = this.handleResize.bind(this)
    this.handleSpacebar = this.handleSpacebar.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.toggleAnimation = this.toggleAnimation.bind(this)
    this.updateAnimationState = this.updateAnimationState.bind(this)
    this.initPopulation = this.initPopulation.bind(this)

    this.lastTime = 0
    this.lastStateUpdateTime = 0
    this.lastDeltas = []
    this.populationDrawCache = []
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
      if (
        this.state.population.individual_count >
        deltaReloadThresholdMinPopulationSize
      ) {
        while (this.lastDeltas.length > deltaReloadThresholdCount) {
          this.lastDeltas.pop()
        }

        // console.log(delta);
        // console.log(this.state.lastDeltas);
        // console.log(this.state.lastDeltas.length);

        if (this.lastDeltas.length == deltaReloadThresholdCount) {
          const average =
            this.lastDeltas.reduce((a, b) => a + b, 0) / this.lastDeltas.length

          console.log(`${average} ${this.state.population.individual_count}`);

          if (
            average > deltaReloadThresholdFrameLength &&
            this.state.population
          ) {
            this.lastDeltas = []
            this.adjustPopulation(this.state.population.individual_count / 2)
          }
        }

        this.lastDeltas.unshift(delta)
      }

      population.tick(delta)

      this.draw()

      if (
        this.state.initialAnimation &&
        new Date().getTime() - this.state.startTimestamp > 3000
      ) {
        this.toggleAnimation()
      }
    }

    // State needs to update so that percent indicator updates
    // but we don't want to do it so often that it regularly increases the
    // time in ms per frame
    if (lastStateUpdateDelta > 200) {
      this.setState({})
      this.lastStateUpdateTime = time;
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
    const canvas = this.canvasRef
    const context = canvas.getContext("2d")

    canvas.width = document.body.clientWidth
    canvas.height = window.innerHeight

    for (let i = 0; i < this.state.population.individual_count; i++) {
      const point = this.state.population.individual_at_index(i)
      const radius = 3
      const pointX = canvas.width * point.position.x
      const pointY = canvas.height * point.position.y

      context.beginPath()
      context.arc(pointX, pointY, radius, 0, 2 * Math.PI, false)
      if (point.is_alive) {
        context.fillStyle =
          point.days_infected > 0
            ? point.days_infected > point.incubation_period
              ? point.days_infected > point.days_to_recover
                ? "green"
                : "#DB2E0B"
              : "#DB9D0B"
            : "#555555"
        context.fill()
      } else {
        context.strokeStyle = "#555555"
        context.lineWidth = 2
        context.stroke()
      }
    }
  }

  handleResize() {
    if (!this.canvasRef) {
      return
    }
    const canvas = this.canvasRef
    canvas.width = document.body.clientWidth * devicePixelRatio
    canvas.height = window.innerHeight * devicePixelRatio
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
