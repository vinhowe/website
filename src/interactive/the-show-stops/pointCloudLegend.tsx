import React from "react"

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

const PointCloudLegend = () => {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        marginLeft: -5,
        marginRight: -5,
      }}
    >
      <PointCloudLegendItem name={"Uninfected"} color={"#555555"} />
      <PointCloudLegendItem name={"Incubating"} color={"#DB9D0B"} />
      <PointCloudLegendItem name={"Symptomatic"} color={"#DB2E0B"} />
      <PointCloudLegendItem name={"Recovered"} color={"green"} />
      <PointCloudLegendItem name={"Dead"} color={"#555555"} stroke={true} />
    </div>
  )
}

export default PointCloudLegend
