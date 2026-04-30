import React, { ComponentType, ReactElement, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Error Boundary to catch ChunkLoadErrors after deployments
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Caught error in LazyComponent:", error);
    // If it's a chunk load error (common after new deployments), force reload
    if (error.name === 'ChunkLoadError' || error.message.includes('dynamically imported module')) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <p className="text-muted-foreground mb-4">Произошла ошибка при загрузке страницы.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Обновить страницу
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface LazyPageProps {
  children: ReactElement;
}

export const LazyPage = ({ children }: LazyPageProps) => (
  <ErrorBoundary>
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      {children}
    </Suspense>
  </ErrorBoundary>
);

interface LazyComponentProps {
  Component: ComponentType<any>;
  [key: string]: any;
}

export const LazyComponent = ({ Component, ...props }: LazyComponentProps) => (
  <ErrorBoundary>
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <Component {...props} />
    </Suspense>
  </ErrorBoundary>
);