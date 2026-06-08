import React from 'react'

interface ErrorBoundaryState {
  error: Error | null
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[renderer] unrecoverable render error', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="digital-twin-shell twin-error-shell">
          <section className="twin-render-error">
            <h1>界面渲染异常</h1>
            <p>主界面没有正常渲染，请将下面的错误信息反馈给维护人员。</p>
            <pre>{this.state.error.message || String(this.state.error)}</pre>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
