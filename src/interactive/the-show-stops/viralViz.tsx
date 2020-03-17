import React from "react"
import "./viralViz.css"
import init, { Population } from "./the-show-stops-wasm/pkg"

export interface ViralVizState {
  lastTime: number
  lastDeltas: number[]
  population: Population
  animating: boolean
  opacity: number
  initialAnimation: boolean
}

export interface ViralVizProps {
  onToggle?: (animating: boolean) => void
}

const defaultPopulationSize = 2000

const deltaReloadThresholdCount = 10
const deltaReloadThresholdFrameLength = 60

const deltaReloadThresholdMinPopulationSize = defaultPopulationSize / 2 ** 4

class ViralViz extends React.Component<ViralVizProps, ViralVizState> {
  canvasRef: HTMLCanvasElement
  requestFrameFun: any

  constructor(props: any) {
    super(props)
    this.handleResize = this.handleResize.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.toggleAnimation = this.toggleAnimation.bind(this)
    this.updateAnimationState = this.updateAnimationState.bind(this)
    this.initPopulation = this.initPopulation.bind(this)
    this.state = {
      lastTime: 0,
      lastDeltas: [],
      population: null,
      animating: true,
      opacity: 0.35,
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

      if (this.state.initialAnimation && population.percent_infected > 0.2) {
        this.toggleAnimation()
      }
    }
    this.setState(prevState => ({
      lastTime: time,
    }))
    this.requestFrameFun = requestAnimationFrame(this.updateAnimationState)
  }

  componentDidUpdate(
    prevProps: Readonly<{}>,
    prevState: Readonly<ViralVizState>,
    snapshot?: any
  ): void {
    this.draw()
  }

  draw() {
    if (!this.canvasRef || !this.state.population) {
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

      // for (let touch of point.touches) {
      //   const touchX = canvas.width * touch.position.x
      //   const touchY = canvas.height * touch.position.y
      //   context.beginPath()
      //   context.arc(touchX, touchY, radius, 0, 2 * Math.PI, false)
      //   context.fillStyle = `rgba(245,245,245, ${touch.percentMicrobesAlive})`
      //   context.fill()
      // }

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
    this.setState(prevState => prevState)
    if (!this.canvasRef) {
      return
    }
    const canvas = this.canvasRef
    canvas.width = document.body.clientWidth * devicePixelRatio
    canvas.height = window.innerHeight * devicePixelRatio
    this.draw()
  }

  handleScroll() {
    const percentWindowScrolled = window.scrollY / window.innerHeight
    const opacity = 0.35 * (1 - percentWindowScrolled * 2)
    if (opacity < 0.01 && this.state.animating) {
      this.toggleAnimation()
    }
    this.setState({
      opacity,
    })
  }

  toggleAnimation() {
    const animating = !this.state.animating
    if (!animating) {
      cancelAnimationFrame(this.requestFrameFun)
    } else {
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

  componentDidMount(): void {
    window.addEventListener("resize", this.handleResize)
    window.addEventListener("scroll", this.handleScroll)
    this.requestFrameFun = requestAnimationFrame(this.updateAnimationState)
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this.handleResize)
    window.removeEventListener("scroll", this.handleScroll)
    cancelAnimationFrame(this.requestFrameFun)
  }

  render() {
    return (
      <div>
        <span
          className={!this.state.animating ? "feature-title-outline" : ""}
          style={{
            marginLeft: 10,
            marginRight: 10,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => this.toggleAnimation()}
        >
          <i
            className="material-icons"
            style={{
              fontSize: 80,
            }}
          >
            {this.state.animating ? "pause" : "play_arrow"}
          </i>
        </span>

        <div
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1000,
          }}
          className={"point-cloud-container"}
        >
          <canvas
            ref={this.setCanvasRef}
            style={{
              width: "100vw",
              height: "100vh",
              transition: "opacity fade-out 500ms",
              opacity:
                this.state.opacity + 0.1 * (this.state.animating ? 1 : 0),
              zIndex: -1000,
              verticalAlign: "bottom",
            }}
          />
        </div>
      </div>
    )
  }
}

export default ViralViz
