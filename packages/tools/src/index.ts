import { toolRegistry } from "./registry"
import { FilesystemTool } from "./builtins/filesystem"
import { CalculatorTool } from "./builtins/calculator"
import { ShellTool } from "./builtins/shell"
import { HTTPTool } from "./builtins/http"
import { SearchTool } from "./builtins/search"

toolRegistry.register(new FilesystemTool())
toolRegistry.register(new CalculatorTool())
toolRegistry.register(new ShellTool())
toolRegistry.register(new HTTPTool())
toolRegistry.register(new SearchTool())

export { toolRegistry }
export { BaseTool } from "./interface"
export { FilesystemTool } from "./builtins/filesystem"
export { CalculatorTool } from "./builtins/calculator"
export { ShellTool } from "./builtins/shell"
export { HTTPTool } from "./builtins/http"
export { SearchTool } from "./builtins/search"
