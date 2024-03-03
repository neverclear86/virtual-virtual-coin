export const unixtime = (d: Date) => Math.floor(d.getTime() / 1000)
export const now = () => unixtime(new Date())
