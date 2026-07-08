import pino from "pino"
import { globalEventBus } from "@lupaflow/core"

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    },
  },
})

globalEventBus.onAny((event) => {
  logger.debug({ event: event.name, id: event.id }, `Event: ${event.name}`)
})

export { logger }
