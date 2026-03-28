import { ComponentType, ReactElement, Suspense } from "react";
import { Loader2 } from "lucide-react";

interface LazyPageProps {
  children: ReactElement;
}

export const LazyPage = ({ children }: LazyPageProps) => (
  <Suspense fallback={
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  }>
    {children}
  </Suspense>
);

interface LazyComponentProps {
  Component: ComponentType<any>;
  [key: string]: any;
}

export const LazyComponent = ({ Component, ...props }: LazyComponentProps) => (
  <Suspense fallback={
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  }>
    <Component {...props} />
  </Suspense>
);