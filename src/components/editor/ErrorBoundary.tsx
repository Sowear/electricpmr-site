import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">Произошла ошибка</h2>
            <p className="text-sm text-muted-foreground">
              Редактор столкнулся с неожиданной ошибкой. Попробуйте восстановить проект.
            </p>
            {this.state.error && (
              <details className="w-full text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground">Подробнее</summary>
                <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-muted p-2 text-xs text-destructive">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3">
              <Button onClick={this.handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Восстановить
              </Button>
              <Button variant="outline" onClick={() => { window.location.reload() }}>
                Перезагрузить страницу
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
