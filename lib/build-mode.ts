export type BuildMode = "demo" | "dev" | "prod"

const rawMode = (process.env.NEXT_PUBLIC_BUILD_MODE || "demo").toLowerCase()

export const buildMode: BuildMode =
  rawMode === "dev" || rawMode === "prod" ? rawMode : "demo"

export const isDemoBuild = buildMode === "demo"
export const isLiveBuild = !isDemoBuild

