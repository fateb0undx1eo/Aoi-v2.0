function Skeleton({ width = '100%', height = '20px', borderRadius = '12px', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  )
}

export default Skeleton
