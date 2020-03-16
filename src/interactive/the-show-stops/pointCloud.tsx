import React, { RefObject } from "react"
import "./pointCloud.css"

interface Vector {
  x: number
  y: number
}

interface Touch {
  percentMicrobesAlive: number
  position: Vector
}

export interface Point {
  incubationPeriod: number
  daysToRecover: number
  age: number
  isAlive: boolean
  daysInfected: number
  percentInfectedQuarantineThreshold: number
  maxVelocity: number
  // Position is fractional position from 0 to 1
  position: Vector
  velocity: Vector
  touches: Touch[]
}

export interface PointCloudState {
  points: Point[]
  ticks: number
  lastTime: number
  percentInfected: number
}

const pointCount = 500

class PointCloud extends React.Component<{}, PointCloudState> {
  canvasRef: HTMLCanvasElement
  requestFrameFun: any

  constructor(props: any) {
    super(props)
    this._handleResize = this._handleResize.bind(this)
    this.updateAnimationState = this.updateAnimationState.bind(this)
    this.state = {
      points: [],
      ticks: 0,
      lastTime: 0,
      percentInfected: 0,
    }
    this.setInitialPopulation = this.setInitialPopulation.bind(this)
  }

  setInitialPopulation() {
    const points: Point[] = []
    const infectedIndex = Math.round(Math.random() * pointCount)
    for (let i = 0; i < pointCount; i++) {
      const isInfected = i == infectedIndex
      points.push({
        incubationPeriod: 4 + Math.round(Math.random() * 20),
        daysToRecover: 4 + Math.round(Math.random() * 20),
        age: 90 - Math.random() * 90,
        daysInfected: isInfected ? 1 : -1,
        // Some people are more cautious
        percentInfectedQuarantineThreshold:
          1 - Math.random() * (Math.random() < 0.25 ? 0.7 : 0.5),
        position: {
          x: Math.random(),
          y: Math.random(),
        },
        maxVelocity: 0.05 + Math.random() * 0.3,
        isAlive: true,
        velocity: {
          x: (Math.random() * 2 - 1) / 20,
          y: (Math.random() * 2 - 1) / 20,
        },
        touches: [],
      })
    }

    this.setState({ points: points })
  }

  setCanvasRef = (ref: HTMLCanvasElement): void => {
    this.canvasRef = ref
    this._handleResize()
  }

  updateAnimationState(time: number) {
    let delta = this.state.lastTime == 0 ? 0 : time - this.state.lastTime
    if (delta > 100) {
      // Handle sudden time jumps (like leaving the tab)
      delta = 0
    }
    const points = this.state.points
    const percentSecond = delta / 1000
    const lastPercentInfected = this.state.percentInfected
    let totalInfected = 0

    for (let i = 0; i < pointCount; i++) {
      const point = points[i]
      const showingSymptoms =
        point.daysInfected > point.incubationPeriod &&
        point.daysInfected < point.daysToRecover

      if (point.isAlive) {
        point.position.x += point.velocity.x * percentSecond
        point.position.y += point.velocity.y * percentSecond

        if (point.position.x > 1) {
          point.position.x = 0
        }

        if (point.position.x < 0) {
          point.position.x = 1
        }

        if (point.position.y > 1) {
          point.position.y = 0
        }

        if (point.position.y < 0) {
          point.position.y = 1
        }

        if (
          Math.random() < 0.01 * (1 - this.state.percentInfected ** (1 / 5)) &&
          !showingSymptoms &&
          lastPercentInfected < point.percentInfectedQuarantineThreshold
        ) {
          point.velocity.x +=
            (Math.random() * 2 - 1) * 0.05 * (1 - lastPercentInfected)
          point.velocity.y +=
            (Math.random() * 2 - 1) * 0.05 * (1 - lastPercentInfected)
        }
      }

      if (point.daysInfected > 0) {
        totalInfected++
        point.daysInfected += percentSecond

        const newTouches: Touch[] = []

        for (let touch of point.touches) {
          const newTouch = touch
          newTouch.percentMicrobesAlive -= 0.5 * percentSecond
          if (newTouch.percentMicrobesAlive > 0.1) {
            newTouches.push(newTouch)
          }
        }

        if (Math.random() < 0.01 && !showingSymptoms && point.isAlive) {
          newTouches.push({
            percentMicrobesAlive: 1,
            position: {
              x: point.position.x + (Math.random() * 2 - 1) * 0.05,
              y: point.position.y + (Math.random() * 2 - 1) * 0.05,
            },
          })
        }

        point.touches = newTouches

        if (point.daysInfected < point.daysToRecover) {
          if (point.age > 60) {
            if (Math.random() < 0.02 / point.daysToRecover) {
              point.isAlive = false
            }
          } else {
            if (Math.random() < 0.001 / point.daysToRecover) {
              point.isAlive = false
            }
          }
        }
      }
      for (let j = 0; j < pointCount; j++) {
        if (i == j) {
          continue
        }
        const otherPoint = points[j]
        if (
          otherPoint.daysInfected < 1 ||
          otherPoint.daysInfected > otherPoint.daysToRecover ||
          !otherPoint.isAlive
        ) {
          continue
        }
        const pointDistX = point.position.x - otherPoint.position.x
        const pointDistY = point.position.y - otherPoint.position.y
        const pointDist = Math.hypot(
          Math.pow(pointDistX, 2),
          Math.pow(pointDistY, 2)
        )

        if (
          point.daysInfected < point.incubationPeriod &&
          otherPoint.daysInfected > otherPoint.incubationPeriod &&
          lastPercentInfected < point.percentInfectedQuarantineThreshold &&
          pointDist < 0.01
        ) {
          // http://exploratoria.github.io/exhibits/astronomy/gravitating-system/
          // 100 is our minimum distance so things don't get too crazy

          const d2 = Math.max(pointDist ** 2, 0.001)
          const magnitude = 6.67e-11 / d2 / Math.sqrt(d2)

          point.velocity.x += magnitude * pointDistX * 1000
          point.velocity.y += magnitude * pointDistY * 1000
        }

        if (point.daysInfected > 0) {
          continue
        }

        if (pointDist < 0.0001 && Math.random() < 0.025) {
          point.daysInfected = 1
          break
        }

        for (const otherPointTouch of otherPoint.touches) {
          const touchDistX = point.position.x - otherPointTouch.position.x
          const touchDistY = point.position.y - otherPointTouch.position.y
          const dist = Math.hypot(
            Math.pow(touchDistX, 2),
            Math.pow(touchDistY, 2)
          )
          if (dist < 0.0001 && Math.random() < 0.025) {
            point.daysInfected = 1
            break
          }
        }
      }

      point.velocity.x *= 1 - 0.3 * percentSecond
      point.velocity.y *= 1 - 0.3 * percentSecond

      point.velocity.x = Math.max(-1, Math.min(1, point.velocity.x))
      point.velocity.y = Math.max(-1, Math.min(1, point.velocity.y))
    }

    this.setState(prevState => ({
      ticks: prevState.ticks + 1,
      lastTime: time,
      percentInfected: totalInfected / pointCount,
    }))
    this.requestFrameFun = requestAnimationFrame(this.updateAnimationState)
  }

  componentDidUpdate(
    prevProps: Readonly<{}>,
    prevState: Readonly<PointCloudState>,
    snapshot?: any
  ): void {
    this.draw()
  }

  draw() {
    if (!this.canvasRef || !this.state || !this.state.points) {
      return
    }
    const canvas = this.canvasRef
    const context = canvas.getContext("2d")

    canvas.width = document.body.clientWidth
    canvas.height = window.innerHeight

    const points = this.state.points
    for (let point of points) {
      // const radius = 1 + point.age * 0.03
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
      if (point.isAlive) {
        context.fillStyle =
          point.daysInfected > 0
            ? point.daysInfected > point.incubationPeriod
              ? // ? point.daysInfected > point.daysToRecover
                //   ? "green"
                /*:*/ "#DB2E0B"
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

  _handleResize() {
    this.setState(prevState => prevState)
    if (!this.canvasRef) {
      return
    }
    const canvas = this.canvasRef
    canvas.width = document.body.clientWidth * devicePixelRatio
    canvas.height = window.innerHeight * devicePixelRatio
    this.draw()
  }

  componentDidMount(): void {
    this.setInitialPopulation()
    window.addEventListener("resize", this._handleResize)
    this.requestFrameFun = requestAnimationFrame(this.updateAnimationState)
  }

  componentWillUnmount(): void {
    window.removeEventListener("resize", this._handleResize)
    cancelAnimationFrame(this.requestFrameFun)
  }

  render() {
    // @ts-ignore
    return (
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
            opacity: 0.35,
            zIndex: -1000,
            verticalAlign: "bottom",
          }}
        />
      </div>
    )
  }
}

export default PointCloud
