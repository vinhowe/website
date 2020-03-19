import React, { useEffect, useState } from "react"

interface PointCloudLegendElementArgs {
  name: string
  color: string
  stroke?: boolean
}

const PointCloudLegendItem = ({
  name,
  color,
  stroke = false,
}: PointCloudLegendElementArgs) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontFamily: "forma-djr-display",
        fontWeight: "bold",
        marginRight: 5,
        marginLeft: 5,
        color: color,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          marginRight: 5,
          backgroundColor: stroke ? "initial" : color,
          border: stroke ? `2px solid ${color}` : "initial",
          borderRadius: "50%",
        }}
      />
      {name}
    </div>
  )
}

const ViralVizLegend: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  function handleScroll() {
    const percentScrolled = window.scrollY / window.innerHeight
    const percentHeight = Math.min(Math.max(percentScrolled * 15, 0), 1)

    if (!collapsed && percentHeight >= 1) {
      setCollapsed(true)
    } else if (collapsed && percentHeight < 1) {
      setCollapsed(false)
    }
  }

  useEffect(() => {

    window.addEventListener("scroll", handleScroll)

    return function cleanup() {
      window.removeEventListener("scroll", handleScroll)
    }
  })


  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        marginLeft: -5,
        marginRight: -5,
        marginBottom: collapsed ? -28 : 28,
        overflow: "hidden",
        height: collapsed ? 0 : "50px",
        opacity: collapsed ? 0 : 1,
        transition: "all 150ms",
      }}
    >
      <PointCloudLegendItem name={"Uninfected"} color={"#888"} />
      <PointCloudLegendItem name={"Incubating"} color={"#DB9D0B"} />
      <PointCloudLegendItem name={"Symptomatic"} color={"#DB2E0B"} />
      <PointCloudLegendItem name={"Recovered"} color={"green"} />
      <PointCloudLegendItem name={"Dead"} color={"#888"} stroke={true} />
    </div>
  )
}

export default ViralVizLegend
